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

        // Process one transaction at a time with longer delays
        for (uint256 i = 0; i < instances.length; i++) {
            console2.log("Processing Ronda instance", i + 1, "of", rondaCount);

            Ronda ronda = Ronda(instances[i]);
            bool isSupported = ronda.supportedChains(chainSelector);
            address sender = ronda.senderContracts(chainSelector);
            if (isSupported && sender == senderContract) {
                console2.log("  - Chain already supported");
                continue;
            }
            
            // Start broadcasting for this single transaction
            vm.startBroadcast(deployerPrivateKey);
            
            try factory.addSupportedChain(i, chainSelector, senderContract) {
                console2.log("  - SUCCESS: Chain added to Ronda instance", i);
            } catch Error(string memory reason) {
                console2.log("  - ERROR: Failed to add chain to Ronda instance", i, "-", reason);
            } catch {
                console2.log("  - ERROR: Failed to add chain to Ronda instance", i, "- Unknown error");
            }
            
            vm.stopBroadcast();
            
            // Add longer delay between transactions to avoid rate limiting
            if (i < instances.length - 1) {
                console2.log("  - Waiting 10 seconds before next transaction...");
                vm.sleep(10000); // 10 second delay
            }
        }

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