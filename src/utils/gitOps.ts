/**
 * Git operations utility
 * Handles all git-related operations using simple-git
 */

import { simpleGit, SimpleGit, DefaultLogFields } from "simple-git";
import { promises as fs } from "fs";
import path from "path";

export interface GitChange {
  file: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface StagedChanges {
  files: string[];
  diff: string;
  summary: GitChange[];
}

export interface CommitInfo extends DefaultLogFields {
  message: string;
  date: string;
  author_name: string;
  author_email: string;
}

/**
 * Initialize git instance for the current directory
 */
export function getGit(baseDir?: string): SimpleGit {
  return simpleGit(baseDir || process.cwd());
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(git?: SimpleGit): Promise<string> {
  const gitInstance = git || getGit();
  const branch = await gitInstance.branch();
  return branch.current;
}

/**
 * Get diff for unstaged changes
 */
export async function getUnstagedDiff(git?: SimpleGit): Promise<string> {
  const gitInstance = git || getGit();
  return await gitInstance.diff();
}

/**
 * Get diff for staged changes
 */
export async function getStagedDiff(git?: SimpleGit): Promise<string> {
  const gitInstance = git || getGit();
  return await gitInstance.diff(["--cached"]);
}

/**
 * Get all staged files
 */
export async function getStagedFiles(git?: SimpleGit): Promise<string[]> {
  const gitInstance = git || getGit();
  const status = await gitInstance.status();
  return status.staged;
}

/**
 * Get detailed staged changes with file information
 */
export async function getStagedChanges(
  git?: SimpleGit
): Promise<StagedChanges> {
  const gitInstance = git || getGit();
  const files = await getStagedFiles(gitInstance);
  const diff = await getStagedDiff(gitInstance);

  const summary: GitChange[] = [];
  for (const file of files) {
    const fileDiff = await gitInstance.diff(["--cached", "--numstat", file]);
    const lines = fileDiff.trim().split("\n");
    if (lines.length > 0 && lines[0]) {
      const [additions, deletions] = lines[0]
        .split("\t")
        .map((n) => parseInt(n) || 0);
      summary.push({
        file,
        additions,
        deletions,
        changes: additions + deletions,
      });
    }
  }

  return { files, diff, summary };
}

/**
 * Get commits for a specific date (defaults to today)
 */
export async function getCommitsByDate(
  date: Date = new Date(),
  git?: SimpleGit
): Promise<CommitInfo[]> {
  const gitInstance = git || getGit();

  // Format date to YYYY-MM-DD
  const dateStr = date.toISOString().split("T")[0];
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split("T")[0];

  try {
    const log = await gitInstance.log({
      from: dateStr,
      to: nextDayStr,
    });

    return log.all.map((commit) => ({
      ...commit,
      message: commit.message,
      date: commit.date,
      author_name: commit.author_name,
      author_email: commit.author_email,
    }));
  } catch (error) {
    // If no commits found for the date range, return empty array
    return [];
  }
}

/**
 * Get diff for a specific file
 */
export async function getFileDiff(
  filePath: string,
  git?: SimpleGit
): Promise<string> {
  const gitInstance = git || getGit();
  return await gitInstance.diff([filePath]);
}

/**
 * Read file content from the working directory
 */
export async function readFile(
  filePath: string,
  baseDir?: string
): Promise<string> {
  const fullPath = baseDir ? path.join(baseDir, filePath) : filePath;
  return await fs.readFile(fullPath, "utf-8");
}

/**
 * Write content to a file
 */
export async function writeFile(
  filePath: string,
  content: string,
  baseDir?: string
): Promise<void> {
  const fullPath = baseDir ? path.join(baseDir, filePath) : filePath;
  await fs.writeFile(fullPath, content, "utf-8");
}

/**
 * Check if the repository has any commits
 */
export async function hasCommits(git?: SimpleGit): Promise<boolean> {
  const gitInstance = git || getGit();
  try {
    await gitInstance.log({ maxCount: 1 });
    return true;
  } catch {
    return false;
  }
}
