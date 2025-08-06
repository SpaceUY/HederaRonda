// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "../src/RondaSBT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployFactory is Script {
    RondaFactory public factory;
    RondaFactory public implementation;

    function run() public {
        // Get the RondaSBT address from environment variable
        address penaltyTokenAddress = vm.envAddress("RONDASBT_ADDRESS");
        require(penaltyTokenAddress != address(0), "Please set RONDASBT_ADDRESS env var");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get the nonce from environment variable, default to 0 if not set
        uint64 nonce = uint64(vm.envOr("NONCE", uint256(0)));
        
        // Start broadcasting with explicit nonce
        vm.setNonce(deployer, nonce);
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the implementation contract
        implementation = new RondaFactory();
        console2.log("RondaFactory implementation deployed at:", address(implementation));

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            penaltyTokenAddress
        );

        // Deploy the proxy pointing to the implementation
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        // Get the factory instance through the proxy
        factory = RondaFactory(address(proxy));

        // Transfer ownership of penalty token to factory
        RondaSBT(penaltyTokenAddress).transferOwnership(address(factory));

        vm.stopBroadcast();

        console2.log("=============================================================");
        console2.log("Deployment Summary:");
        console2.log("RondaSBT address:", penaltyTokenAddress);
        console2.log("Factory Implementation:", address(implementation));
        console2.log("Factory Proxy:", address(proxy));
        console2.log("Use this address for RondaFactory:", address(factory));
        console2.log("=============================================================");
    }
} 