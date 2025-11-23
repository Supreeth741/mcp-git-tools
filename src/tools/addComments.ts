/**
 * Add Comments Tool
 * Reads code changes and adds inline comments with branch code prefix
 */

import {
  extractBranchCode,
  formatComment,
  hasExistingComment,
} from "../utils/branchParser.js";
import {
  getCurrentBranch,
  getStagedDiff,
  getUnstagedDiff,
  readFile,
  writeFile,
} from "../utils/gitOps.js";

export interface AddCommentsInput {
  comment: string;
  source?: "staged" | "unstaged" | "file";
  filePath?: string;
  lineNumber?: number;
}

export interface AddCommentsResult {
  success: boolean;
  message: string;
  branchCode?: string;
  filesModified?: string[];
  error?: string;
}

/**
 * Parse diff output to extract file changes and line numbers
 */
function parseDiff(diff: string): Map<string, number[]> {
  const fileChanges = new Map<string, number[]>();
  const lines = diff.split("\n");

  let currentFile: string | null = null;
  let currentLineNumber = 0;

  for (const line of lines) {
    // Detect file being modified (e.g., "+++ b/src/file.ts")
    if (line.startsWith("+++ b/")) {
      currentFile = line.substring(6);
      fileChanges.set(currentFile, []);
      continue;
    }

    // Track line numbers in hunks (e.g., "@@ -10,5 +10,6 @@")
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
      if (match) {
        currentLineNumber = parseInt(match[1], 10);
      }
      continue;
    }

    // Track added lines (lines starting with '+')
    if (currentFile && line.startsWith("+") && !line.startsWith("+++")) {
      const lineNumbers = fileChanges.get(currentFile) || [];
      lineNumbers.push(currentLineNumber);
      fileChanges.set(currentFile, lineNumbers);
      currentLineNumber++;
    } else if (currentFile && !line.startsWith("-")) {
      currentLineNumber++;
    }
  }

  return fileChanges;
}

/**
 * Add comment to a specific file at a line number
 */
async function addCommentToFile(
  filePath: string,
  lineNumber: number,
  comment: string,
  branchCode: string
): Promise<boolean> {
  try {
    const content = await readFile(filePath);
    const lines = content.split("\n");

    // Validate line number
    if (lineNumber < 1 || lineNumber > lines.length) {
      return false;
    }

    const targetIndex = lineNumber - 1;
    const targetLine = lines[targetIndex];

    // Check if comment already exists
    if (hasExistingComment(targetLine, branchCode)) {
      return false; // Skip duplicate
    }

    // Determine indentation from the target line
    const indentMatch = targetLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : "";

    // Add comment above the target line
    const formattedComment = indent + formatComment(branchCode, comment);
    lines.splice(targetIndex, 0, formattedComment);

    // Write back to file
    await writeFile(filePath, lines.join("\n"));
    return true;
  } catch (error) {
    console.error(`Error adding comment to ${filePath}:`, error);
    return false;
  }
}

/**
 * Add comments to changed files based on diff
 */
async function addCommentsToDiff(
  diff: string,
  comment: string,
  branchCode: string
): Promise<string[]> {
  const fileChanges = parseDiff(diff);
  const modifiedFiles: string[] = [];

  for (const [filePath, lineNumbers] of fileChanges.entries()) {
    if (lineNumbers.length > 0) {
      // Add comment at the first changed line in each file
      const success = await addCommentToFile(
        filePath,
        lineNumbers[0],
        comment,
        branchCode
      );
      if (success) {
        modifiedFiles.push(filePath);
      }
    }
  }

  return modifiedFiles;
}

/**
 * Main function to add comments based on input
 */
export async function addComments(
  input: AddCommentsInput
): Promise<AddCommentsResult> {
  try {
    // Get current branch and extract branch code
    const branchName = await getCurrentBranch();
    const branchResult = extractBranchCode(branchName);

    if (!branchResult.isValid || !branchResult.branchCode) {
      return {
        success: false,
        message: "Failed to extract branch code",
        error: branchResult.error,
      };
    }

    const branchCode = branchResult.branchCode;
    const source = input.source || "staged";
    let filesModified: string[] = [];

    // Handle specific file with line number
    if (source === "file" && input.filePath) {
      if (!input.lineNumber) {
        return {
          success: false,
          message: "Line number required when specifying a file",
          error: "Missing lineNumber parameter",
        };
      }

      const success = await addCommentToFile(
        input.filePath,
        input.lineNumber,
        input.comment,
        branchCode
      );

      if (success) {
        filesModified = [input.filePath];
      }

      return {
        success,
        message: success
          ? `Comment added to ${input.filePath} at line ${input.lineNumber}`
          : `Failed to add comment (may already exist or invalid line number)`,
        branchCode,
        filesModified,
      };
    }

    // Handle staged or unstaged changes
    const diff =
      source === "staged" ? await getStagedDiff() : await getUnstagedDiff();

    if (!diff || diff.trim() === "") {
      return {
        success: false,
        message: `No ${source} changes found`,
        branchCode,
      };
    }

    filesModified = await addCommentsToDiff(diff, input.comment, branchCode);

    return {
      success: filesModified.length > 0,
      message:
        filesModified.length > 0
          ? `Comments added to ${filesModified.length} file(s)`
          : "No comments were added (may already exist or no valid lines found)",
      branchCode,
      filesModified,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error adding comments",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
