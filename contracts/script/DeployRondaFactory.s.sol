// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "../src/RondaSBT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployRondaFactory is Script {
    RondaFactory public factory;
    RondaFactory public implementation;
    RondaSBT public penaltyToken;

    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSBT first
        penaltyToken = new RondaSBT();
        console2.log("RondaSBT deployed at:", address(penaltyToken));
        
        // Wait for 5 seconds
        vm.sleep(5 seconds);

        // Deploy the implementation contract
        implementation = new RondaFactory();
        console2.log("RondaFactory implementation deployed at:", address(implementation));
        
        // Wait for 5 seconds
        vm.sleep(5 seconds);

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            address(penaltyToken)
        );

        // Deploy the proxy pointing to the implementation
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console2.log("RondaFactory proxy deployed at:", address(proxy));
        
        // Wait for 5 seconds
        vm.sleep(5 seconds);

        // Get the factory instance through the proxy
        factory = RondaFactory(address(proxy));

        // Transfer ownership of penalty token to factory
        penaltyToken.transferOwnership(address(factory));

        vm.stopBroadcast();

        console2.log("Use this address for RondaFactory:", address(factory));
    }
}
