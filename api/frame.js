export default async function handler(req, res) {
  const body = req.body;

  const buttonIndex = body?.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    return res.status(200).json({
      frames: [
        {
          image: "https://raw.githubusercontent.com/Eccentrichealerbuilds/Kits/refs/heads/main/Nornal%20candies%20kit/compressed_1746409789139.png",
          post_url: "https://monsurf.vercel.app/",
          buttons: [{ label: "Next Recruit" }],
        },
      ],
    });
  }

  res.status(200).json({
    frames: [
      {
        image: "https://raw.githubusercontent.com/Eccentrichealerbuilds/Kits/refs/heads/main/Nornal%20candies%20kit/compressed_1746409789139.png",
        post_url: "https://monsurf.vercel.app/",
        buttons: [{ label: "Join Ponzi" }],
      },
    ],
  });
}
