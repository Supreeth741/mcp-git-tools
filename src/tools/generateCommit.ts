/**
 * Generate Commit Message Tool
 * Creates structured commit messages from staged changes
 */

import { extractBranchCode } from "../utils/branchParser.js";
import { getCurrentBranch, getStagedChanges } from "../utils/gitOps.js";

export interface GenerateCommitInput {
  includeIssues?: boolean;
  includeLimitations?: boolean;
  includeComments?: boolean;
}

export interface GenerateCommitResult {
  success: boolean;
  commitMessage?: string;
  branchCode?: string;
  error?: string;
}

/**
 * Generate a concise summary from diff content (max 30 chars)
 */
function generateSummary(diff: string, fileNames: string[]): string {
  const lines = diff.split("\n");
  const addedLines = lines.filter(
    (line) => line.startsWith("+") && !line.startsWith("+++")
  );
  const removedLines = lines.filter(
    (line) => line.startsWith("-") && !line.startsWith("---")
  );

  // Try to detect the type of change
  if (fileNames.some((f) => f.includes("test"))) {
    return "added tests";
  }

  if (addedLines.length > removedLines.length * 2) {
    return "added new features";
  }

  if (removedLines.length > addedLines.length * 2) {
    return "removed code";
  }

  // Look for common patterns in added lines
  const addedContent = addedLines.join(" ").toLowerCase();

  if (
    addedContent.includes("function") ||
    addedContent.includes("const") ||
    addedContent.includes("let")
  ) {
    return "implemented functionality";
  }

  if (addedContent.includes("fix") || addedContent.includes("bug")) {
    return "fixed bugs";
  }

  if (addedContent.includes("refactor")) {
    return "refactored code";
  }

  if (addedContent.includes("update")) {
    return "updated implementation";
  }

  // Default based on file count
  if (fileNames.length === 1) {
    return "updated file";
  }

  return "updated multiple files";
}

/**
 * Analyze changes to generate Issues Addressed section
 */
function generateIssuesAddressed(diff: string, summary: any[]): string[] {
  const issues: string[] = [];

  // Analyze file changes
  for (const change of summary) {
    if (change.additions > 0) {
      issues.push(`Added ${change.additions} line(s) in ${change.file}`);
    }
    if (change.deletions > 0) {
      issues.push(`Removed ${change.deletions} line(s) from ${change.file}`);
    }
  }

  // Look for specific patterns in diff
  const lines = diff.split("\n");
  const addedLines = lines.filter(
    (line) => line.startsWith("+") && !line.startsWith("+++")
  );

  if (
    addedLines.some((line) => line.includes("TODO") || line.includes("FIXME"))
  ) {
    issues.push("Added TODO/FIXME markers for future work");
  }

  if (
    addedLines.some((line) => line.includes("test") || line.includes("spec"))
  ) {
    issues.push("Added test coverage");
  }

  return issues.slice(0, 3); // Limit to top 3 issues
}

/**
 * Generate Limitations section
 */
function generateLimitations(summary: any[]): string[] {
  const limitations: string[] = [];

  // Check for file types to suggest limitations
  const hasTests = summary.some(
    (s) => s.file.includes("test") || s.file.includes("spec")
  );
  if (!hasTests) {
    limitations.push("No test coverage included");
  }

  const hasDocumentation = summary.some(
    (s) =>
      s.file.endsWith(".md") ||
      s.file.includes("README") ||
      s.file.includes("doc")
  );
  if (!hasDocumentation) {
    limitations.push("Documentation not updated");
  }

  // If no specific limitations, add a generic one
  if (limitations.length === 0) {
    limitations.push("May require additional testing");
  }

  return limitations.slice(0, 2); // Limit to top 2 limitations
}

/**
 * Generate Comments section
 */
function generateComments(summary: any[]): string[] {
  const comments: string[] = [];

  const totalChanges = summary.reduce((sum, s) => sum + s.changes, 0);

  if (totalChanges > 100) {
    comments.push("Large changeset - consider breaking into smaller commits");
  } else if (totalChanges < 5) {
    comments.push("Minor changes made");
  }

  if (summary.length > 5) {
    comments.push(`Modified ${summary.length} files - review carefully`);
  }

  // If no specific comments, add a generic one
  if (comments.length === 0) {
    comments.push("Review changes before merging");
  }

  return comments.slice(0, 2); // Limit to top 2 comments
}

/**
 * Main function to generate commit message
 */
export async function generateCommit(
  input: GenerateCommitInput = {}
): Promise<GenerateCommitResult> {
  try {
    // Get current branch and extract branch code
    const branchName = await getCurrentBranch();
    const branchResult = extractBranchCode(branchName);

    if (!branchResult.isValid || !branchResult.branchCode) {
      return {
        success: false,
        error: branchResult.error || "Invalid branch code",
      };
    }

    const branchCode = branchResult.branchCode;

    // Get staged changes
    const stagedChanges = await getStagedChanges();

    if (stagedChanges.files.length === 0) {
      return {
        success: false,
        error:
          "No staged changes found. Stage your changes first using git add.",
      };
    }

    // Generate summary (max 30 chars)
    let summary = generateSummary(stagedChanges.diff, stagedChanges.files);
    if (summary.length > 30) {
      summary = summary.substring(0, 27) + "...";
    }

    // Build commit message
    let commitMessage = `${branchCode}: ${summary}`;

    // Add optional sections
    const includeIssues = input.includeIssues !== false; // Default true
    const includeLimitations = input.includeLimitations !== false; // Default true
    const includeComments = input.includeComments !== false; // Default true

    if (includeIssues) {
      const issues = generateIssuesAddressed(
        stagedChanges.diff,
        stagedChanges.summary
      );
      commitMessage += "\n\nIssues Addressed:";
      issues.forEach((issue) => {
        commitMessage += `\n- ${issue}`;
      });
    }

    if (includeLimitations) {
      const limitations = generateLimitations(stagedChanges.summary);
      commitMessage += "\n\nLimitations:";
      limitations.forEach((limitation) => {
        commitMessage += `\n- ${limitation}`;
      });
    }

    if (includeComments) {
      const comments = generateComments(stagedChanges.summary);
      commitMessage += "\n\nComments:";
      comments.forEach((comment) => {
        commitMessage += `\n- ${comment}`;
      });
    }

    return {
      success: true,
      commitMessage,
      branchCode,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
