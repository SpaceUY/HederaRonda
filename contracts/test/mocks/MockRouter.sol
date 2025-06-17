// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "chainlink-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "chainlink-ccip/contracts/libraries/Client.sol";

contract MockRouter is IRouterClient {
    uint256 public constant MOCK_FEE = 0.1 ether;
    bytes32 public lastMessageId;

    function getFee(
        uint64,
        Client.EVM2AnyMessage memory
    ) external pure returns (uint256) {
        return MOCK_FEE;
    }

    function ccipSend(
        uint64,
        Client.EVM2AnyMessage memory
    ) external payable returns (bytes32) {
        require(msg.value >= MOCK_FEE, "Insufficient fee");
        lastMessageId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender)
        );
        return lastMessageId;
    }

    function getSupportedTokens(
        uint64
    ) external pure returns (address[] memory) {
        return new address[](0);
    }

    function getOffRamp(uint64) external pure returns (address) {
        return address(0);
    }

    function getOnRamp(uint64) external pure returns (address) {
        return address(0);
    }

    function isChainSupported(
        uint64 destChainSelector
    ) external view override returns (bool supported) {}
} 