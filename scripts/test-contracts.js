const { ethers } = require("ethers");
const fs = require("fs");

// Test script for deployed contracts
async function testContracts() {
  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("./contracts/deployments/mumbai.json"));
  const abis = JSON.parse(fs.readFileSync("./contracts/deployments/mumbai-abis.json"));

  // Connect to Mumbai testnet
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com"
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Initialize contracts
  const carbonToken = new ethers.Contract(
    abis.CarbonToken.address,
    abis.CarbonToken.abi,
    wallet
  );

  const governance = new ethers.Contract(
    abis.GovernanceMultiSig.address,
    abis.GovernanceMultiSig.abi,
    wallet
  );

  console.log("🧪 Testing Blue Carbon Contracts");
  console.log("=====================================");

  try {
    // Test 1: Check contract info
    console.log("\n1️⃣ Contract Information");
    console.log(`CarbonToken: ${carbonToken.address}`);
    console.log(`Name: ${await carbonToken.name()}`);
    console.log(`Symbol: ${await carbonToken.symbol()}`);
    console.log(`Owner: ${await carbonToken.owner()}`);

    console.log(`\nGovernance: ${governance.address}`);
    console.log(`Required Approvals: ${await governance.requiredApprovals()}`);
    console.log(`Approvers: ${await governance.getApprovers()}`);

    // Test 2: Create governance approval
    console.log("\n2️⃣ Creating Governance Approval");
    const reportId = `test_report_${Date.now()}`;
    const tx1 = await governance.createApproval(reportId);
    await tx1.wait();
    console.log(`✅ Created approval for report: ${reportId}`);

    // Test 3: Submit approval
    console.log("\n3️⃣ Submitting Approval");
    const tx2 = await governance.submitApproval(reportId, "Test approval - automated script");
    await tx2.wait();
    console.log(`✅ Submitted approval for report: ${reportId}`);

    // Check approval status
    const [count, executed, canExecute] = await governance.getApprovalStatus(reportId);
    console.log(`Approvals: ${count}, Executed: ${executed}, Can Execute: ${canExecute}`);

    // Test 4: Mint carbon token (if governance is ready)
    if (count >= 2 || executed) {
      console.log("\n4️⃣ Minting Carbon Token");
      const tx3 = await carbonToken.mintCarbonToken(
        wallet.address,
        100, // 100 tons CO2
        reportId,
        "Test Location - Automated Script"
      );
      const receipt = await tx3.wait();
      
      const mintEvent = receipt.events?.find(e => e.event === "TokenMinted");
      if (mintEvent) {
        console.log(`✅ Minted token ID: ${mintEvent.args[0]}`);
        console.log(`Amount: ${ethers.utils.formatEther(mintEvent.args[2])} BCC`);
      }

      // Check token metadata
      const metadata = await carbonToken.getTokenMetadata(1);
      console.log("Token Metadata:", {
        reportId: metadata.reportId,
        projectLocation: metadata.projectLocation,
        sequestrationAmount: metadata.sequestrationAmount.toString(),
        verified: metadata.verified
      });

      // Check balance
      const balance = await carbonToken.balanceOf(wallet.address);
      console.log(`Token Balance: ${ethers.utils.formatEther(balance)} BCC`);
    } else {
      console.log("⏳ Need more approvals to mint tokens");
    }

    console.log("\n🎉 All tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
  }
}

// Test ML service
async function testMLService() {
  const axios = require("axios");
  
  console.log("\n🧪 Testing ML Validation Service");
  console.log("=====================================");

  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";

  try {
    // Test health endpoint
    console.log("\n1️⃣ Health Check");
    const health = await axios.get(`${mlServiceUrl}/health`);
    console.log("✅ Service Status:", health.data.status);

    // Test validation endpoint
    console.log("\n2️⃣ Report Validation");
    const testReport = {
      report_data: {
        project_location: "Test Amazon Project",
        project_type: "tropical_forest",
        area_hectares: 50.5,
        tree_species: "Mixed tropical species",
        planting_date: "2023-01-15",
        monitoring_period_months: 18,
        biomass_data: {
          above_ground_biomass: 120,
          tree_count: 2500
        },
        soil_data: {
          organic_carbon: 2.5
        }
      },
      file_urls: []
    };

    const validation = await axios.post(`${mlServiceUrl}/validate-report`, testReport);
    console.log("✅ Validation Result:", {
      status: validation.data.status,
      estimated_sequestration: validation.data.estimated_sequestration,
      confidence_score: validation.data.confidence_score,
      notes: validation.data.validation_notes
    });

    console.log("\n🎉 ML Service tests completed!");

  } catch (error) {
    console.error("❌ ML Service test failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

// Combined test runner
async function runAllTests() {
  console.log("🚀 Blue Carbon Platform Integration Tests");
  console.log("==========================================");

  // Test contracts if on blockchain network
  if (process.env.PRIVATE_KEY && process.env.POLYGON_MUMBAI_RPC_URL) {
    await testContracts();
  } else {
    console.log("⏭️  Skipping contract tests (no wallet configured)");
  }

  // Test ML service
  await testMLService();

  console.log("\n✨ All integration tests completed!");
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testContracts, testMLService, runAllTests };