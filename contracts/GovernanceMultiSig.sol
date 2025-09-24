// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GovernanceMultiSig is Ownable, ReentrancyGuard {
    struct Approval {
        string reportId;
        address[] approvers;
        mapping(address => bool) hasApproved;
        mapping(address => string) approvalNotes;
        uint256 approvalsCount;
        bool executed;
        uint256 createdAt;
    }
    
    mapping(string => Approval) public approvals;
    mapping(address => bool) public authorizedApprovers;
    address[] public approversList;
    
    uint256 public requiredApprovals = 2;
    uint256 public approvalTimeout = 7 days;
    
    event ApproverAdded(address indexed approver);
    event ApproverRemoved(address indexed approver);
    event ApprovalSubmitted(string indexed reportId, address indexed approver, string notes);
    event ApprovalExecuted(string indexed reportId, uint256 approvalsCount);
    event RequiredApprovalsChanged(uint256 newRequired);
    
    modifier onlyApprover() {
        require(authorizedApprovers[msg.sender], "Not an authorized approver");
        _;
    }
    
    modifier approvalExists(string memory reportId) {
        require(approvals[reportId].createdAt > 0, "Approval does not exist");
        _;
    }
    
    constructor(address[] memory _initialApprovers) {
        for (uint i = 0; i < _initialApprovers.length; i++) {
            authorizedApprovers[_initialApprovers[i]] = true;
            approversList.push(_initialApprovers[i]);
        }
    }
    
    function addApprover(address approver) external onlyOwner {
        require(approver != address(0), "Invalid approver address");
        require(!authorizedApprovers[approver], "Already an approver");
        
        authorizedApprovers[approver] = true;
        approversList.push(approver);
        
        emit ApproverAdded(approver);
    }
    
    function removeApprover(address approver) external onlyOwner {
        require(authorizedApprovers[approver], "Not an approver");
        
        authorizedApprovers[approver] = false;
        
        // Remove from approversList
        for (uint i = 0; i < approversList.length; i++) {
            if (approversList[i] == approver) {
                approversList[i] = approversList[approversList.length - 1];
                approversList.pop();
                break;
            }
        }
        
        emit ApproverRemoved(approver);
    }
    
    function createApproval(string memory reportId) external onlyOwner {
        require(bytes(reportId).length > 0, "Invalid report ID");
        require(approvals[reportId].createdAt == 0, "Approval already exists");
        
        Approval storage newApproval = approvals[reportId];
        newApproval.reportId = reportId;
        newApproval.createdAt = block.timestamp;
    }
    
    function submitApproval(
        string memory reportId,
        string memory notes
    ) external onlyApprover approvalExists(reportId) nonReentrant {
        Approval storage approval = approvals[reportId];
        
        require(!approval.executed, "Approval already executed");
        require(!approval.hasApproved[msg.sender], "Already approved by this address");
        require(
            block.timestamp <= approval.createdAt + approvalTimeout,
            "Approval timeout exceeded"
        );
        
        approval.hasApproved[msg.sender] = true;
        approval.approvalNotes[msg.sender] = notes;
        approval.approvers.push(msg.sender);
        approval.approvalsCount++;
        
        emit ApprovalSubmitted(reportId, msg.sender, notes);
        
        // Auto-execute if required approvals reached
        if (approval.approvalsCount >= requiredApprovals) {
            approval.executed = true;
            emit ApprovalExecuted(reportId, approval.approvalsCount);
        }
    }
    
    function getApprovalStatus(string memory reportId) 
        external 
        view 
        approvalExists(reportId)
        returns (
            uint256 approvalsCount,
            bool executed,
            bool canExecute,
            address[] memory approvers
        ) 
    {
        Approval storage approval = approvals[reportId];
        
        canExecute = approval.approvalsCount >= requiredApprovals && 
                    !approval.executed &&
                    block.timestamp <= approval.createdAt + approvalTimeout;
        
        return (
            approval.approvalsCount,
            approval.executed,
            canExecute,
            approval.approvers
        );
    }
    
    function getApproverNote(string memory reportId, address approver) 
        external 
        view 
        approvalExists(reportId)
        returns (string memory) 
    {
        return approvals[reportId].approvalNotes[approver];
    }
    
    function setRequiredApprovals(uint256 _requiredApprovals) external onlyOwner {
        require(_requiredApprovals > 0, "Required approvals must be > 0");
        require(_requiredApprovals <= approversList.length, "Cannot require more approvals than approvers");
        
        requiredApprovals = _requiredApprovals;
        emit RequiredApprovalsChanged(_requiredApprovals);
    }
    
    function getApprovers() external view returns (address[] memory) {
        return approversList;
    }
    
    function isApprovalReady(string memory reportId) external view returns (bool) {
        Approval storage approval = approvals[reportId];
        return approval.approvalsCount >= requiredApprovals && 
               !approval.executed &&
               block.timestamp <= approval.createdAt + approvalTimeout;
    }
}