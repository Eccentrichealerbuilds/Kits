// Import necessary helpers
const express = require('express');
const ethers = require('ethers');

// Load the ABI for BaseEmpireNft
// Make sure you have created './abi/BaseEmpireNft.json' file with the ABI array
let baseEmpireNftAbi;
try {
    baseEmpireNftAbi = require('./abi/BaseEmpireNft.json');
} catch (error) {
    console.error("Error loading BaseEmpireNft ABI from ./abi/BaseEmpireNft.json");
    console.error("Please create the file with the ABI array from your contract build output.");
    process.exit(1); // Stop the server if ABI is missing
}

// --- Configuration ---
// TODO: Move sensitive data (like PRIVATE_KEY) to environment variables in a real app!
const PORT = process.env.PORT || 3000; // Port the server will listen on
const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz'; // Monad Testnet RPC

// 🚨 DANGER ZONE START - Replace placeholders carefully! Keep Private Key SAFE! 🚨
const SERVER_PRIVATE_KEY = '034b3518da14496c52cc8b3ac01881f948698e7b3f13a5b8b7b4180731b561e5'; // Use a TESTNET key! Do not share!

// Your LATEST Deployed Contract Addresses
const PLAYER_REGISTRY_ADDRESS = '0x2fC46673C5eD43bB61Daa29CDf04A8918E8a97EB'; // If needed later
const BASE_EMPIRE_NFT_ADDRESS = '0x85e005893c37D7289bAe188BE56E7f531d2932e7'; // The latest one!
const BATTLE_MANAGER_ADDRESS = '0x23F20D7De846C6886B401227946B80eAeCCb2F5b'; // The latest one!

// Your Public Server URL (e.g., from ngrok) - needed for post_url in frames
const MY_SERVER_PUBLIC_URL = 'https://95e1-206-72-205-55.ngrok-free.app'; // Example: https://random-code.ngrok.io

// Simple FID to Wallet Address Mapping (FOR TESTING ONLY!)
// TODO: Replace with a better method later (API lookup, on-chain registry, etc.)
const fidToAddressMap = {
    1073979: "0x5EE15251C47e60769F2E63605d4323ba54c07983", // Example: 123: "0x123..." Replace with YOUR FID and Address!
    // Add other test mappings if needed:
    // ANOTHER_FID: "ANOTHER_WALLET_ADDRESS"
};
// 🚨 DANGER ZONE END 🚨

// --- Blockchain Connection Setup ---
let provider;
let serverWallet;
let nftContract; // Declare here to be accessible in routes

try {
    provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
    serverWallet = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);
    // Connect to the BaseEmpireNft contract
    nftContract = new ethers.Contract(BASE_EMPIRE_NFT_ADDRESS, baseEmpireNftAbi, provider);
    console.log(`Server Wallet Address: ${serverWallet.address}`);
    console.log(`Connected to BaseEmpireNft at: ${BASE_EMPIRE_NFT_ADDRESS}`);
    // TODO: Ensure serverWallet address is Owner of BattleManager if needed
} catch (error) {
    console.error("Error setting up blockchain connection:", error);
    process.exit(1);
}


// --- Basic Web Server Setup ---
const app = express();
app.use(express.json()); // Allow server to understand JSON requests

// --- Simple "Hello World" Route ---
app.get('/', (req, res) => {
    res.send('Hello! Your Social Idle Empire Frame Server is running!');
});


