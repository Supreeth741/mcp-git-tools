#!/usr/bin/env node

/**
 * Simple test script to verify Git operations work locally
 */

import * as gitService from "./dist/services/gitService.js";

console.log("🚀 Testing Git Service Operations...\n");

async function runTests() {
  try {
    // Test 1: Check if we're in a Git repository
    console.log("📂 Test 1: Repository Detection");
    const isRepo = await gitService.isGitRepository();
    console.log(`   Is Git Repository: ${isRepo ? "✅ Yes" : "❌ No"}\n`);

    if (!isRepo) {
      console.log("❌ Not in a Git repository. Skipping Git-specific tests.");
      return;
    }

    // Test 2: Get current branch
    console.log("🌿 Test 2: Current Branch");
    const currentBranch = await gitService.getCurrentBranch();
    console.log(`   Current Branch: ${currentBranch}\n`);

    // Test 3: Get repository info
    console.log("📊 Test 3: Repository Information");
    const repoInfo = await gitService.getRepositoryInfo();
    console.log(`   Repository Info:`, JSON.stringify(repoInfo, null, 2));
    console.log();

    // Test 4: Get status
    console.log("📋 Test 4: Git Status");
    const status = await gitService.getDetailedStatus();
    console.log(`   Status Summary:
   - Branch: ${status.branch}
   - Ahead: ${status.ahead} commits
   - Behind: ${status.behind} commits
   - Modified: ${status.modified.length} files
   - Staged: ${status.staged.length} files
   - Untracked: ${status.untracked.length} files\n`);

    // Test 5: Get recent commits
    console.log("📚 Test 5: Recent Commits (last 3)");
    const commits = await gitService.getCommits(undefined, { limit: 3 });
    commits.all.forEach((commit, index) => {
      console.log(
        `   ${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message}`
      );
      console.log(`      Author: ${commit.author_name}`);
      console.log(`      Date: ${commit.date}\n`);
    });

    // Test 6: Get branches
    console.log("🌳 Test 6: Branches");
    const branches = await gitService.getBranches();
    console.log(`   Current: ${branches.current}`);
    console.log(`   Local branches: ${branches.local.join(", ")}`);
    console.log(`   Remote branches: ${branches.remote.length} found\n`);

    console.log("🎉 All Git tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

runTests();
