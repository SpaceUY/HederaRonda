// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaSender.sol";

contract DeployRondaSender is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // CCIP Router address for Avalanche Fuji testnet
        address ccipRouter = vm.envAddress("CCIP_ROUTER_FUJI");
        
        // Destination chain selector (where the Ronda contracts are deployed)
        // Common chain selectors:
        // - Ethereum Sepolia: 16015286601757825753
        // - Polygon Mumbai: 12532609583862916517
        // - BSC Testnet: 13264668187771770619
        // - Base Sepolia: 10382471318274421120
        // - Avalanche Fuji: 14767482510784806043
        uint64 destinationChainSelector = uint64(vm.envUint("DESTINATION_CHAIN_SELECTOR"));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSender
        RondaSender sender = new RondaSender(
            ccipRouter,
            destinationChainSelector
        );

        vm.stopBroadcast();

        // Log the deployed addresses
        console2.log("=== RondaSender Deployment on Avalanche Fuji ===");
        console2.log("RondaSender deployed at:", address(sender));
        console2.log("CCIP Router (Fuji):", ccipRouter);
        console2.log("Destination Chain Selector:", destinationChainSelector);
        console2.log("Owner:", sender.owner());
        console2.log("");
        console2.log("=== Environment Variables Used ===");
        console2.log("CCIP_ROUTER_FUJI:", ccipRouter);
        console2.log("DESTINATION_CHAIN_SELECTOR:", destinationChainSelector);
        console2.log("");
        console2.log("=== Next Steps ===");
        console2.log("1. Set up the destination chain's Ronda contracts");
        console2.log("2. Configure the RondaSender with the correct Ronda contract addresses");
        console2.log("3. Test cross-chain functionality");
    }
} 