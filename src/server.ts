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
import * as dotenv from "dotenv";

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
        return {
          content: [
            {
              type: "text",
              text: "Git status functionality - not implemented yet",
            },
          ],
        };

      case "git-log":
        return {
          content: [
            {
              type: "text",
              text: "Git log functionality - not implemented yet",
            },
          ],
        };

      case "git-diff":
        return {
          content: [
            {
              type: "text",
              text: "Git diff functionality - not implemented yet",
            },
          ],
        };

      case "git-branch":
        return {
          content: [
            {
              type: "text",
              text: "Git branch functionality - not implemented yet",
            },
          ],
        };

      case "git-commit":
        return {
          content: [
            {
              type: "text",
              text: "Git commit functionality - not implemented yet",
            },
          ],
        };

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
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              message: "Repository information - not implemented yet",
            }),
          },
        ],
      };

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
 * Start the server
 */
async function main() {
  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP Git Tools server running on stdio");
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.error("Received SIGINT, shutting down gracefully...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  await server.close();
  process.exit(0);
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
