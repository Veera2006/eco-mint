const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonToken", function () {
  let CarbonToken;
  let carbonToken;
  let owner;
  let recipient;
  let addrs;

  beforeEach(async function () {
    [owner, recipient, ...addrs] = await ethers.getSigners();
    
    CarbonToken = await ethers.getContractFactory("CarbonToken");
    carbonToken = await CarbonToken.deploy();
    await carbonToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await carbonToken.name()).to.equal("Blue Carbon Credit");
      expect(await carbonToken.symbol()).to.equal("BCC");
    });

    it("Should set the right owner", async function () {
      expect(await carbonToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint carbon tokens with metadata", async function () {
      const sequestrationAmount = 100;
      const reportId = "report_001";
      const projectLocation = "Amazon Rainforest";

      await expect(
        carbonToken.mintCarbonToken(
          recipient.address,
          sequestrationAmount,
          reportId,
          projectLocation
        )
      )
        .to.emit(carbonToken, "TokenMinted")
        .withArgs(1, recipient.address, ethers.utils.parseEther("100"), reportId, projectLocation);

      // Check balance
      const balance = await carbonToken.balanceOf(recipient.address);
      expect(balance).to.equal(ethers.utils.parseEther("100"));

      // Check metadata
      const metadata = await carbonToken.getTokenMetadata(1);
      expect(metadata.reportId).to.equal(reportId);
      expect(metadata.projectLocation).to.equal(projectLocation);
      expect(metadata.sequestrationAmount).to.equal(sequestrationAmount);
      expect(metadata.verified).to.equal(false);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        carbonToken.connect(recipient).mintCarbonToken(
          recipient.address,
          100,
          "report_001",
          "Test Location"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow duplicate report IDs", async function () {
      const reportId = "report_001";
      
      await carbonToken.mintCarbonToken(
        recipient.address,
        100,
        reportId,
        "Location 1"
      );

      await expect(
        carbonToken.mintCarbonToken(
          recipient.address,
          200,
          reportId,
          "Location 2"
        )
      ).to.be.revertedWith("Report already minted");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await carbonToken.mintCarbonToken(
        recipient.address,
        100,
        "report_001",
        "Test Location"
      );
    });

    it("Should allow owner to verify tokens", async function () {
      await expect(carbonToken.verifyToken(1))
        .to.emit(carbonToken, "TokenVerified")
        .withArgs(1, true);

      const metadata = await carbonToken.getTokenMetadata(1);
      expect(metadata.verified).to.equal(true);
    });

    it("Should not allow non-owner to verify", async function () {
      await expect(
        carbonToken.connect(recipient).verifyToken(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Lookup", function () {
    beforeEach(async function () {
      await carbonToken.mintCarbonToken(
        recipient.address,
        100,
        "report_001",
        "Test Location"
      );
    });

    it("Should find token by report ID", async function () {
      const [tokenId, metadata] = await carbonToken.getTokenByReportId("report_001");
      expect(tokenId).to.equal(1);
      expect(metadata.reportId).to.equal("report_001");
    });

    it("Should fail for non-existent report", async function () {
      await expect(
        carbonToken.getTokenByReportId("non_existent")
      ).to.be.revertedWith("Report not found");
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause transfers", async function () {
      await carbonToken.mintCarbonToken(
        recipient.address,
        100,
        "report_001",
        "Test Location"
      );

      await carbonToken.pause();
      
      await expect(
        carbonToken.connect(recipient).transfer(addrs[0].address, 50)
      ).to.be.revertedWith("Pausable: paused");

      await carbonToken.unpause();
      
      await expect(
        carbonToken.connect(recipient).transfer(addrs[0].address, ethers.utils.parseEther("50"))
      ).to.not.be.reverted;
    });
  });
});