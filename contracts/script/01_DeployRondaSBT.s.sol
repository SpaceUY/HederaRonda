// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaSBT.sol";

contract DeployRondaSBT is Script {
    RondaSBT public penaltyToken;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSBT
        penaltyToken = new RondaSBT();

        vm.stopBroadcast();

        console2.log("=============================================================");
        console2.log("RondaSBT deployed at:", address(penaltyToken));
        console2.log("=============================================================");
        console2.log("Copy this address for the next deployment step!");
        console2.log("=============================================================");
    }
} 