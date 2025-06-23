// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {RondaSBT} from "../src/RondaSBT.sol";
import {Ronda} from "../src/Ronda.sol";
import {MockVRFCoordinator} from "./mocks/MockVrfCoordinator.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CCIPChainManagementTest is Test {
    RondaFactory public factory;
    RondaFactory public factoryImplementation;
    ERC1967Proxy public proxy;
    RondaSBT public penaltyToken;
    MockERC20 public paymentToken;
    MockVRFCoordinator public mockVRFCoordinator;
    
    address public owner = address(0x123);
    address public user = address(0x456);
    
    // CCIP parameters
    uint64 public chainSelector = 14767482510784806043; // Avalanche Fuji
    address public senderContract = address(0x789);
    
    // VRF parameters
    uint256 public subscriptionId = 1;
    bytes32 public keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public callbackGasLimit = 40000;
    address public router = address(0x999);

    function setUp() public {
        // Deploy mock contracts
        mockVRFCoordinator = new MockVRFCoordinator();
        penaltyToken = new RondaSBT();
        paymentToken = new MockERC20();
        
        // Create subscription
        subscriptionId = mockVRFCoordinator.createSubscription();
        
        // Deploy factory
        factoryImplementation = new RondaFactory();
        
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            address(mockVRFCoordinator),
            subscriptionId,
            keyHash,
            callbackGasLimit,
            address(penaltyToken),
            router
        );
        
        proxy = new ERC1967Proxy(
            address(factoryImplementation),
            initData
        );
        
        factory = RondaFactory(address(proxy));
        
        // Transfer ownership to test owner
        factory.transferOwnership(owner);
        
        // Add factory to whitelist and transfer ownership
        penaltyToken.addToWhitelist(address(factory));
        penaltyToken.transferOwnership(address(factory));
        
        vm.startPrank(owner);
    }

    function test_AddSupportedChainToRonda() public {
        // Create a Ronda instance first
        uint256 participantCount = 5;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1000;
        uint256 entryFee = 100;
        int256[] memory interestDistribution = new int256[](12);
        for (uint256 i = 0; i < 12; i++) {
            interestDistribution[i] = 0;
        }
        
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );
        
        // Add supported chain to Ronda instance 0
        factory.addSupportedChain(0, chainSelector, senderContract);
        
        // Verify the chain was added
        Ronda ronda = Ronda(rondaAddress);
        assertTrue(ronda.supportedChains(chainSelector));
        assertEq(ronda.senderContracts(chainSelector), senderContract);
    }

    function test_RemoveSupportedChainFromRonda() public {
        // Create a Ronda instance first
        uint256 participantCount = 5;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1000;
        uint256 entryFee = 100;
        int256[] memory interestDistribution = new int256[](12);
        for (uint256 i = 0; i < 12; i++) {
            interestDistribution[i] = 0;
        }
        
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );
        
        // Add supported chain first
        factory.addSupportedChain(0, chainSelector, senderContract);
        
        // Verify it was added
        Ronda ronda = Ronda(rondaAddress);
        assertTrue(ronda.supportedChains(chainSelector));
        
        // Remove supported chain
        factory.removeSupportedChain(0, chainSelector);
        
        // Verify it was removed
        assertFalse(ronda.supportedChains(chainSelector));
        assertEq(ronda.senderContracts(chainSelector), address(0));
    }

    function test_RevertWhen_InvalidRondaId() public {
        // Try to add supported chain to non-existent Ronda instance
        vm.expectRevert();
        factory.addSupportedChain(0, chainSelector, senderContract);
    }

    function test_RevertWhen_RondaInstanceNotFound() public {
        // Create a Ronda instance
        uint256 participantCount = 5;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1000;
        uint256 entryFee = 100;
        int256[] memory interestDistribution = new int256[](12);
        for (uint256 i = 0; i < 12; i++) {
            interestDistribution[i] = 0;
        }
        
        factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );
        
        // Try to access a non-existent Ronda instance
        vm.expectRevert();
        factory.addSupportedChain(1, chainSelector, senderContract);
    }

    function test_RevertWhen_NotOwner() public {
        vm.stopPrank();
        vm.startPrank(user);
        
        // Try to add supported chain as non-owner
        vm.expectRevert();
        factory.addSupportedChain(0, chainSelector, senderContract);
    }

    function test_AddMultipleChainsToRonda() public {
        // Create a Ronda instance
        uint256 participantCount = 5;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1000;
        uint256 entryFee = 100;
        int256[] memory interestDistribution = new int256[](12);
        for (uint256 i = 0; i < 12; i++) {
            interestDistribution[i] = 0;
        }
        
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );
        
        // Add multiple chains
        uint64 chainSelector1 = 16015286601757825753; // Sepolia
        uint64 chainSelector2 = 12532609583862916517; // Mumbai
        address senderContract1 = address(0x111);
        address senderContract2 = address(0x222);
        
        factory.addSupportedChain(0, chainSelector1, senderContract1);
        factory.addSupportedChain(0, chainSelector2, senderContract2);
        
        // Verify both chains were added
        Ronda ronda = Ronda(rondaAddress);
        assertTrue(ronda.supportedChains(chainSelector1));
        assertTrue(ronda.supportedChains(chainSelector2));
        assertEq(ronda.senderContracts(chainSelector1), senderContract1);
        assertEq(ronda.senderContracts(chainSelector2), senderContract2);
    }

    function test_RemoveChainAndReAdd() public {
        // Create a Ronda instance
        uint256 participantCount = 5;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1000;
        uint256 entryFee = 100;
        int256[] memory interestDistribution = new int256[](12);
        for (uint256 i = 0; i < 12; i++) {
            interestDistribution[i] = 0;
        }
        
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentToken)
        );
        
        // Add chain
        factory.addSupportedChain(0, chainSelector, senderContract);
        
        // Remove chain
        factory.removeSupportedChain(0, chainSelector);
        
        // Re-add with different sender contract
        address newSenderContract = address(0x999);
        factory.addSupportedChain(0, chainSelector, newSenderContract);
        
        // Verify the new sender contract is set
        Ronda ronda = Ronda(rondaAddress);
        assertTrue(ronda.supportedChains(chainSelector));
        assertEq(ronda.senderContracts(chainSelector), newSenderContract);
    }
} 