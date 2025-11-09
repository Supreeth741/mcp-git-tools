#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import * as dotenv from "dotenv";
import * as gitService from "./services/gitService.js";

// Load environment variables
dotenv.config();

// Create MCP server instance
const server = new Server(
  {
    name: "mcp-git-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * Health check handler
 */
async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "git-status",
        description: "Get the current Git status of the repository",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the Git repository (defaults to current directory)",
            },
          },
        },
      },
      {
        name: "git-log",
        description: "Get Git commit history",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the Git repository (defaults to current directory)",
            },
            limit: {
              type: "number",
              description: "Number of commits to retrieve (default: 10)",
              default: 10,
            },
            branch: {
              type: "string",
              description:
                "Branch to get log from (defaults to current branch)",
            },
          },
        },
      },
      {
        name: "git-diff",
        description: "Get Git diff for changes",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the Git repository (defaults to current directory)",
            },
            staged: {
              type: "boolean",
              description: "Show staged changes (default: false)",
              default: false,
            },
            file: {
              type: "string",
              description: "Specific file to show diff for",
            },
          },
        },
      },
      {
        name: "git-branch",
        description: "List, create, or switch Git branches",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the Git repository (defaults to current directory)",
            },
            action: {
              type: "string",
              enum: ["list", "create", "switch", "delete"],
              description: "Action to perform with branches",
              default: "list",
            },
            branchName: {
              type: "string",
              description:
                "Branch name (required for create, switch, delete actions)",
            },
          },
        },
      },
      {
        name: "git-commit",
        description: "Create a Git commit with staged changes",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the Git repository (defaults to current directory)",
            },
            message: {
              type: "string",
              description: "Commit message",
            },
            addAll: {
              type: "boolean",
              description:
                "Stage all changes before committing (default: false)",
              default: false,
            },
          },
          required: ["message"],
        },
      },
      {
        name: "health-check",
        description: "Check server health status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "health-check":
        const healthResult = await healthCheck();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(healthResult, null, 2),
            },
          ],
        };

      case "git-status":
        try {
          const repoPath = args?.path as string | undefined;
          const detailedStatus = await gitService.getDetailedStatus(repoPath);
          const repositoryInfo = await gitService.getRepositoryInfo(repoPath);

          return {
            content: [
              {
                type: "text",
                text: `# Git Status Report

## Repository Information
- **Branch:** ${detailedStatus.branch}
- **Repository Root:** ${repositoryInfo.rootPath || "N/A"}
- **Is Git Repository:** ${repositoryInfo.isRepo ? "Yes" : "No"}

## Branch Status
- **Ahead:** ${detailedStatus.ahead} commits
- **Behind:** ${detailedStatus.behind} commits

## File Changes
### Staged Files (${detailedStatus.staged.length})
${
  detailedStatus.staged.length > 0
    ? detailedStatus.staged.map((file) => `- ${file}`).join("\n")
    : "No staged files"
}

### Modified Files (${detailedStatus.modified.length})
${
  detailedStatus.modified.length > 0
    ? detailedStatus.modified.map((file) => `- ${file}`).join("\n")
    : "No modified files"
}

### Untracked Files (${detailedStatus.untracked.length})
${
  detailedStatus.untracked.length > 0
    ? detailedStatus.untracked.map((file) => `- ${file}`).join("\n")
    : "No untracked files"
}

### Deleted Files (${detailedStatus.deleted.length})
${
  detailedStatus.deleted.length > 0
    ? detailedStatus.deleted.map((file) => `- ${file}`).join("\n")
    : "No deleted files"
}

### Renamed Files (${detailedStatus.renamed.length})
${
  detailedStatus.renamed.length > 0
    ? detailedStatus.renamed
        .map((rename) => `- ${rename.from} → ${rename.to}`)
        .join("\n")
    : "No renamed files"
}

### Conflicted Files (${detailedStatus.conflicted.length})
${
  detailedStatus.conflicted.length > 0
    ? detailedStatus.conflicted.map((file) => `- ${file}`).join("\n")
    : "No conflicts"
}

## Remote Information
${
  repositoryInfo.remotes && repositoryInfo.remotes.length > 0
    ? repositoryInfo.remotes.map((remote) => `- ${remote}`).join("\n")
    : "No remotes configured"
}
`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting Git status: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }

      case "git-log":
        try {
          const repoPath = args?.path as string | undefined;
          const limit = (args?.limit as number | undefined) || 10;
          const branch = args?.branch as string | undefined;

          const options: { limit: number; branch?: string } = { limit };
          if (branch) {
            options.branch = branch;
          }

          const commits = await gitService.getCommits(repoPath, options);

          const currentBranch = await gitService.getCurrentBranch(repoPath);

          return {
            content: [
              {
                type: "text",
                text: `# Git Commit History

## Branch: ${branch || currentBranch}
**Showing last ${limit} commits**

${commits.all
  .map(
    (commit, index) => `
### ${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.date}
**Author:** ${commit.author_name} <${commit.author_email}>
**Message:** ${commit.message}
${commit.body ? `**Body:** ${commit.body}` : ""}
---`
  )
  .join("\n")}

**Total commits shown:** ${commits.all.length}
`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting Git log: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }

      case "git-diff":
        try {
          const repoPath = args?.path as string | undefined;
          const staged = (args?.staged as boolean) || false;
          const file = args?.file as string | undefined;

          const diff = await gitService.getDiff(staged, repoPath, file);

          if (!diff || diff.trim() === "") {
            return {
              content: [
                {
                  type: "text",
                  text: `# Git Diff

No ${staged ? "staged" : "unstaged"} changes found${
                    file ? ` for file: ${file}` : ""
                  }.
${
  staged
    ? "Use `git add <file>` to stage changes."
    : "Use `git add <file>` to stage files for commit."
}
`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `# Git Diff ${
                  staged ? "(Staged Changes)" : "(Working Directory)"
                }
${file ? `\n**File:** ${file}` : ""}

\`\`\`diff
${diff}
\`\`\`
`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting Git diff: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }

      case "git-branch":
        try {
          const repoPath = args?.path as string | undefined;
          const action = (args?.action as string) || "list";
          const branchName = args?.branchName as string | undefined;

          switch (action) {
            case "list":
              const branches = await gitService.getBranches(repoPath);
              return {
                content: [
                  {
                    type: "text",
                    text: `# Git Branches

## Current Branch: ${branches.current}

### Local Branches
${branches.local
  .map((branch) =>
    branch === branches.current ? `* ${branch} (current)` : `  ${branch}`
  )
  .join("\n")}

### Remote Branches
${
  branches.remote.length > 0
    ? branches.remote.map((branch) => `  ${branch}`).join("\n")
    : "No remote branches"
}

**Total:** ${branches.local.length} local, ${branches.remote.length} remote
`,
                  },
                ],
              };

            case "create":
              if (!branchName) {
                throw new Error("Branch name is required for create action");
              }
              await gitService.createBranch(branchName, repoPath);
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ Successfully created and switched to branch: ${branchName}`,
                  },
                ],
              };

            case "switch":
              if (!branchName) {
                throw new Error("Branch name is required for switch action");
              }
              await gitService.switchBranch(branchName, repoPath);
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ Successfully switched to branch: ${branchName}`,
                  },
                ],
              };

            case "delete":
              if (!branchName) {
                throw new Error("Branch name is required for delete action");
              }
              await gitService.deleteBranch(branchName, repoPath);
              return {
                content: [
                  {
                    type: "text",
                    text: `✅ Successfully deleted branch: ${branchName}`,
                  },
                ],
              };

            default:
              throw new Error(
                `Unknown branch action: ${action}. Use: list, create, switch, delete`
              );
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error with Git branch operation: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }

      case "git-commit":
        try {
          const repoPath = args?.path as string | undefined;
          const message = args?.message as string;
          const addAll = (args?.addAll as boolean) || false;

          if (!message) {
            throw new Error("Commit message is required");
          }

          // Get status before committing
          const statusBefore = await gitService.getDetailedStatus(repoPath);

          if (!addAll && statusBefore.staged.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ No staged changes to commit.

**Available changes:**
- Modified: ${statusBefore.modified.length} files
- Untracked: ${statusBefore.untracked.length} files
- Deleted: ${statusBefore.deleted.length} files

Use \`addAll: true\` to stage all changes, or stage files manually with git add.
`,
                },
              ],
            };
          }

          await gitService.createCommit(message, repoPath, addAll);

          // Get current commit info
          const commits = await gitService.getCommits(repoPath, { limit: 1 });
          const latestCommit = commits.all[0];

          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully created commit!

**Commit Details:**
- **Hash:** ${latestCommit?.hash.substring(0, 8)}
- **Message:** ${message}
- **Author:** ${latestCommit?.author_name} <${latestCommit?.author_email}>
- **Date:** ${latestCommit?.date}
- **Files Changed:** ${
                  addAll
                    ? `${
                        statusBefore.modified.length +
                        statusBefore.untracked.length +
                        statusBefore.deleted.length
                      }`
                    : statusBefore.staged.length
                }

${
  addAll
    ? `**Auto-staged and committed:**
${
  statusBefore.modified.length > 0
    ? `- Modified: ${statusBefore.modified.join(", ")}`
    : ""
}
${
  statusBefore.untracked.length > 0
    ? `- Added: ${statusBefore.untracked.join(", ")}`
    : ""
}
${
  statusBefore.deleted.length > 0
    ? `- Deleted: ${statusBefore.deleted.join(", ")}`
    : ""
}`
    : ""
}
`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating commit: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "git://repository-info",
        name: "Repository Information",
        description: "Current Git repository information",
        mimeType: "application/json",
      },
    ],
  };
});

/**
 * Read resource content
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "git://repository-info":
      try {
        const repoInfo = await gitService.getRepositoryInfo();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  repository: repoInfo,
                  timestamp: new Date().toISOString(),
                  server: "mcp-git-tools",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  error: "Failed to get repository information",
                  message:
                    error instanceof Error ? error.message : String(error),
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

/**
 * List available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "commit-message",
        description: "Generate a commit message based on staged changes",
        arguments: [
          {
            name: "path",
            description: "Path to the Git repository",
            required: false,
          },
        ],
      },
    ],
  };
});

/**
 * Get prompt content
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "commit-message":
      return {
        description: "Generate a commit message based on staged changes",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Commit message generation - not implemented yet",
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

/**
 * Create Express HTTP server for health checks and testing
 */
function createHttpServer() {
  const app = express();
  const PORT = process.env.HTTP_PORT || 4000;

  // Health check endpoint
  app.get("/", async (req, res) => {
    try {
      const health = await healthCheck();
      res.json({
        message: "MCP Git Tools Server is running",
        server: "mcp-git-tools",
        version: "1.0.0",
        health,
        endpoints: {
          health: "/health",
          status: "/status",
          tools: "/tools",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Server health check failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Dedicated health endpoint
  app.get("/health", async (req, res) => {
    try {
      const health = await healthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        error: "Health check failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Server status endpoint
  app.get("/status", (req, res) => {
    res.json({
      server: "mcp-git-tools",
      version: "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    });
  });

  // List available tools endpoint
  app.get("/tools", (req, res) => {
    res.json({
      tools: [
        "git-status",
        "git-log",
        "git-diff",
        "git-branch",
        "git-commit",
        "health-check",
      ],
      count: 6,
      description: "Available MCP tools for Git operations",
    });
  });

  return { app, PORT };
}

/**
 * Start the server (both MCP stdio and HTTP)
 */
async function main() {
  const runHttpServer =
    process.env.HTTP_SERVER === "true" || process.argv.includes("--http");

  if (runHttpServer) {
    // Start HTTP server for testing
    const { app, PORT } = createHttpServer();

    const httpServer = app.listen(PORT, () => {
      console.error(`HTTP server running on http://localhost:${PORT}`);
      console.error(`Try: curl http://localhost:${PORT}`);
    });

    // Graceful shutdown for HTTP server
    const shutdown = async () => {
      console.error("Shutting down HTTP server...");
      httpServer.close(() => {
        console.error("HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    // Start MCP stdio server (default behavior)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Git Tools server running on stdio");
  }
}

// Handle graceful shutdown for MCP server (only if not running HTTP server)
process.on("SIGINT", async () => {
  if (process.env.HTTP_SERVER !== "true" && !process.argv.includes("--http")) {
    console.error("Received SIGINT, shutting down gracefully...");
    await server.close();
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  if (process.env.HTTP_SERVER !== "true" && !process.argv.includes("--http")) {
    console.error("Received SIGTERM, shutting down gracefully...");
    await server.close();
    process.exit(0);
  }
});

// Start the server if this file is run directly
if (
  process.argv[1]?.endsWith("server.js") ||
  process.argv[1]?.endsWith("server.ts")
) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

export { server };
