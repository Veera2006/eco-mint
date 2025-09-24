const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceMultiSig", function () {
  let GovernanceMultiSig;
  let governance;
  let owner;
  let approver1;
  let approver2;
  let approver3;
  let nonApprover;

  beforeEach(async function () {
    [owner, approver1, approver2, approver3, nonApprover] = await ethers.getSigners();
    
    GovernanceMultiSig = await ethers.getContractFactory("GovernanceMultiSig");
    governance = await GovernanceMultiSig.deploy([
      approver1.address,
      approver2.address,
      approver3.address
    ]);
    await governance.deployed();
  });

  describe("Deployment", function () {
    it("Should set initial approvers correctly", async function () {
      expect(await governance.authorizedApprovers(approver1.address)).to.equal(true);
      expect(await governance.authorizedApprovers(approver2.address)).to.equal(true);
      expect(await governance.authorizedApprovers(approver3.address)).to.equal(true);
      expect(await governance.authorizedApprovers(nonApprover.address)).to.equal(false);
    });

    it("Should set required approvals to 2", async function () {
      expect(await governance.requiredApprovals()).to.equal(2);
    });
  });

  describe("Approver Management", function () {
    it("Should allow owner to add approvers", async function () {
      await expect(governance.addApprover(nonApprover.address))
        .to.emit(governance, "ApproverAdded")
        .withArgs(nonApprover.address);

      expect(await governance.authorizedApprovers(nonApprover.address)).to.equal(true);
    });

    it("Should allow owner to remove approvers", async function () {
      await expect(governance.removeApprover(approver3.address))
        .to.emit(governance, "ApproverRemoved")
        .withArgs(approver3.address);

      expect(await governance.authorizedApprovers(approver3.address)).to.equal(false);
    });

    it("Should not allow non-owner to manage approvers", async function () {
      await expect(
        governance.connect(approver1).addApprover(nonApprover.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Approval Flow", function () {
    const reportId = "report_001";

    beforeEach(async function () {
      await governance.createApproval(reportId);
    });

    it("Should create approval correctly", async function () {
      const [approvalsCount, executed, canExecute, approvers] = await governance.getApprovalStatus(reportId);
      expect(approvalsCount).to.equal(0);
      expect(executed).to.equal(false);
      expect(canExecute).to.equal(false);
      expect(approvers.length).to.equal(0);
    });

    it("Should allow authorized approvers to submit approvals", async function () {
      const notes = "Looks good, approved!";
      
      await expect(
        governance.connect(approver1).submitApproval(reportId, notes)
      )
        .to.emit(governance, "ApprovalSubmitted")
        .withArgs(reportId, approver1.address, notes);

      const [approvalsCount] = await governance.getApprovalStatus(reportId);
      expect(approvalsCount).to.equal(1);

      const approverNote = await governance.getApproverNote(reportId, approver1.address);
      expect(approverNote).to.equal(notes);
    });

    it("Should auto-execute when required approvals reached", async function () {
      await governance.connect(approver1).submitApproval(reportId, "Approved by approver1");
      
      await expect(
        governance.connect(approver2).submitApproval(reportId, "Approved by approver2")
      )
        .to.emit(governance, "ApprovalExecuted")
        .withArgs(reportId, 2);

      const [, executed] = await governance.getApprovalStatus(reportId);
      expect(executed).to.equal(true);
    });

    it("Should not allow double approval", async function () {
      await governance.connect(approver1).submitApproval(reportId, "First approval");
      
      await expect(
        governance.connect(approver1).submitApproval(reportId, "Second approval")
      ).to.be.revertedWith("Already approved by this address");
    });

    it("Should not allow non-approvers to submit", async function () {
      await expect(
        governance.connect(nonApprover).submitApproval(reportId, "Unauthorized approval")
      ).to.be.revertedWith("Not an authorized approver");
    });

    it("Should not allow approval after execution", async function () {
      await governance.connect(approver1).submitApproval(reportId, "Approval 1");
      await governance.connect(approver2).submitApproval(reportId, "Approval 2");
      
      await expect(
        governance.connect(approver3).submitApproval(reportId, "Approval 3")
      ).to.be.revertedWith("Approval already executed");
    });
  });

  describe("Approval Status", function () {
    const reportId = "report_001";

    beforeEach(async function () {
      await governance.createApproval(reportId);
    });

    it("Should correctly report approval readiness", async function () {
      expect(await governance.isApprovalReady(reportId)).to.equal(false);
      
      await governance.connect(approver1).submitApproval(reportId, "Approval 1");
      expect(await governance.isApprovalReady(reportId)).to.equal(false);
      
      await governance.connect(approver2).submitApproval(reportId, "Approval 2");
      expect(await governance.isApprovalReady(reportId)).to.equal(false); // Already executed
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to change required approvals", async function () {
      await expect(governance.setRequiredApprovals(3))
        .to.emit(governance, "RequiredApprovalsChanged")
        .withArgs(3);

      expect(await governance.requiredApprovals()).to.equal(3);
    });

    it("Should not allow setting required approvals > approvers count", async function () {
      await expect(
        governance.setRequiredApprovals(5)
      ).to.be.revertedWith("Cannot require more approvals than approvers");
    });
  });
});