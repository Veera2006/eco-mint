const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy CarbonToken
  console.log("\n--- Deploying CarbonToken ---");
  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy();
  await carbonToken.deployed();
  
  console.log("CarbonToken deployed to:", carbonToken.address);

  // Deploy GovernanceMultiSig with initial approvers
  console.log("\n--- Deploying GovernanceMultiSig ---");
  const initialApprovers = [
    deployer.address, // Add deployer as initial approver
    // Add more approver addresses here for production
  ];
  
  const GovernanceMultiSig = await hre.ethers.getContractFactory("GovernanceMultiSig");
  const governance = await GovernanceMultiSig.deploy(initialApprovers);
  await governance.deployed();
  
  console.log("GovernanceMultiSig deployed to:", governance.address);
  console.log("Initial approvers:", initialApprovers);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      CarbonToken: {
        address: carbonToken.address,
        deployer: deployer.address
      },
      GovernanceMultiSig: {
        address: governance.address,
        deployer: deployer.address,
        initialApprovers: initialApprovers
      }
    },
    deployedAt: new Date().toISOString()
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n✅ Deployment info saved to: ${deploymentFile}`);

  // Export contract ABIs for frontend/backend integration
  const carbonTokenArtifact = await hre.artifacts.readArtifact("CarbonToken");
  const governanceArtifact = await hre.artifacts.readArtifact("GovernanceMultiSig");
  
  const abiExport = {
    CarbonToken: {
      address: carbonToken.address,
      abi: carbonTokenArtifact.abi
    },
    GovernanceMultiSig: {
      address: governance.address,
      abi: governanceArtifact.abi
    }
  };
  
  const abiFile = path.join(deploymentsDir, `${hre.network.name}-abis.json`);
  fs.writeFileSync(abiFile, JSON.stringify(abiExport, null, 2));
  
  console.log(`✅ Contract ABIs exported to: ${abiFile}`);

  // Verify contracts (only on testnets/mainnets)
  if (hre.network.name !== "hardhat") {
    console.log("\n--- Waiting for block confirmations ---");
    await carbonToken.deployTransaction.wait(6);
    await governance.deployTransaction.wait(6);

    console.log("\n--- Verifying contracts ---");
    try {
      await hre.run("verify:verify", {
        address: carbonToken.address,
        constructorArguments: []
      });
      console.log("✅ CarbonToken verified");
    } catch (error) {
      console.log("❌ CarbonToken verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: governance.address,
        constructorArguments: [initialApprovers]
      });
      console.log("✅ GovernanceMultiSig verified");
    } catch (error) {
      console.log("❌ GovernanceMultiSig verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed!");
  console.log("===============================");
  console.log("CarbonToken:", carbonToken.address);
  console.log("GovernanceMultiSig:", governance.address);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });