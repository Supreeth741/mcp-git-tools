#!/usr/bin/env node

/**
 * Git Doc MCP Server
 * Main entry point for the MCP server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import {
  addComments,
  AddCommentsInput,
  AddCommentsResult,
} from "./tools/addComments.js";
import {
  generateCommit,
  GenerateCommitInput,
  GenerateCommitResult,
} from "./tools/generateCommit.js";
import {
  generateWorkLog,
  WorkLogInput,
  WorkLogResult,
} from "./tools/workLog.js";

/**
 * Define available tools
 */
const TOOLS: Tool[] = [
  {
    name: "add_code_comments",
    description:
      "Add inline comments to code changes with branch code prefix. Reads from git diff, staged changes, or specific files. Format: // <BRANCH-CODE>: <comment>",
    inputSchema: {
      type: "object",
      properties: {
        comment: {
          type: "string",
          description: "The comment text to add (without branch code prefix)",
        },
        source: {
          type: "string",
          enum: ["staged", "unstaged", "file"],
          description:
            "Source of code changes: staged (default), unstaged, or specific file",
          default: "staged",
        },
        filePath: {
          type: "string",
          description: 'File path (required when source is "file")',
        },
        lineNumber: {
          type: "number",
          description:
            'Line number to add comment (required when source is "file")',
        },
      },
      required: ["comment"],
    },
  },
  {
    name: "generate_commit_message",
    description:
      "Generate a structured commit message from staged changes. Format: <BRANCH-CODE>: <message within 30 chars> followed by Issues Addressed, Limitations, and Comments sections.",
    inputSchema: {
      type: "object",
      properties: {
        includeIssues: {
          type: "boolean",
          description: 'Include "Issues Addressed" section (default: true)',
          default: true,
        },
        includeLimitations: {
          type: "boolean",
          description: 'Include "Limitations" section (default: true)',
          default: true,
        },
        includeComments: {
          type: "boolean",
          description: 'Include "Comments" section (default: true)',
          default: true,
        },
      },
    },
  },
  {
    name: "generate_daily_worklog",
    description:
      "Generate a daily work log summarizing commits and changes for a specific date. Includes work completed, pending tasks, and commit statistics.",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format (defaults to today)",
        },
      },
    },
  },
];

/**
 * Create and configure the MCP server
 */
async function main(): Promise<void> {
  const server = new Server(
    {
      name: "mcp-git-tools",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "add_code_comments": {
          const input = (args || {}) as unknown as AddCommentsInput;
          const result: AddCommentsResult = await addComments(input);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "generate_commit_message": {
          const input = args as GenerateCommitInput;
          const result: GenerateCommitResult = await generateCommit(input);

          if (!result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${result.error}`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: result.commitMessage || "",
              },
            ],
          };
        }

        case "generate_daily_worklog": {
          const input = args as WorkLogInput;
          const result: WorkLogResult = await generateWorkLog(input);

          if (!result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${result.error}`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: result.workLog || "",
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * Start the server using stdio transport
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log server start (to stderr to not interfere with stdio communication)
  console.error("Git Doc MCP Server running on stdio");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
