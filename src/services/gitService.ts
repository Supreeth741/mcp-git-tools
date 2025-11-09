import simpleGit, {
  SimpleGit,
  StatusResult,
  LogResult,
  DiffResult,
} from "simple-git";
import * as path from "path";
import * as fs from "fs";

/**
 * Create a Git instance for a specific repository path
 */
function createGitInstance(repoPath?: string): SimpleGit {
  const gitPath = repoPath || process.cwd();
  return simpleGit(gitPath);
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(repoPath?: string): Promise<string> {
  const git = createGitInstance(repoPath);
  const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
  return branch.trim();
}

/**
 * Get Git diff for changes
 */
export async function getDiff(
  staged = false,
  repoPath?: string,
  filePath?: string
): Promise<string> {
  const git = createGitInstance(repoPath);

  if (filePath) {
    return staged
      ? await git.diff(["--staged", filePath])
      : await git.diff([filePath]);
  }

  return staged ? await git.diff(["--staged"]) : await git.diff();
}

/**
 * Get commit history
 */
export async function getCommits(
  repoPath?: string,
  options?: {
    since?: string;
    limit?: number;
    branch?: string;
  }
): Promise<LogResult> {
  const git = createGitInstance(repoPath);

  const logOptions: any = {};

  if (options?.since) {
    logOptions["--since"] = options.since;
  }

  if (options?.limit) {
    logOptions.maxCount = options.limit;
  }

  if (options?.branch) {
    logOptions.from = options.branch;
  }

  return await git.log(logOptions);
}

/**
 * Get Git status
 */
export async function getStatus(repoPath?: string): Promise<StatusResult> {
  const git = createGitInstance(repoPath);
  return await git.status();
}

/**
 * List all branches
 */
export async function getBranches(repoPath?: string): Promise<{
  current: string;
  all: string[];
  local: string[];
  remote: string[];
}> {
  const git = createGitInstance(repoPath);
  const branches = await git.branch(["-a"]);

  return {
    current: branches.current,
    all: branches.all,
    local: branches.all.filter((branch) => !branch.startsWith("remotes/")),
    remote: branches.all.filter((branch) => branch.startsWith("remotes/")),
  };
}

/**
 * Create a new branch
 */
export async function createBranch(
  branchName: string,
  repoPath?: string
): Promise<void> {
  const git = createGitInstance(repoPath);
  await git.checkoutLocalBranch(branchName);
}

/**
 * Switch to an existing branch
 */
export async function switchBranch(
  branchName: string,
  repoPath?: string
): Promise<void> {
  const git = createGitInstance(repoPath);
  await git.checkout(branchName);
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  branchName: string,
  repoPath?: string,
  force = false
): Promise<void> {
  const git = createGitInstance(repoPath);
  const deleteFlag = force ? "-D" : "-d";
  await git.branch([deleteFlag, branchName]);
}

/**
 * Stage files for commit
 */
export async function stageFiles(
  files: string[] | string = ".",
  repoPath?: string
): Promise<void> {
  const git = createGitInstance(repoPath);
  if (Array.isArray(files)) {
    await git.add(files);
  } else {
    await git.add(files);
  }
}

/**
 * Create a commit
 */
export async function createCommit(
  message: string,
  repoPath?: string,
  addAll = false
): Promise<void> {
  const git = createGitInstance(repoPath);

  if (addAll) {
    await git.add(".");
  }

  await git.commit(message);
}

/**
 * Check if a path is a Git repository
 */
export async function isGitRepository(repoPath?: string): Promise<boolean> {
  try {
    const git = createGitInstance(repoPath);
    await git.status();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get repository information
 */
export async function getRepositoryInfo(repoPath?: string): Promise<{
  isRepo: boolean;
  currentBranch?: string;
  remotes?: string[];
  rootPath?: string;
  status?: StatusResult;
  error?: string;
}> {
  const git = createGitInstance(repoPath);

  try {
    const isRepo = await isGitRepository(repoPath);
    if (!isRepo) {
      return { isRepo: false };
    }

    const [currentBranch, remotes, status, rootPath] = await Promise.all([
      getCurrentBranch(repoPath),
      git.getRemotes(true),
      git.status(),
      git.revparse(["--show-toplevel"]),
    ]);

    return {
      isRepo: true,
      currentBranch,
      remotes: remotes.map((remote) => `${remote.name}: ${remote.refs.fetch}`),
      rootPath: rootPath.trim(),
      status,
    };
  } catch (error) {
    return {
      isRepo: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the working directory status with file details
 */
export async function getDetailedStatus(repoPath?: string): Promise<{
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  conflicted: string[];
}> {
  const git = createGitInstance(repoPath);
  const status = await git.status();

  return {
    branch: status.current || "HEAD",
    ahead: status.ahead,
    behind: status.behind,
    staged: status.staged,
    modified: status.modified,
    untracked: status.not_added,
    deleted: status.deleted,
    renamed: status.renamed.map((renamed) => ({
      from: renamed.from,
      to: renamed.to,
    })),
    conflicted: status.conflicted,
  };
}
