// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {RondaSBT} from "../src/RondaSBT.sol";

contract DeployHedera is Script {
    function run() external {
        // Read deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("HEDERA_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSBT (penalty token)
        RondaSBT penaltyToken = new RondaSBT();

        // Deploy RondaFactory
        RondaFactory factory = new RondaFactory();

        // Initialize RondaFactory
        factory.initialize(address(penaltyToken));

        // Transfer ownership of RondaSBT to factory
        penaltyToken.transferOwnership(address(factory));

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("Deployed contracts:");
        console.log("RondaSBT:", address(penaltyToken));
        console.log("RondaFactory:", address(factory));
    }
} 