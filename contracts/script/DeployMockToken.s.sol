// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../test/mocks/MockToken.sol";

contract DeployMockToken is Script {
    MockToken public token;

    function setUp() public {}

    function run() public {
        // Load environment variables or use defaults for local testing
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockToken
        token = new MockToken();

        vm.stopBroadcast();

        // Log the deployed address
        console2.log("MockToken deployed at:", address(token));
    }
}
