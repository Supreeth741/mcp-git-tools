# Quick Start Guide

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Configure Your MCP Client

#### For Claude Desktop on Windows:

Edit your configuration file located at:

```
%APPDATA%\Claude\claude_desktop_config.json
```

Add this configuration (adjust paths to match your setup):

```json
{
  "mcpServers": {
    "git-doc": {
      "command": "node",
      "args": ["d:\\flyzo\\mcp-git-tools\\dist\\index.js"],
      "cwd": "d:\\your\\git\\project\\path"
    }
  }
}
```

#### For Claude Desktop on macOS:

Edit your configuration file located at:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add this configuration:

```json
{
  "mcpServers": {
    "git-doc": {
      "command": "node",
      "args": ["/path/to/mcp-git-tools/dist/index.js"],
      "cwd": "/path/to/your/git/project"
    }
  }
}
```

### 4. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

### 5. Verify Installation

In Claude Desktop, you can verify the server is running by asking:

- "What MCP tools are available?"
- "List the git-doc tools"

You should see three tools:

- `add_code_comments`
- `generate_commit_message`
- `generate_daily_worklog`

## Usage Examples

### Example 1: Add Comments to Staged Changes

Make some changes to your code, stage them with `git add`, then in Claude:

```
Add comment "implemented user validation" to staged changes
```

This will add comments like:

```javascript
// FLYF-228: implemented user validation
```

### Example 2: Generate Commit Message

After staging changes:

```
Generate a commit message for my staged changes
```

You'll get a structured commit message like:

```
FLYF-228: added validation check

Issues Addressed:
- Added input validation
- Fixed null check

Limitations:
- No test coverage included

Comments:
- Review changes before merging
```

### Example 3: Daily Work Log

```
Generate my work log for today
```

You'll get a summary like:

```
Date: 2025-11-23
Branch: FLYF-228
Commits: 3

Work Log:

Features:
- Implemented MCP server
- Added git utilities

Pending:
- Review and commit staged changes
```

## Branch Naming Requirements

Your git branch name MUST follow this pattern:

```
FLY[A-Z]-[0-9]{3}
```

**Valid Examples:**

- `feature/FLYF-228-user-validation`
- `bugfix/FLYZ-101-fix-login`
- `hotfix/FLYA-999-security-patch`

**Invalid Examples:**

- `feature/FLY-123` (missing letter)
- `feature/FLYF-12` (only 2 digits)
- `feature/my-branch` (no branch code)

## Troubleshooting

### "No valid branch code found"

Your branch name doesn't follow the required pattern. Rename your branch:

```bash
git checkout -b feature/FLYF-228-description
```

### "No staged changes found"

You need to stage files first:

```bash
git add <files>
```

### Server not connecting

1. Check that `dist/index.js` exists
2. Verify paths in your MCP config are absolute and correct
3. Restart Claude Desktop after config changes
4. Check Node.js version (must be >= 18.0.0)

### Permission errors

Make sure you have read/write access to:

- Your git repository
- The mcp-git-tools directory

## Development Mode

To run in development with auto-rebuild:

```bash
npm run watch
```

In another terminal:

```bash
npm start
```

## Testing Without MCP Client

You can test the server manually by running it and sending JSON-RPC messages via stdio, but it's recommended to use an MCP client like Claude Desktop for normal usage.

## Next Steps

1. ✅ Install and build the project
2. ✅ Configure your MCP client
3. ✅ Ensure your branch follows naming convention
4. ✅ Start using the tools in Claude Desktop!

For detailed documentation, see [README.md](README.md)
