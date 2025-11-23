# Git Doc MCP Server

A Model Context Protocol (MCP) server that automates Git documentation tasks. This server provides intelligent tools for adding code comments with branch codes, generating structured commit messages, and creating daily work logs.

## Features

### 1. 🔖 Add Code Comments

Automatically adds inline comments to code changes with branch code prefixes.

**Format:** `// <BRANCH-CODE>: <comment>`

**Example:**

```javascript
// FLYF-228: Added validation for user input
function validateUser(user) {
  // ... code
}
```

**Features:**

- Reads from git diff, staged changes, or specific files
- Extracts branch code from branch name (format: `FLY[A-Z]-[0-9]{3}`)
- Prevents duplicate comments
- Validates comment placement and format

### 2. 📝 Generate Commit Messages

Creates structured commit messages from staged changes.

**Format:**

```
<BRANCH-CODE>: <message within 30 chars>

Issues Addressed:
- <issue 1>
- <issue 2>

Limitations:
- <limitation 1>

Comments:
- <comment 1>
```

**Example:**

```
FLYF-228: added validation check

Issues Addressed:
- Fixed missing null check
- Added input sanitization

Limitations:
- Works only for user role admin

Comments:
- Further refactoring needed
```

### 3. 📊 Daily Work Log

Generates comprehensive daily work logs from commit history.

**Example Output:**

```
Date: 2025-11-23
Branch: FLYF-228
Commits: 5

Work Log:

Features:
- Implemented validation rules
- Added MCP auto-commenting logic

Bug Fixes:
- Fixed null pointer exception

Refactoring:
- Refactored helper functions

Pending:
- 3 file(s) staged but not committed
- Review and commit staged changes

Summary:
- Total commits: 5
- Branch: feature/FLYF-228-test-branch
```

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Git repository with proper branch naming

### Setup

1. **Clone or download this repository:**

```bash
git clone https://github.com/Supreeth741/mcp-git-tools.git
cd mcp-git-tools
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

## Usage

### As an MCP Server

Configure your MCP client (e.g., Claude Desktop) to use this server:

**Configuration for Claude Desktop (`claude_desktop_config.json`):**

On Windows:

```json
{
  "mcpServers": {
    "git-doc": {
      "command": "node",
      "args": ["d:\\flyzo\\mcp-git-tools\\dist\\index.js"],
      "cwd": "d:\\flyzo\\your-git-project"
    }
  }
}
```

On macOS/Linux:

```json
{
  "mcpServers": {
    "git-doc": {
      "command": "node",
      "args": ["/path/to/mcp-git-tools/dist/index.js"],
      "cwd": "/path/to/your-git-project"
    }
  }
}
```

**Note:** The `cwd` should point to your actual Git project directory where you want to use these tools.

## Available Tools

### 1. `add_code_comments`

Adds inline comments to code changes with branch code prefix.

**Parameters:**

- `comment` (required): The comment text to add
- `source` (optional): Source of changes - `"staged"`, `"unstaged"`, or `"file"` (default: `"staged"`)
- `filePath` (optional): File path (required when source is `"file"`)
- `lineNumber` (optional): Line number (required when source is `"file"`)

**Example usage in MCP client:**

```
Add comment "fixed validation bug" to staged changes
```

```
Add comment "TODO: optimize this loop" to file src/utils/helper.ts at line 42
```

### 2. `generate_commit_message`

Generates a structured commit message from staged changes.

**Parameters:**

- `includeIssues` (optional): Include "Issues Addressed" section (default: `true`)
- `includeLimitations` (optional): Include "Limitations" section (default: `true`)
- `includeComments` (optional): Include "Comments" section (default: `true`)

**Example usage in MCP client:**

```
Generate a commit message for my staged changes
```

```
Generate commit message without limitations section
```

### 3. `generate_daily_worklog`

Generates a daily work log from commit history.

**Parameters:**

- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

**Example usage in MCP client:**

```
Generate my work log for today
```

```
Show me the work log for 2025-11-20
```

## Branch Code Format

The server extracts branch codes from your git branch name using the pattern:

**Pattern:** `FLY[A-Z]-[0-9]{3}`

**Valid Examples:**

- `FLYF-228` from `feature/FLYF-228-user-validation`
- `FLYZ-101` from `bugfix/FLYZ-101-fix-login`
- `FLYA-999` from `FLYA-999-refactor-api`

**Invalid Examples:**

- `FLY-123` (missing letter after FLY)
- `FLYF-12` (only 2 digits instead of 3)
- `FLYF-1234` (4 digits instead of 3)

## Development

### Scripts

```bash
# Build the project
npm run build

# Watch mode for development
npm run watch

# Run the server
npm start

# Build and run
npm run dev
```

### Project Structure

```
mcp-git-tools/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── utils/
│   │   ├── branchParser.ts   # Branch code extraction
│   │   └── gitOps.ts         # Git operations
│   └── tools/
│       ├── addComments.ts    # Add comments tool
│       ├── generateCommit.ts # Generate commit message tool
│       └── workLog.ts        # Work log tool
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Branch Detection:** The server reads your current git branch name and extracts the branch code using regex pattern matching.

2. **Git Integration:** Uses `simple-git` library to interact with your git repository - reading diffs, staged changes, and commit history.

3. **MCP Protocol:** Implements the Model Context Protocol to expose three tools that can be called by MCP clients like Claude Desktop.

4. **Intelligent Analysis:** Analyzes code changes to generate meaningful comments, commit messages, and work logs.

## Troubleshooting

### "No valid branch code found"

- Ensure your branch name follows the format: `FLY[A-Z]-[0-9]{3}`
- Example: `feature/FLYF-228-description`

### "No staged changes found"

- Stage your changes first: `git add <files>`
- Then use the generate commit message tool

### "Cannot find module @modelcontextprotocol/sdk"

- Run `npm install` to install dependencies
- Run `npm run build` to compile TypeScript

### Server not appearing in MCP client

- Check that the path in your MCP config is correct
- Ensure `dist/index.js` exists (run `npm run build`)
- Restart your MCP client after configuration changes

## Requirements

- Node.js >= 18.0.0
- Git repository
- Branch names following the `FLY[A-Z]-[0-9]{3}` pattern

## License

MIT

## Author

Supreeth741

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### Version 1.0.0

- Initial release
- Add code comments with branch code prefix
- Generate structured commit messages
- Create daily work logs from commit history
