// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";

contract AddSupportedChain is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");
        uint64 chainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        address senderContract = vm.envAddress("SENDER_CONTRACT_ADDRESS");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get factory contract instance
        RondaFactory factory = RondaFactory(factoryAddress);

        // Get all Ronda instances
        address[] memory instances = factory.getRondaInstances();
        uint256 rondaCount = instances.length;

        console2.log("=== Adding Supported Chain to All Ronda Instances ===");
        console2.log("Factory address:", factoryAddress);
        console2.log("Chain selector:", chainSelector);
        console2.log("Sender contract:", senderContract);
        console2.log("Total Ronda instances:", rondaCount);
        console2.log("");

        if (rondaCount == 0) {
            console2.log("No Ronda instances found. Nothing to do.");
            return;
        }

        // Add supported chain to each Ronda instance
        for (uint256 i = 0; i < instances.length; i++) {
            // Add supported chain
            factory.addSupportedChain(i, chainSelector, senderContract);
            
            console2.log("  - SUCCESS: Chain added to this instance");
        }

        vm.stopBroadcast();

        console2.log("");
        console2.log("SUCCESS: Chain configuration completed!");
        console2.log("");
        console2.log("=== Summary ===");
        console2.log("Chain Selector:", chainSelector);
        console2.log("Sender Contract:", senderContract);
        console2.log("Factory Contract:", factoryAddress);
        console2.log("Total instances processed:", rondaCount);
        console2.log("");
        console2.log("All Ronda instances now support cross-chain operations from this chain.");
    }
} 