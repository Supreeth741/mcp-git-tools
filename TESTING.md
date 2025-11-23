# Testing Guide

## Prerequisites for Testing

1. **Git Repository**: You must be in a git repository
2. **Branch Name**: Your branch must follow the pattern `FLY[A-Z]-[0-9]{3}`
3. **Node.js**: Version 18.0.0 or higher

## Setup Test Environment

### 1. Create a Test Branch

```bash
# Navigate to a git repository
cd /path/to/your/git/repo

# Create and checkout a test branch with valid branch code
git checkout -b feature/FLYF-228-test-mcp-server
```

### 2. Configure MCP Client

Follow the instructions in [QUICKSTART.md](QUICKSTART.md) to configure your MCP client (e.g., Claude Desktop).

**Important**: Make sure the `cwd` in your config points to your test git repository!

## Test Scenarios

### Test 1: Add Comments to Staged Changes

**Setup:**

```bash
# Make some changes to a file
echo "function testFunction() { return true; }" > test.js

# Stage the changes
git add test.js
```

**In Claude Desktop:**

```
Add comment "added test function" to staged changes
```

**Expected Result:**

- Comment should be added to test.js
- Format: `// FLYF-228: added test function`
- File should be modified (check with `git diff test.js`)

### Test 2: Add Comment to Specific File and Line

**Setup:**

```bash
# Create a file with multiple lines
cat > example.js << EOF
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}
EOF
```

**In Claude Desktop:**

```
Add comment "performs multiplication" to file example.js at line 5
```

**Expected Result:**

```javascript
function add(a, b) {
  return a + b;
}

// FLYF-228: performs multiplication
function multiply(a, b) {
  return a * b;
}
```

### Test 3: Generate Commit Message

**Setup:**

```bash
# Make and stage changes
echo "console.log('Hello');" > hello.js
git add hello.js
```

**In Claude Desktop:**

```
Generate a commit message for my staged changes
```

**Expected Result:**

```
FLYF-228: added new file

Issues Addressed:
- Added 1 line(s) in hello.js

Limitations:
- No test coverage included

Comments:
- Minor changes made
```

### Test 4: Generate Work Log for Today

**Setup:**

```bash
# Make some commits
git commit -m "FLYF-228: initial commit"
echo "more code" >> hello.js
git add hello.js
git commit -m "FLYF-228: updated hello file"
```

**In Claude Desktop:**

```
Generate my work log for today
```

**Expected Result:**

```
Date: 2025-11-23
Branch: FLYF-228
Commits: 2

Work Log:

Other Changes:
- FLYF-228: initial commit
- FLYF-228: updated hello file

Pending:
- No pending changes

Summary:
- Total commits: 2
- Files modified: Check git log for details
- Branch: feature/FLYF-228-test-mcp-server
```

### Test 5: Work Log for Specific Date

**In Claude Desktop:**

```
Generate work log for 2025-11-20
```

**Expected Result:**

- Shows commits from that specific date, or
- "No commits found for this date" if no commits exist

## Validation Checklist

After each test, verify:

- ✅ No error messages from the MCP server
- ✅ Output format matches expected structure
- ✅ Branch code is correctly extracted (FLYF-228)
- ✅ Comments use correct format with `//` prefix
- ✅ Files are actually modified (for add comments tool)
- ✅ Git operations work correctly

## Testing Edge Cases

### Edge Case 1: No Staged Changes

```bash
git reset  # Unstage all
```

**In Claude Desktop:**

```
Generate a commit message
```

**Expected Result:**

```
Error: No staged changes found. Stage your changes first using git add.
```

### Edge Case 2: Invalid Branch Name

```bash
git checkout -b invalid-branch-name
```

**In Claude Desktop:**

```
Add comment "test" to staged changes
```

**Expected Result:**

```
{
  "success": false,
  "message": "Failed to extract branch code",
  "error": "No valid branch code found. Expected format: FLY[A-Z]-[0-9]{3}"
}
```

### Edge Case 3: Duplicate Comments

**Setup:**

```bash
# Add a comment manually
echo "// FLYF-228: test comment" > test.js
echo "console.log('test');" >> test.js
git add test.js
```

**In Claude Desktop:**

```
Add comment "test comment" to staged changes
```

**Expected Result:**

- Should not add duplicate comment
- Message indicates comment already exists or was skipped

### Edge Case 4: Empty Repository

```bash
# In a new repository with no commits
git init test-repo
cd test-repo
git checkout -b feature/FLYF-228-test
```

**In Claude Desktop:**

```
Generate work log for today
```

**Expected Result:**

```
Date: 2025-11-23
Branch: FLYF-228

Work Log:
- No commits found for this date

Pending:
- Check for uncommitted changes
```

## Debugging Tips

### Server Not Responding

1. **Check Server Logs**: Look in Claude Desktop logs or stderr output
2. **Verify Config**: Ensure paths are absolute and correct
3. **Test Node.js**: Run `node dist/index.js` manually to check for errors

### Incorrect Branch Code Extracted

1. **Check Branch Name**: Run `git branch --show-current`
2. **Verify Pattern**: Must match `FLY[A-Z]-[0-9]{3}`
3. **Update Branch Name**: `git branch -m new-name`

### Git Operations Failing

1. **Check CWD**: Ensure MCP config has correct `cwd` pointing to git repo
2. **Verify Git Status**: Run `git status` to ensure repo is healthy
3. **Check Permissions**: Ensure read/write access to repository

### Comments Not Added

1. **Check File Encoding**: Must be UTF-8
2. **Verify Staged Status**: Run `git status` to see staged files
3. **Check Diff Output**: Run `git diff --cached` to see changes

## Manual Testing (Without MCP Client)

For advanced testing without an MCP client, you can manually interact with the server using stdio:

```bash
node dist/index.js
```

Then send JSON-RPC requests via stdin. Example:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

This is advanced and mainly useful for debugging the MCP protocol implementation.

## Automated Testing (Future Enhancement)

Consider adding:

- Unit tests with Jest or Mocha
- Integration tests with mock git repositories
- End-to-end tests with MCP client simulation

## Reporting Issues

If you encounter issues:

1. Note the exact error message
2. Record the git branch name
3. Check git status output
4. Review MCP server logs
5. Open an issue with all details

## Success Indicators

Your implementation is working correctly when:

- ✅ All test scenarios pass
- ✅ Branch codes are correctly extracted
- ✅ Comments are properly formatted and placed
- ✅ Commit messages follow the required structure
- ✅ Work logs accurately reflect commit history
- ✅ Error messages are clear and helpful
- ✅ No crashes or unexpected behavior

Happy testing! 🚀
