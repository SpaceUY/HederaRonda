// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {RondaSBT} from "../src/RondaSBT.sol";

contract FixOwnership is Script {
    function run() external {
        // Read deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Fixing RondaSBT ownership...");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // RondaSBT contract address
        RondaSBT penaltyToken = RondaSBT(0x5f0A722306F1A5016ffa53bae98BB84439bB8219);
        
        // Factory contract address
        address factoryAddress = 0xe11aE439bCa99F988C325e2cc9811a2219106EB7;
        
        console.log("Current RondaSBT owner:", penaltyToken.owner());
        console.log("Transferring ownership to factory:", factoryAddress);
        
        // Transfer ownership to factory
        penaltyToken.transferOwnership(factoryAddress);
        
        console.log("New RondaSBT owner:", penaltyToken.owner());

        vm.stopBroadcast();
        
        console.log("Ownership transfer complete!");
    }
} 