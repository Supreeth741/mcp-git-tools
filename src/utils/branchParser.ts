/**
 * Branch code parser utility
 * Extracts branch code in format FLY[A-Z]-[0-9]{3} from git branch names
 */

export interface BranchCodeResult {
  branchCode: string | null;
  isValid: boolean;
  branchName: string;
  error?: string;
}

/**
 * Regular expression to match branch code pattern: FLY[A-Z]-[0-9]{3}
 * Examples: FLYF-228, FLYZ-101, FLYA-999
 */
const BRANCH_CODE_REGEX = /FLY[A-Z]-\d{3}/;

/**
 * Extract branch code from a git branch name
 * @param branchName - The full git branch name (e.g., "feature/FLYF-228-test-branch")
 * @returns BranchCodeResult with extracted code or error
 */
export function extractBranchCode(branchName: string): BranchCodeResult {
  if (!branchName || branchName.trim() === "") {
    return {
      branchCode: null,
      isValid: false,
      branchName: branchName || "",
      error: "Branch name is empty",
    };
  }

  const match = branchName.match(BRANCH_CODE_REGEX);

  if (!match) {
    return {
      branchCode: null,
      isValid: false,
      branchName,
      error: `No valid branch code found. Expected format: FLY[A-Z]-[0-9]{3}`,
    };
  }

  return {
    branchCode: match[0],
    isValid: true,
    branchName,
  };
}

/**
 * Validate if a string is a valid branch code
 * @param code - The code to validate
 * @returns true if valid branch code format
 */
export function isValidBranchCode(code: string): boolean {
  return BRANCH_CODE_REGEX.test(code);
}

/**
 * Format comment with branch code prefix
 * @param branchCode - The branch code (e.g., "FLYF-228")
 * @param comment - The comment text
 * @returns Formatted comment string
 */
export function formatComment(branchCode: string, comment: string): string {
  return `// ${branchCode}: ${comment}`;
}

/**
 * Check if a line already contains a comment with the branch code
 * @param line - The code line to check
 * @param branchCode - The branch code to look for
 * @returns true if comment already exists
 */
export function hasExistingComment(line: string, branchCode: string): boolean {
  const commentPattern = new RegExp(`//\\s*${branchCode}:`);
  return commentPattern.test(line);
}
