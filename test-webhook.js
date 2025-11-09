#!/usr/bin/env node

/**
 * Test script for GitHub webhook functionality
 */

import fetch from "node-fetch";

const WEBHOOK_URL = "http://localhost:4000/webhook/github";

console.log("🚀 Testing GitHub Webhook Endpoints...\n");

async function testWebhookEndpoints() {
  try {
    // Test 1: Health check
    console.log("🏥 Test 1: Webhook Health Check");
    const healthResponse = await fetch(
      "http://localhost:4000/webhook/github/health"
    );
    const healthData = await healthResponse.json();
    console.log("   ✅ Response:", JSON.stringify(healthData, null, 2));
    console.log();

    // Test 2: Test endpoint
    console.log("🧪 Test 2: Webhook Test Endpoint");
    const testResponse = await fetch(
      "http://localhost:4000/webhook/github/test"
    );
    const testData = await testResponse.json();
    console.log("   ✅ Response:", JSON.stringify(testData, null, 2));
    console.log();

    // Test 3: Pull Request webhook
    console.log("🔃 Test 3: GitHub Pull Request Webhook");
    const prPayload = {
      action: "opened",
      number: 456,
      pull_request: {
        number: 456,
        title: "Test webhook integration",
        user: { login: "webhook-tester" },
        diff_url: "https://github.com/test-repo/repo/pull/456.diff",
        html_url: "https://github.com/test-repo/repo/pull/456",
        head: { ref: "feature-webhook-test" },
        base: { ref: "main" },
      },
      repository: { full_name: "test-repo/repo" },
    };

    const prResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-event": "pull_request",
      },
      body: JSON.stringify(prPayload),
    });
    const prData = await prResponse.json();
    console.log(
      "   ✅ Pull Request Response:",
      JSON.stringify(prData, null, 2)
    );
    console.log();

    // Test 4: Push webhook
    console.log("📤 Test 4: GitHub Push Webhook");
    const pushPayload = {
      ref: "refs/heads/main",
      commits: [{ message: "Test commit 1" }, { message: "Test commit 2" }],
      head_commit: { message: "Test commit 2" },
      pusher: { name: "webhook-tester" },
      repository: { full_name: "test-repo/repo" },
    };

    const pushResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-event": "push",
      },
      body: JSON.stringify(pushPayload),
    });
    const pushData = await pushResponse.json();
    console.log("   ✅ Push Response:", JSON.stringify(pushData, null, 2));
    console.log();

    // Test 5: Unknown event
    console.log("❓ Test 5: Unknown GitHub Event");
    const unknownResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-event": "issues",
      },
      body: JSON.stringify({ action: "opened" }),
    });
    const unknownData = await unknownResponse.json();
    console.log(
      "   ✅ Unknown Event Response:",
      JSON.stringify(unknownData, null, 2)
    );
    console.log();

    console.log("🎉 All webhook tests completed successfully!");
  } catch (error) {
    console.error("❌ Webhook test failed:", error.message);
    console.log("\n⚠️  Make sure the server is running: npm run start:http");
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === "undefined") {
  console.log("📦 Installing node-fetch for testing...");
  console.log("Run: npm install node-fetch");
  console.log("Then try again.");
  process.exit(1);
}

runWebhookEndpoints();
