// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockVRFCoordinator {
    uint256 public lastRequestId;
    mapping(uint256 => mapping(address => bool)) public consumers;
    mapping(uint256 => bool) public subscriptions;
    uint256 public nextSubscriptionId = 1;

    // VRF V2.5 RandomWordsRequest struct
    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function createSubscription() external returns (uint256) {
        uint256 subId = nextSubscriptionId++;
        subscriptions[subId] = true;
        return subId;
    }

    function addConsumer(
        uint256 subId,
        address consumer
    ) external {
        // Create subscription if it doesn't exist (for testing purposes)
        if (!subscriptions[subId]) {
            subscriptions[subId] = true;
        }
        consumers[subId][consumer] = true;
    }

    function removeConsumer(
        uint256 subId,
        address consumer
    ) external {
        consumers[subId][consumer] = false;
    }

    // VRF V2.5 function signature
    function requestRandomWords(
        RandomWordsRequest calldata req
    ) external returns (uint256) {
        require(subscriptions[req.subId], "Subscription not found");
        require(consumers[req.subId][msg.sender], "Consumer not found");
        
        lastRequestId = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        );
        return lastRequestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        address consumer,
        uint256[] calldata randomWords
    ) external {
        // Mock fulfillment - in real scenario this would be called by the oracle
        VRFConsumerBaseV2Plus(consumer).rawFulfillRandomWords(requestId, randomWords);
    }
}

// Minimal interface for the consumer
interface VRFConsumerBaseV2Plus {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}