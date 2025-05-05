export default async function handler(req, res) {
  const body = req.body;

  const buttonIndex = body?.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    return res.status(200).json({
      frames: [
        {
          image: "https://your-image-link-here",
          post_url: "https://monsurf.vercel.app/",
          buttons: [{ label: "Next Recruit" }],
        },
      ],
    });
  }

  res.status(200).json({
    frames: [
      {
        image: "https://your-image-link-here",
        post_url: "https://your-vercel-url.vercel.app/api/frame",
        buttons: [{ label: "Join Ponzi" }],
      },
    ],
  });
}
