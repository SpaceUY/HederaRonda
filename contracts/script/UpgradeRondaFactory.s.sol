// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeRondaFactory is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("RONDA_FACTORY_PROXY_ADDRESS");

        // Start broadcasting transactions
        vm.createSelectFork("sepolia");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the new implementation contract
        RondaFactory newImplementation = new RondaFactory();

        // Upgrade the proxy to point to the new implementation
        RondaFactory factory = RondaFactory(proxyAddress);
        factory.upgradeToAndCall(address(newImplementation), "");

        vm.stopBroadcast();

        // Log the upgrade information
        console2.log("New RondaFactory implementation deployed at:", address(newImplementation));
        console2.log("Proxy upgraded to new implementation");
        console2.log("Proxy address:", proxyAddress);
        
        // Verify the upgrade was successful
        console2.log("Verifying upgrade...");
        RondaFactory upgradedFactory = RondaFactory(proxyAddress);
        console2.log("Factory owner after upgrade:", upgradedFactory.owner());
        console2.log("VRF Coordinator after upgrade:", upgradedFactory.vrfCoordinator());
        console2.log("Router after upgrade:", upgradedFactory.router());
    }
} 