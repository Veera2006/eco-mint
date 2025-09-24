// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CarbonToken is ERC20, Ownable, Pausable {
    struct TokenMetadata {
        string reportId;
        string projectLocation;
        uint256 sequestrationAmount;
        uint256 mintedAt;
        bool verified;
    }
    
    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(string => uint256) public reportToTokenId;
    uint256 private _nextTokenId = 1;
    
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount,
        string reportId,
        string projectLocation
    );
    
    event TokenVerified(uint256 indexed tokenId, bool verified);
    
    constructor() ERC20("Blue Carbon Credit", "BCC") {}
    
    function mintCarbonToken(
        address recipient,
        uint256 sequestrationAmount,
        string memory reportId,
        string memory projectLocation
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(sequestrationAmount > 0, "Invalid sequestration amount");
        require(bytes(reportId).length > 0, "Invalid report ID");
        require(reportToTokenId[reportId] == 0, "Report already minted");
        
        uint256 tokenId = _nextTokenId++;
        uint256 tokenAmount = sequestrationAmount * 10**decimals();
        
        tokenMetadata[tokenId] = TokenMetadata({
            reportId: reportId,
            projectLocation: projectLocation,
            sequestrationAmount: sequestrationAmount,
            mintedAt: block.timestamp,
            verified: false
        });
        
        reportToTokenId[reportId] = tokenId;
        
        _mint(recipient, tokenAmount);
        
        emit TokenMinted(tokenId, recipient, tokenAmount, reportId, projectLocation);
        
        return tokenId;
    }
    
    function verifyToken(uint256 tokenId) external onlyOwner {
        require(tokenId < _nextTokenId, "Token does not exist");
        tokenMetadata[tokenId].verified = true;
        emit TokenVerified(tokenId, true);
    }
    
    function getTokenMetadata(uint256 tokenId) external view returns (TokenMetadata memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return tokenMetadata[tokenId];
    }
    
    function getTokenByReportId(string memory reportId) external view returns (uint256, TokenMetadata memory) {
        uint256 tokenId = reportToTokenId[reportId];
        require(tokenId != 0, "Report not found");
        return (tokenId, tokenMetadata[tokenId]);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}