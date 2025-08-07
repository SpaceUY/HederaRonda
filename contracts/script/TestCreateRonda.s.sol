// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {RondaFactorySimple} from "../src/RondaFactorySimple.sol";

contract TestCreateRonda is Script {
    function run() external {
        // Read deployer private key and factory address from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        require(factoryAddress != address(0), "Please set FACTORY_ADDRESS env var");
        
        console.log("Testing Ronda creation...");
        console.log("Factory address:", factoryAddress);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get the factory contract
        RondaFactorySimple factory = RondaFactorySimple(factoryAddress);
        
        console.log("Current Ronda count:", factory.getRondaCount());

        // Create a simple Ronda
        uint256 participantCount = 2;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 0.001 ether;
        uint256 entryFee = 0.0001 ether;
        
        // Create interest distribution that sums to 0
        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = -3;
        interestDistribution[1] = -2;
        interestDistribution[2] = 5;

        console.log("Creating Ronda...");
        
        // Create the Ronda
        address newRonda = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(0) // Use ETH as payment token
        );

        console.log("New Ronda created at:", newRonda);
        console.log("Updated Ronda count:", factory.getRondaCount());

        vm.stopBroadcast();
    }
} 