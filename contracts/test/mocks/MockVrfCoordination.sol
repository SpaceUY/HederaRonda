// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockVRFCoordinator {
    uint256 public lastRequestId;

    function requestRandomWords(
        bytes32 /* keyHash */,
        uint64 /* subId */,
        uint16 /* minimumRequestConfirmations */,
        uint32 /* callbackGasLimit */,
        uint32 /* numWords */
    ) external returns (uint256) {
        lastRequestId = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        );
        return lastRequestId;
    }
}