// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Ronda.sol";

contract DeployRonda is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        // Example parameters
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;
        
        // Create interest distribution that sums to 0
        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;  // +5%
        interestDistribution[1] = -2; // -2%
        interestDistribution[2] = -3; // -3%

        address paymentToken = address(0x0000000000000000000000000000000000000000);
        address penaltyToken = address(0x0000000000000000000000000000000000000000);
        
        // Chainlink VRF parameters
        address vrfCoordinator = address(0x0000000000000000000000000000000000000000); // Replace with actual VRF coordinator
        uint64 subscriptionId = 1; // Replace with your subscription ID
        bytes32 keyHash = bytes32(uint256(1)); // Replace with your key hash
        uint32 callbackGasLimit = 100000;

        new Ronda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            paymentToken,
            penaltyToken,
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit
        );
        vm.stopBroadcast();
    }
} 