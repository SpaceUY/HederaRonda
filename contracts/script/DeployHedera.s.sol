// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {RondaFactorySimple} from "../src/RondaFactorySimple.sol";
import {RondaSBT} from "../src/RondaSBT.sol";

contract DeployHedera is Script {
    function run() external {
        // Read deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Starting Hedera Testnet Deployment...");
        console.log("Deploying: RondaSBT + RondaFactorySimple (Simple, Non-Upgradeable)");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy RondaSBT
        console.log("Deploying RondaSBT...");
        RondaSBT penaltyToken = new RondaSBT();
        console.log("RondaSBT deployed at:", address(penaltyToken));

        // Step 2: Deploy RondaFactorySimple
        console.log("Deploying RondaFactorySimple...");
        RondaFactorySimple factory = new RondaFactorySimple(address(penaltyToken));
        console.log("RondaFactorySimple deployed at:", address(factory));

        // Step 3: Transfer ownership
        console.log("Transferring RondaSBT ownership to factory...");
        penaltyToken.transferOwnership(address(factory));

        vm.stopBroadcast();

        // Deployment Summary
        console.log("DEPLOYMENT COMPLETE!");
        console.log("=============================================================");
        console.log("CONTRACT ADDRESSES:");
        console.log("RondaSBT (Penalty Token):", address(penaltyToken));
        console.log("RondaFactorySimple:", address(factory));
        console.log("=============================================================");
    }
} 