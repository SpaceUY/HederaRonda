// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DeployRondaInstance is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("RONDA_FACTORY_ADDRESS");
        address paymentTokenAddress = vm.envAddress("PAYMENT_TOKEN_ADDRESS");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get factory instance
        RondaFactory factory = RondaFactory(factoryAddress);

        // Ronda parameters
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 0.0001 ether;
        uint256 entryFee = 0.0001 ether;

        // Create interest distribution that sums to 0
        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5; // +5%
        interestDistribution[1] = -2; // -2%
        interestDistribution[2] = -3; // -3%

        // Create new Ronda instance
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            paymentTokenAddress
        );

        vm.stopBroadcast();

        // Log the deployed address
        console2.log("Ronda instance deployed at:", rondaAddress);
    }
}
