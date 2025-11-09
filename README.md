# MCP Git Tools Server

A Model Context Protocol (MCP) server that provides Git operations as tools for AI assistants.

## Features

This server provides the following tools:

### Tools

- **git-status**: Get the current Git status of the repository
- **git-log**: Get Git commit history with optional filtering
- **git-diff**: Get Git diff for changes (staged/unstaged, specific files)
- **git-branch**: List, create, switch, or delete Git branches
- **git-commit**: Create Git commits with staged changes
- **health-check**: Check server health status

### Webhooks

- **GitHub Webhook**: `/webhook/github` - Handle GitHub events
  - **Pull Request Events**: Automatically processes opened PRs
  - **Push Events**: Tracks repository pushes
  - **Health Check**: `/webhook/github/health` - Webhook service status
  - **Test Endpoint**: `/webhook/github/test` - Webhook validation

### Resources

- **git://repository-info**: Get current Git repository information

### Prompts

- **commit-message**: Generate commit messages based on staged changes

## Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### HTTP Server (for testing)

```bash
# Start HTTP server for testing
npm run start:http

# Test endpoints
curl http://localhost:4000              # Server info and health
curl http://localhost:4000/health       # Health check
curl http://localhost:4000/status       # Server status
curl http://localhost:4000/tools        # Available tools
```

### Development with HTTP

```bash
npm run dev:http
```

## Testing

### Test Git Operations

```bash
npm run test:git
```

### Test HTTP Endpoints

```bash
npm run test:endpoints
```

### Test Webhook Functionality

```bash
npm run test:webhook
```

### Manual Webhook Testing

```bash
# Test with curl
curl -X POST http://localhost:4000/webhook/github \
  -H "Content-Type: application/json" \
  -H "x-github-event: pull_request" \
  --data @test-webhook-payload.json
```

### MCP Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "git-tools": {
      "command": "node",
      "args": ["path/to/mcp-git-tools/dist/server.js"],
      "cwd": "path/to/mcp-git-tools",
      "env": {}
    }
  }
}
```

## Environment Variables

Create a `.env` file in the project root:

```env
# HTTP server port (default: 4000)
HTTP_PORT=4000

# Optional: Git service tokens
GITHUB_TOKEN=your_github_token
GITLAB_TOKEN=your_gitlab_token
OPENAI_API_KEY=your_llm_key   # optional, for LLM testing
```

## Development Status

� **Ready for Use!** �

- [x] Basic MCP server setup
- [x] Tool schema definitions
- [x] Git status implementation
- [x] Git log implementation
- [x] Git diff implementation
- [x] Git branch operations (list/create/switch/delete)
- [x] Git commit functionality
- [x] Repository information resource
- [x] HTTP server for testing
- [x] Comprehensive error handling
- [ ] Commit message prompt generation (AI-powered)
- [ ] Advanced Git operations (merge, rebase, etc.)

## Architecture

```
src/
├── server.ts          # Main MCP server
├── services/          # Git operation services
├── tools/             # Tool implementations
└── utils/             # Utility functions
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new functionality
3. Update documentation
4. Ensure all tools follow MCP protocol standards

## License

ISC
