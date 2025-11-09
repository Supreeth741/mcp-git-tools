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
# Add any environment variables here
# Currently none are required for basic functionality
```

## Development Status

🚧 **Under Development** 🚧

- [x] Basic MCP server setup
- [x] Tool schema definitions
- [ ] Git status implementation
- [ ] Git log implementation
- [ ] Git diff implementation
- [ ] Git branch operations
- [ ] Git commit functionality
- [ ] Repository information resource
- [ ] Commit message prompt generation

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
