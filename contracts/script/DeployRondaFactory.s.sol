// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RondaFactory.sol";
import "../src/RondaSBT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployRondaFactory is Script {
    address public owner;
    RondaFactory public factory;
    RondaFactory public factoryImplementation;
    ERC1967Proxy public proxy;
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
        uint64 chainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        address senderContract = vm.envAddress("SENDER_CONTRACT_ADDRESS");

        // Start broadcasting transactions
        vm.createSelectFork("sepolia");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy RondaSBT first
        penaltyToken = new RondaSBT();

        // Deploy the implementation contract
        factoryImplementation = new RondaFactory();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            address(penaltyToken),
            router
        );

        // Deploy the proxy contract
        proxy = new ERC1967Proxy(
            address(factoryImplementation),
            initData
        );

        // Get the factory instance through the proxy
        factory = RondaFactory(address(proxy));
        owner = factory.owner();

        // Add the factory to the whitelist
        penaltyToken.addToWhitelist(address(factory));

        // Transfer RondaSBT ownership to the factory
        penaltyToken.transferOwnership(address(factory));

        // Add default supported chains
        factory.addDefaultSupportedChain(chainSelector, senderContract);

        vm.stopBroadcast();

        // Log the deployed addresses
        console2.log("RondaSBT deployed at:", address(penaltyToken));
        console2.log("RondaFactory implementation deployed at:", address(factoryImplementation));
        console2.log("RondaFactory proxy deployed at:", address(proxy));
        console2.log("RondaFactory (proxy address) deployed at:", address(factory));
        console2.log("RondaSBT owner:", penaltyToken.owner());
    }
}
