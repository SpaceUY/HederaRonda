// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {Ronda} from "../src/Ronda.sol";
import {RondaSBT} from "../src/RondaSBT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MockVRFCoordinator} from "./mocks/MockVrfCoordinator.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000 ether);
    }
}

contract RondaFactoryTest is Test {
    address public owner;
    RondaFactory public factory;
    RondaFactory public factoryImplementation;
    ERC1967Proxy public proxy;
    RondaSBT public penaltyToken;
    MockERC20 public paymentToken;
    MockVRFCoordinator public mockVRFCoordinator;
    uint256 public subscriptionId = 1;
    bytes32 public keyHash = bytes32(uint256(1));
    uint32 public callbackGasLimit = 100000;
    address public router = address(0x456);

    function setUp() public {
        penaltyToken = new RondaSBT();
        paymentToken = new MockERC20();
        mockVRFCoordinator = new MockVRFCoordinator();
        
        // Create a subscription for the factory
        subscriptionId = mockVRFCoordinator.createSubscription();
        
        // Deploy the implementation contract
        factoryImplementation = new RondaFactory();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            mockVRFCoordinator,
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

        penaltyToken.addToWhitelist(address(factory));
        penaltyToken.transferOwnership(address(factory));
    }

    function test_DeployFactory() public view {
        assertEq(factory.vrfCoordinator(), address(mockVRFCoordinator));
        assertEq(factory.subscriptionId(), subscriptionId);
        assertEq(factory.keyHash(), keyHash);
        assertEq(factory.callbackGasLimit(), callbackGasLimit);
        assertEq(address(factory.penaltyToken()), address(penaltyToken));
        assertEq(factory.router(), router);
    }

    function test_CreateRonda() public {
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5; // +5%
        interestDistribution[1] = -2; // -2%
        interestDistribution[2] = -3; // -3%

        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        assertTrue(rondaAddress != address(0));
        assertEq(factory.getRondaCount(), 1);
        assertEq(factory.rondaInstances(0), rondaAddress);

        Ronda ronda = Ronda(rondaAddress);
        assertEq(ronda.participantCount(), participantCount);
        assertEq(ronda.milestoneCount(), milestoneCount);
        assertEq(ronda.monthlyDeposit(), monthlyDeposit);
        assertEq(ronda.entryFee(), entryFee);
        assertEq(ronda.factory(), address(factory));
    }

    function test_CreateMultipleRondas() public {
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        // Create first Ronda
        address ronda1 = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        // Create second Ronda
        address ronda2 = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        assertEq(factory.getRondaCount(), 2);
        assertEq(factory.rondaInstances(0), ronda1);
        assertEq(factory.rondaInstances(1), ronda2);
        assertTrue(ronda1 != ronda2);
    }

    function test_AnyoneCanCreateRonda() public {
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        // Try to create Ronda as non-owner
        vm.prank(address(0x123));
        address ronda = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        assertEq(factory.getRondaCount(), 1);
        assertEq(factory.rondaInstances(0), address(ronda));
    }

    function test_RondaOwnerIsFactory() public {
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        Ronda ronda = Ronda(rondaAddress);
        assertEq(ronda.owner(), address(factory));
    }

    function test_RondaSBTOwnerIsFactory() public view {
        assertEq(penaltyToken.owner(), address(factory));
    }

    function test_FactoryCanBurnRondaSBT() public {
        // Create a Ronda instance
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        // Mint a penalty token to a participant
        address participant = address(0x123);
        factory.mintPenalty(participant);
        assertEq(penaltyToken.balanceOf(participant), 1);

        // Factory should be able to burn the token
        factory.removePenalty(participant);
        assertEq(penaltyToken.balanceOf(participant), 0);
    }

    function test_OnlyFactoryCanBurnRondaSBT() public {
        // Create a Ronda instance
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        // Mint a penalty token to a participant
        address participant = address(0x123);
        factory.mintPenalty(participant);
        assertEq(penaltyToken.balanceOf(participant), 1);

        // Non-factory address should not be able to burn the token
        vm.prank(address(0x456));
        vm.expectRevert();
        penaltyToken.burnPenalty(participant);
    }

    function test_CCIPManagement() public {
        // Create a Ronda instance
        uint256 participantCount = 3;
        uint256 milestoneCount = 3;
        uint256 monthlyDeposit = 100 ether;
        uint256 entryFee = 10 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;
        interestDistribution[1] = -2;
        interestDistribution[2] = -3;

        factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        // Test adding supported chain
        uint64 chainSelector = 1;
        address senderContract = address(0x789);
        factory.addSupportedChain(0, chainSelector, senderContract);

        // Test removing supported chain
        factory.removeSupportedChain(0, chainSelector);

        // Test non-owner cannot manage CCIP
        vm.prank(address(0x123));
        vm.expectRevert();
        factory.addSupportedChain(0, chainSelector, senderContract);
    }

    function test_AddDefaultSupportedChain() public {
        uint64 chainSelector = 12345;
        address senderContract = address(0x123);

        vm.expectEmit(true, true, false, true);
        emit RondaFactory.DefaultSupportedChainAdded(chainSelector, senderContract);
        
        factory.addDefaultSupportedChain(chainSelector, senderContract);

        assertTrue(factory.isDefaultSupportedChain(chainSelector));
        
        RondaFactory.DefaultSupportedChain memory chain = factory.getDefaultSupportedChain(chainSelector);
        assertEq(chain.chainSelector, chainSelector);
        assertEq(chain.senderContract, senderContract);
        assertEq(factory.getDefaultSupportedChainsCount(), 1);
    }

    function test_UpdateDefaultSupportedChain() public {
        uint64 chainSelector = 12345;
        address oldSenderContract = address(0x123);
        address newSenderContract = address(0x456);

        // Add initial chain
        factory.addDefaultSupportedChain(chainSelector, oldSenderContract);

        vm.expectEmit(true, true, true, true);
        emit RondaFactory.DefaultSupportedChainUpdated(chainSelector, oldSenderContract, newSenderContract);
        
        // Update the same chain
        factory.addDefaultSupportedChain(chainSelector, newSenderContract);

        RondaFactory.DefaultSupportedChain memory chain = factory.getDefaultSupportedChain(chainSelector);
        assertEq(chain.senderContract, newSenderContract);
        assertEq(factory.getDefaultSupportedChainsCount(), 1); // Should still be 1
    }

    function test_RemoveDefaultSupportedChain() public {
        uint64 chainSelector = 12345;
        address senderContract = address(0x123);

        // Add chain first
        factory.addDefaultSupportedChain(chainSelector, senderContract);
        assertTrue(factory.isDefaultSupportedChain(chainSelector));

        vm.expectEmit(true, false, false, true);
        emit RondaFactory.DefaultSupportedChainRemoved(chainSelector);
        
        // Remove chain
        factory.removeDefaultSupportedChain(chainSelector);

        assertFalse(factory.isDefaultSupportedChain(chainSelector));
        assertEq(factory.getDefaultSupportedChainsCount(), 0);
    }

    function test_CreateRondaWithDefaultSupportedChains() public {
        // Set up default supported chains
        uint64 chainSelector1 = 12345;
        address senderContract1 = address(0x123);
        uint64 chainSelector2 = 67890;
        address senderContract2 = address(0x456);

        factory.addDefaultSupportedChain(chainSelector1, senderContract1);
        factory.addDefaultSupportedChain(chainSelector2, senderContract2);

        // Create a new Ronda
        uint256 participantCount = 5;
        uint256 milestoneCount = 5;
        uint256 monthlyDeposit = 100;
        uint256 entryFee = 10;
        int256[] memory interestDistribution = new int256[](5);
        interestDistribution[0] = -10;
        interestDistribution[1] = -5;
        interestDistribution[2] = 0;
        interestDistribution[3] = 5;
        interestDistribution[4] = 10;

        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );

        // Verify that the new Ronda has the default supported chains
        Ronda ronda = Ronda(rondaAddress);
        assertTrue(ronda.supportedChains(chainSelector1));
        assertTrue(ronda.supportedChains(chainSelector2));
        assertEq(ronda.senderContracts(chainSelector1), senderContract1);
        assertEq(ronda.senderContracts(chainSelector2), senderContract2);
    }

    function test_GetAllDefaultSupportedChains() public {
        // Add multiple chains
        uint64[] memory chainSelectors = new uint64[](3);
        address[] memory senderContracts = new address[](3);
        
        chainSelectors[0] = 12345;
        senderContracts[0] = address(0x123);
        chainSelectors[1] = 67890;
        senderContracts[1] = address(0x456);
        chainSelectors[2] = 11111;
        senderContracts[2] = address(0x789);

        for (uint256 i = 0; i < chainSelectors.length; i++) {
            factory.addDefaultSupportedChain(chainSelectors[i], senderContracts[i]);
        }

        // Get all chains
        RondaFactory.DefaultSupportedChain[] memory chains = factory.getDefaultSupportedChains();
        assertEq(chains.length, 3);

        // Verify all chains are correct
        for (uint256 i = 0; i < chains.length; i++) {
            assertTrue(factory.isDefaultSupportedChain(chains[i].chainSelector));
        }
    }

    function test_RevertOnInvalidSenderContract() public {
        uint64 chainSelector = 12345;
        address invalidSenderContract = address(0);

        vm.expectRevert("Invalid sender contract");
        factory.addDefaultSupportedChain(chainSelector, invalidSenderContract);
    }

    function test_RevertOnRemoveNonExistentChain() public {
        uint64 chainSelector = 99999; // Non-existent chain

        vm.expectRevert("Chain not supported");
        factory.removeDefaultSupportedChain(chainSelector);
    }

    function test_RevertOnGetNonExistentChain() public {
        uint64 chainSelector = 99999; // Non-existent chain

        vm.expectRevert("Chain not supported");
        factory.getDefaultSupportedChain(chainSelector);
    }
}
