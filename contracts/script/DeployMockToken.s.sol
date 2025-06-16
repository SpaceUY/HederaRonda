// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../test/MockToken.sol";

contract DeployMockToken is Script {
    MockToken public token;

    function setUp() public {}

    function run() public {
        // Load environment variables or use defaults for local testing
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockToken
        token = new MockToken();

        vm.stopBroadcast();

        // Log the deployed address
        console2.log("MockToken deployed at:", address(token));
    }
} 