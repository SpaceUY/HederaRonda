// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";

contract VerifyRondaFactory is Script {
    // ERC1967 implementation slot: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function setUp() public {}

    function run() public {
        // Load environment variables
        address proxyAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");

        // Create fork to read state
        vm.createSelectFork("sepolia");

        // Get the factory instance through the proxy
        RondaFactory factory = RondaFactory(proxyAddress);

        // Get the current implementation address from the ERC1967 storage slot
        address implementation;
        assembly {
            implementation := sload(_IMPLEMENTATION_SLOT)
        }

        console2.log("=== RondaFactory Verification ===");
        console2.log("Proxy address:", proxyAddress);
        console2.log("Current implementation:", implementation);
        console2.log("Factory owner:", factory.owner());
        console2.log("VRF Coordinator:", factory.vrfCoordinator());
        console2.log("Subscription ID:", factory.subscriptionId());
        console2.log("Key Hash:", vm.toString(factory.keyHash()));
        console2.log("Callback Gas Limit:", factory.callbackGasLimit());
        console2.log("Penalty Token:", address(factory.penaltyToken()));
        console2.log("Router:", factory.router());
        console2.log("Ronda count:", factory.getRondaCount());
        
        // Get all ronda instances
        address[] memory rondaInstances = factory.getRondaInstances();
        console2.log("Ronda instances:");
        for (uint256 i = 0; i < rondaInstances.length; i++) {
            console2.log("  ", i, ":", rondaInstances[i]);
        }
    }
} 