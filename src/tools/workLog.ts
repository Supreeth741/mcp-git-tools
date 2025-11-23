/**
 * Daily Work Log Tool
 * Generates daily work log from commit history and code changes
 */

import { extractBranchCode } from "../utils/branchParser.js";
import {
  getCurrentBranch,
  getCommitsByDate,
  getStagedFiles,
  CommitInfo,
} from "../utils/gitOps.js";

export interface WorkLogInput {
  date?: string; // Format: YYYY-MM-DD (defaults to today)
}

export interface WorkLogResult {
  success: boolean;
  workLog?: string;
  date?: string;
  branchCode?: string;
  error?: string;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse date string or return today
 */
function parseDate(dateStr?: string): Date {
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

/**
 * Group commits by categories
 */
function categorizeCommits(commits: CommitInfo[]): {
  features: string[];
  fixes: string[];
  refactors: string[];
  others: string[];
} {
  const categories = {
    features: [] as string[],
    fixes: [] as string[],
    refactors: [] as string[],
    others: [] as string[],
  };

  for (const commit of commits) {
    const message = commit.message.toLowerCase();

    if (
      message.includes("feat") ||
      message.includes("add") ||
      message.includes("implement")
    ) {
      categories.features.push(commit.message.split("\n")[0]);
    } else if (
      message.includes("fix") ||
      message.includes("bug") ||
      message.includes("resolve")
    ) {
      categories.fixes.push(commit.message.split("\n")[0]);
    } else if (
      message.includes("refactor") ||
      message.includes("restructure") ||
      message.includes("improve")
    ) {
      categories.refactors.push(commit.message.split("\n")[0]);
    } else {
      categories.others.push(commit.message.split("\n")[0]);
    }
  }

  return categories;
}

/**
 * Generate pending work section from staged files
 */
async function generatePendingWork(): Promise<string[]> {
  try {
    const stagedFiles = await getStagedFiles();

    if (stagedFiles.length === 0) {
      return ["No pending changes"];
    }

    return [
      `${stagedFiles.length} file(s) staged but not committed`,
      "Review and commit staged changes",
    ];
  } catch {
    return [];
  }
}

/**
 * Main function to generate daily work log
 */
export async function generateWorkLog(
  input: WorkLogInput = {}
): Promise<WorkLogResult> {
  try {
    // Parse date
    const date = parseDate(input.date);
    const dateStr = formatDate(date);

    // Get current branch and extract branch code
    const branchName = await getCurrentBranch();
    const branchResult = extractBranchCode(branchName);

    const branchCode =
      branchResult.isValid && branchResult.branchCode
        ? branchResult.branchCode
        : "N/A";

    // Get commits for the specified date
    const commits = await getCommitsByDate(date);

    if (commits.length === 0) {
      return {
        success: true,
        workLog: `Date: ${dateStr}\nBranch: ${branchCode}\n\nWork Log:\n- No commits found for this date\n\nPending:\n- Check for uncommitted changes`,
        date: dateStr,
        branchCode,
      };
    }

    // Categorize commits
    const categories = categorizeCommits(commits);

    // Build work log
    let workLog = `Date: ${dateStr}\n`;
    workLog += `Branch: ${branchCode}\n`;
    workLog += `Commits: ${commits.length}\n`;
    workLog += `\nWork Log:\n`;

    // Add features
    if (categories.features.length > 0) {
      workLog += `\nFeatures:\n`;
      categories.features.forEach((msg) => {
        workLog += `- ${msg}\n`;
      });
    }

    // Add fixes
    if (categories.fixes.length > 0) {
      workLog += `\nBug Fixes:\n`;
      categories.fixes.forEach((msg) => {
        workLog += `- ${msg}\n`;
      });
    }

    // Add refactors
    if (categories.refactors.length > 0) {
      workLog += `\nRefactoring:\n`;
      categories.refactors.forEach((msg) => {
        workLog += `- ${msg}\n`;
      });
    }

    // Add others
    if (categories.others.length > 0) {
      workLog += `\nOther Changes:\n`;
      categories.others.forEach((msg) => {
        workLog += `- ${msg}\n`;
      });
    }

    // Add pending work
    const pendingItems = await generatePendingWork();
    workLog += `\nPending:\n`;
    pendingItems.forEach((item) => {
      workLog += `- ${item}\n`;
    });

    // Add summary
    workLog += `\nSummary:\n`;
    workLog += `- Total commits: ${commits.length}\n`;
    workLog += `- Files modified: Check git log for details\n`;
    workLog += `- Branch: ${branchName}\n`;

    return {
      success: true,
      workLog,
      date: dateStr,
      branchCode,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
