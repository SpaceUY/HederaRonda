// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RondaSBT is ERC721Enumerable, Ownable {
    // Mapping to track if an address has a penalty token
    mapping(address => bool) public hasPenalty;
    
    // Mapping to track whitelisted Ronda contracts
    mapping(address => bool) public whitelistedRondas;
    
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event RondaWhitelisted(address indexed rondaContract);
    event RondaRemovedFromWhitelist(address indexed rondaContract);

    constructor() ERC721("Ronda Penalty", "RONDA-P") Ownable(msg.sender) {}

    modifier onlyWhitelisted() {
        require(whitelistedRondas[msg.sender], "Caller is not whitelisted");
        _;
    }

    function addToWhitelist(address _rondaContract) external onlyOwner {
        require(_rondaContract != address(0), "Invalid address");
        require(!whitelistedRondas[_rondaContract], "Already whitelisted");
        whitelistedRondas[_rondaContract] = true;
        emit RondaWhitelisted(_rondaContract);
    }

    function removeFromWhitelist(address _rondaContract) external onlyOwner {
        require(whitelistedRondas[_rondaContract], "Not whitelisted");
        whitelistedRondas[_rondaContract] = false;
        emit RondaRemovedFromWhitelist(_rondaContract);
    }

    function mintPenalty(address to) external onlyWhitelisted {
        require(!hasPenalty[to], "Address already has penalty");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        hasPenalty[to] = true;
    }

    function burnPenalty(address from) external onlyWhitelisted {
        require(hasPenalty[from], "Address has no penalty");
        uint256 tokenId = tokenOfOwnerByIndex(from, 0);
        _burn(tokenId);
        hasPenalty[from] = false;
    }

    // Override transfer functions to make token non-transferable
    function transferFrom(
        address /*from*/, 
        address /*to*/, 
        uint256 /*tokenId*/
    ) public pure override(ERC721, IERC721) {
        revert("Token is non-transferable");
    }

    function safeTransferFrom(
        address /*from*/, 
        address /*to*/, 
        uint256 /*tokenId*/, 
        bytes memory /*data*/
    ) public pure override(ERC721, IERC721) {
        revert("Token is non-transferable");
    }
} 