// --- Dynamic Main Frame Endpoint ---
// Reads blockchain state and shows it in the frame
app.post('/api/frame', async (req, res) => { // Use POST as Farcaster sends POST
    console.log('Received POST request for dynamic /api/frame');

    let userAddress = '';
    let tokenId = 0;
    let level = 0;
    let cows = 0;
    let claimable = '0';
    let balance = '0';
    let imageUrl = `https://placehold.co/600x314/CCCCCC/000/png?text=Error+Reading+State`; // Default error image

    try {
        const fid = req.body?.untrustedData?.fid;
        console.log("Interacting FID:", fid);

        if (!fid) {
            console.log("Missing FID in request body.");
            imageUrl = `https://placehold.co/600x314/FF0000/FFF/png?text=Missing+FID+in+request`;
        } else {
             userAddress = fidToAddressMap[fid] || null;

            if (!userAddress) {
                console.log("Could not find address for FID:", fid);
                imageUrl = `https://placehold.co/600x314/FF0000/FFF/png?text=Register+FID+${fid}?`;
            } else {
                console.log("User Address:", userAddress);

                // Determine user's tokenId (very basic)
                const nftBalance = await nftContract.balanceOf(userAddress);
                if (nftBalance > 0) {
                     tokenId = 0; // Assume token 0 if they own any NFT

                    // Read Blockchain Data
                    level = Number(await nftContract.getLevel(tokenId));
                    cows = Number(await nftContract.getCowCount(tokenId));
                    claimable = ethers.formatUnits(await nftContract.claimableResources(tokenId), 0);
                } else {
                    // User doesn't own an NFT on this contract yet
                     level = 0;
                     cows = 0;
                     claimable = '0'; // Or maybe show a "Mint NFT" button?
                     console.log("User does not own an NFT on this contract.");
                }
                // Always get resource balance
                 balance = ethers.formatUnits(await nftContract.resourceBalances(userAddress), 0);


                // Generate Dynamic Image URL
                const imageText = `Lvl:${level} Cows:${cows} Coins:${balance} Claim:${claimable}`;
                const encodedText = encodeURIComponent(imageText);
                imageUrl = `https://placehold.co/600x314/006600/FFF/png?text=${encodedText}`;
                console.log("State:", imageText);
            }
        }

    } catch (error) {
        console.error("Error fetching frame data:", error);
        // Keep the default error image from initialization
    }

    // Send Frame HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Social Idle Empire Frame</title>
            <meta property="og:title" content="Social Idle Empire">
            <meta property="og:image" content="${imageUrl}">
            <meta property="fc:frame" content="vNext">
            <meta property="fc:frame:image" content="${imageUrl}">
            <meta property="fc:frame:post_url" content="${MY_SERVER_PUBLIC_URL}/api/frame/action">
            <meta property="fc:frame:button:1" content="🔄 Refresh">
            <meta property="fc:frame:button:2" content="💰 Claim ${claimable}">
            <meta property="fc:frame:button:3" content="➕ Build/Raise">
            <meta property="fc:frame:button:4" content="⚔️ Battle!">
        </head>
        <body>
            <h1>Social Idle Empire Frame Server</h1>
            <p>FID: ${req.body?.untrustedData?.fid || 'N/A'} | Address: ${userAddress || 'Unknown'}</p>
            <img src="${imageUrl}" />
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
});

// --- Simple Handler for Button Actions ---
// TODO: Make this dynamic later! Reads button ID and performs action.
app.post('/api/frame/action', (req, res) => {
     console.log('Received action POST. Request Body:', JSON.stringify(req.body, null, 2)); // Log body

     // --- TODO ---
     // 1. Validate the Frame Signature (important for security!)
     // 2. Read untrustedData.buttonIndex from req.body to know which button was clicked (1, 2, 3, or 4)
     // 3. Based on buttonIndex, prepare and send a blockchain transaction (e.g., claimResources)
     //    OR prepare the next frame (e.g., show build menu).
     // 4. Return the *next* Frame HTML based on the action result.

     // For now, just return a "Refreshed" frame like before
     const imageUrl = 'https://placehold.co/600x314/006699/FFF/png?text=Action+Received!+(TODO)'; // Blue background
     const html = `
        <!DOCTYPE html><html><head><title>Action</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:post_url" content="${MY_SERVER_PUBLIC_URL}/api/frame" />
        <meta property="fc:frame:button:1" content="⬅️ Back to Status" />
        </head><body>Action Received! Implement logic!</body></html>
     `;
     // Send back to main frame for "Back" button
     res.setHeader('Content-Type', 'text/html');
     res.status(200).send(html);
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Public URL configured as: ${MY_SERVER_PUBLIC_URL}`); // Check this!
    console.log(`Make sure contract addresses are correct!`);
    console.log(`BaseEmpireNft: ${BASE_EMPIRE_NFT_ADDRESS}`);
    console.log(`BattleManager: ${BATTLE_MANAGER_ADDRESS}`);
});
