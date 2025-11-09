import express from "express";

const router = express.Router();

/**
 * GitHub webhook handler for pull request events
 */
router.post("/github", async (req, res) => {
  try {
    const event = req.headers["x-github-event"] as string;
    const payload = req.body;

    console.log(`📨 GitHub webhook received: ${event}`);

    // Handle pull request events
    if (event === "pull_request" && payload.action === "opened") {
      const prData = {
        number: payload.pull_request.number,
        title: payload.pull_request.title,
        author: payload.pull_request.user.login,
        diffUrl: payload.pull_request.diff_url,
        htmlUrl: payload.pull_request.html_url,
        repository: payload.repository.full_name,
        branch: {
          head: payload.pull_request.head.ref,
          base: payload.pull_request.base.ref,
        },
      };

      console.log("📥 New GitHub PR opened:", {
        repository: prData.repository,
        number: prData.number,
        title: prData.title,
        author: prData.author,
        branch: `${prData.branch.head} → ${prData.branch.base}`,
        diffUrl: prData.diffUrl,
      });

      // TODO: Implement integration with MCP reviewComments tool
      // This would involve:
      // 1. Fetching the diff from diffUrl
      // 2. Calling the MCP reviewComments tool
      // 3. Posting review comments back to GitHub

      res.status(200).json({
        message: "GitHub PR webhook received",
        event,
        action: payload.action,
        pullRequest: {
          number: prData.number,
          title: prData.title,
          repository: prData.repository,
        },
        status: "processed",
      });

      return;
    }

    // Handle push events
    if (event === "push") {
      const pushData = {
        repository: payload.repository.full_name,
        branch: payload.ref.replace("refs/heads/", ""),
        commits: payload.commits.length,
        pusher: payload.pusher.name,
        headCommit: payload.head_commit,
      };

      console.log("📤 GitHub push event:", {
        repository: pushData.repository,
        branch: pushData.branch,
        commits: pushData.commits,
        pusher: pushData.pusher,
        lastCommit: pushData.headCommit?.message,
      });

      res.status(200).json({
        message: "GitHub push webhook received",
        event,
        repository: pushData.repository,
        branch: pushData.branch,
        commits: pushData.commits,
        status: "processed",
      });

      return;
    }

    // Handle other GitHub events
    console.log(`📋 GitHub event ${event} received but not processed`);

    res.status(200).json({
      message: "GitHub webhook received",
      event,
      status: "acknowledged",
    });
  } catch (error) {
    console.error("❌ Error processing GitHub webhook:", error);

    res.status(500).json({
      error: "Failed to process GitHub webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Health check endpoint for GitHub webhooks
 */
router.get("/github/health", (req, res) => {
  res.json({
    service: "GitHub Webhook Handler",
    status: "healthy",
    timestamp: new Date().toISOString(),
    supportedEvents: ["pull_request", "push"],
  });
});

/**
 * Test endpoint for webhook validation
 */
router.get("/github/test", (req, res) => {
  res.json({
    message: "GitHub webhook endpoint is active",
    endpoint: "/webhook/github",
    methods: ["POST"],
    headers: {
      required: ["x-github-event"],
      optional: ["x-github-delivery", "x-hub-signature-256"],
    },
  });
});

export default router;
