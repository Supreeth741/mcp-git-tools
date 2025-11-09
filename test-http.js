#!/usr/bin/env node

/**
 * Simple test script to verify HTTP endpoints
 */

const BASE_URL = "http://localhost:4000";

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    console.log(`   GET ${BASE_URL}${endpoint}`);

    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("🚀 Starting HTTP endpoint tests...");
  console.log(`📍 Base URL: ${BASE_URL}`);

  const tests = [
    ["", "Main endpoint - Server info"],
    ["/health", "Health check endpoint"],
    ["/status", "Server status endpoint"],
    ["/tools", "Available tools endpoint"],
  ];

  let passedTests = 0;

  for (const [endpoint, description] of tests) {
    const result = await testEndpoint(endpoint, description);
    if (result) passedTests++;
  }

  console.log(`\n📊 Test Results: ${passedTests}/${tests.length} passed`);

  if (passedTests === tests.length) {
    console.log(
      "🎉 All tests passed! MCP Git Tools server is working correctly."
    );
  } else {
    console.log(
      "⚠️  Some tests failed. Check if the server is running on port 4000."
    );
    console.log("   Run: npm run start:http");
  }
}

// Run the tests
runTests().catch(console.error);
