// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";

contract RemoveSupportedChain is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");
        uint64 chainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get factory contract instance
        RondaFactory factory = RondaFactory(factoryAddress);

        // Get all Ronda instances
        address[] memory instances = factory.getRondaInstances();
        uint256 rondaCount = instances.length;

        console2.log("=== Removing Supported Chain from All Ronda Instances ===");
        console2.log("Factory address:", factoryAddress);
        console2.log("Chain selector:", chainSelector);
        console2.log("Total Ronda instances:", rondaCount);
        console2.log("");

        if (rondaCount == 0) {
            console2.log("No Ronda instances found. Nothing to do.");
            return;
        }

        // Remove supported chain from each Ronda instance
        for (uint256 i = 0; i < instances.length; i++) {
            // Remove supported chain
            factory.removeSupportedChain(i, chainSelector);
            
            console2.log("  - SUCCESS: Chain removed from this instance");
        }

        vm.stopBroadcast();

        console2.log("");
        console2.log("SUCCESS: Chain removal completed!");
        console2.log("");
        console2.log("=== Summary ===");
        console2.log("Chain Selector:", chainSelector);
        console2.log("Factory Contract:", factoryAddress);
        console2.log("Total instances processed:", rondaCount);
        console2.log("");
        console2.log("All Ronda instances no longer support cross-chain operations from this chain.");
    }
} 