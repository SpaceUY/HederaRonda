// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "../src/RondaSBT.sol";

contract DeployRondaFactory is Script {
    address public owner;
    RondaFactory public factory;
    RondaSBT public penaltyToken;

    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Chainlink VRF parameters
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        uint32 callbackGasLimit = uint32(vm.envUint("VRF_CALLBACK_GAS_LIMIT"));
        address router = vm.envAddress("CCIP_ROUTER");

        // Start broadcasting transactions
        vm.createSelectFork("sepolia");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSBT first
        penaltyToken = new RondaSBT();

        // Deploy RondaFactory
        factory = new RondaFactory(
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            address(penaltyToken),
            router
        );

        owner = factory.owner();

        // Add the factory to the whitelist
        penaltyToken.addToWhitelist(address(factory));

        // Transfer RondaSBT ownership to the factory
        penaltyToken.transferOwnership(address(factory));

        vm.stopBroadcast();

        // Log the deployed addresses
        console2.log("RondaSBT deployed at:", address(penaltyToken));
        console2.log("RondaFactory deployed at:", address(factory));
        console2.log("RondaSBT owner:", penaltyToken.owner());
    }
}
