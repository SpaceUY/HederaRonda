// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";

contract AddSupportedChainSingle is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");
        uint64 chainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        address senderContract = vm.envAddress("SENDER_CONTRACT_ADDRESS");
        uint256 rondaIndex = vm.envUint("RONDA_INDEX"); // Add this to your .env

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Get factory contract instance
        RondaFactory factory = RondaFactory(factoryAddress);

        // Get all Ronda instances
        address[] memory instances = factory.getRondaInstances();
        uint256 rondaCount = instances.length;

        console2.log("=== Adding Supported Chain to Single Ronda Instance ===");
        console2.log("Factory address:", factoryAddress);
        console2.log("Chain selector:", chainSelector);
        console2.log("Sender contract:", senderContract);
        console2.log("Target Ronda index:", rondaIndex);
        console2.log("Total Ronda instances:", rondaCount);
        console2.log("");

        require(rondaIndex < rondaCount, "Ronda index out of bounds");

        console2.log("Ronda contract address:", instances[rondaIndex]);

        // Add supported chain to the specific Ronda instance
        try factory.addSupportedChain(rondaIndex, chainSelector, senderContract) {
            console2.log("SUCCESS: Chain added to Ronda instance", rondaIndex);
        } catch Error(string memory reason) {
            console2.log("ERROR: Failed to add chain to Ronda instance", rondaIndex, "-", reason);
            revert(reason);
        } catch {
            console2.log("ERROR: Failed to add chain to Ronda instance", rondaIndex, "- Unknown error");
            revert("Unknown error occurred");
        }

        vm.stopBroadcast();

        console2.log("");
        console2.log("SUCCESS: Chain configuration completed!");
        console2.log("");
        console2.log("=== Summary ===");
        console2.log("Chain Selector:", chainSelector);
        console2.log("Sender Contract:", senderContract);
        console2.log("Factory Contract:", factoryAddress);
        console2.log("Ronda Instance:", rondaIndex);
        console2.log("");
        console2.log("Ronda instance now supports cross-chain operations from this chain.");
    }
} 