import express from "express";
const router = express.Router();

router.post("/gitlab", async (req, res) => {
  const event = req.headers["x-gitlab-event"];
  const payload = req.body;

  if (
    event === "Merge Request Hook" &&
    payload.object_attributes.action === "open"
  ) {
    console.log(
      "📥 New GitLab MR opened:",
      payload.object_attributes.source_branch
    );
    // TODO: fetch diff and call MCP reviewComments tool
  }

  res.status(200).send("GitLab webhook received");
});

export default router;
