// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {RondaFactory} from "../src/RondaFactory.sol";

contract TransferSubscriptionOwnership is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get VRF coordinator interface (V2.5)
        IVRFCoordinatorV2Plus coordinator = IVRFCoordinatorV2Plus(vrfCoordinator);

        // Step 1: Request subscription ownership transfer to factory (V2.5)
        console2.log("Requesting subscription ownership transfer...");
        coordinator.requestSubscriptionOwnerTransfer(subscriptionId, factoryAddress);

        // Step 2: Accept the transfer via factory
        console2.log("Accepting subscription ownership transfer via factory...");
        RondaFactory factory = RondaFactory(factoryAddress);
        factory.acceptSubscriptionOwnership();

        vm.stopBroadcast();

        console2.log("SUCCESS: Subscription ownership transfer completed (VRF V2.5):");
        console2.log("Subscription ID:", subscriptionId);
        console2.log("New owner (factory):", factoryAddress);
        console2.log("VRF Coordinator:", vrfCoordinator);
        console2.log("");
        console2.log("The factory now owns the subscription and can add consumers to new Ronda instances.");
    }
} 