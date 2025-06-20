// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Ronda} from "../src/Ronda.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {RondaSBT} from "../src/RondaSBT.sol";
import {MockToken} from "./mocks/MockToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MockVRFCoordinator} from "./mocks/MockVrfCoordination.sol";

contract RondaTest is Test {
    Ronda public ronda;
    RondaFactory public factory;
    RondaFactory public factoryImplementation;
    ERC1967Proxy public proxy;
    MockToken public token;
    RondaSBT public penaltyToken;
    MockVRFCoordinator public mockVRFCoordinator;
    address owner = address(this);
    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);
    address router = address(0x456);

    uint256 participantCount = 3;
    uint256 milestoneCount = 3;
    uint256 monthlyDeposit = 100 ether;
    uint256 entryFee = 10 ether;
    int256[] interestDistribution;
    uint256 totalNeeded; // Total tokens needed per participant

    // VRF parameters
    address public vrfCoordinator = address(0x123);
    uint64 public subscriptionId = 1;
    bytes32 public keyHash = bytes32(uint256(1));
    uint32 public callbackGasLimit = 100000;

    uint256 lastRequestId;

    function setUp() public {
        token = new MockToken();
        penaltyToken = new RondaSBT();
        mockVRFCoordinator = new MockVRFCoordinator();

        // Deploy the factory implementation
        factoryImplementation = new RondaFactory();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            address(mockVRFCoordinator),
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
        factory = RondaFactory(address(proxy));
        penaltyToken.addToWhitelist(address(factory));
        penaltyToken.transferOwnership(address(factory));

        // Create interest distribution that sums to 0
        interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5; // +5%
        interestDistribution[1] = -2; // -2%
        interestDistribution[2] = -3; // -3%

        // Create Ronda through factory
        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(token)
        );
        ronda = Ronda(rondaAddress);

        // Calculate total tokens needed per participant
        // Each participant needs: (monthlyDeposit * milestoneCount) + entryFee + extra for interest
        totalNeeded =
            (monthlyDeposit * milestoneCount) +
            entryFee +
            (monthlyDeposit * 2); // Extra for interest

        // Fund participants
        token.mint(alice, totalNeeded);
        token.mint(bob, totalNeeded);
        token.mint(carol, totalNeeded);

        // Approve Ronda contract
        vm.prank(alice);
        token.approve(address(ronda), type(uint256).max);
        vm.prank(bob);
        token.approve(address(ronda), type(uint256).max);
        vm.prank(carol);
        token.approve(address(ronda), type(uint256).max);
    }

    // Helper function to setup participants and handle VRF
    function _setupParticipantsAndVRF() internal {
        // Join all participants
        vm.prank(alice);
        ronda.joinRonda();
        vm.prank(bob);
        ronda.joinRonda();
        vm.prank(carol);
        ronda.joinRonda();

        // Get the request ID from the mock coordinator
        lastRequestId = mockVRFCoordinator.lastRequestId();
    }

    function _mockVRFResponse() internal {
        // Mock VRF response by calling the factory's fulfillRandomWords
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123; // Some random number

        // Call fulfillRandomWords on the factory
        vm.prank(address(mockVRFCoordinator));
        factory.rawFulfillRandomWords(lastRequestId, randomWords);
    }

    function testJoinRonda() public {
        vm.prank(alice);
        ronda.joinRonda();
        bool hasJoinedAlice = ronda.hasParticipantJoined(alice);
        assertTrue(hasJoinedAlice);
        vm.prank(bob);
        ronda.joinRonda();
        bool hasJoinedBob = ronda.hasParticipantJoined(bob);
        assertTrue(hasJoinedBob);
        vm.prank(carol);
        ronda.joinRonda();
        bool hasJoinedCarol = ronda.hasParticipantJoined(carol);
        assertTrue(hasJoinedCarol);
        assertEq(
            uint(ronda.currentState()),
            uint(Ronda.RondaState.Randomizing)
        );
    }

    function testDepositAndDeliver() public {
        _setupParticipantsAndVRF();
        _mockVRFResponse();

        // All deposit for milestone 0
        vm.prank(alice);
        ronda.deposit(0);
        vm.prank(bob);
        ronda.deposit(0);
        vm.prank(carol);
        ronda.deposit(0);

        // Deliver milestone 0
        ronda.deliverRonda(0);

        // Calculate expected amount with +5% interest
        uint256 baseAmount = monthlyDeposit * participantCount;
        uint256 interestAmount = (baseAmount *
            uint256(interestDistribution[0])) / 100;
        uint256 expectedAmount = baseAmount + interestAmount;

        // Check the balance of the participant who got slot 0
        address slot0Participant = ronda.slotToParticipant(0);
        uint256 expectedBalance = totalNeeded -
            entryFee -
            monthlyDeposit +
            expectedAmount;
        assertEq(token.balanceOf(slot0Participant), expectedBalance);
    }

    function testInterestDistributionSum() public view {
        // Test that interest distribution sums to 0
        int256 sum = 0;
        for (uint256 i = 0; i < interestDistribution.length; i++) {
            sum += interestDistribution[i];
        }
        assertEq(sum, 0);
    }

    function testInvalidInterestDistribution() public {
        // Create invalid interest distribution that doesn't sum to 0
        int256[] memory invalidDistribution = new int256[](milestoneCount);
        invalidDistribution[0] = 5;
        invalidDistribution[1] = 5;
        invalidDistribution[2] = 5;

        // Should revert when creating ronda with invalid distribution
        vm.expectRevert("Sum of interest distribution must equal 0");
        factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            invalidDistribution,
            address(token)
        );
    }

    function testAbortRonda() public {
        ronda.abortRonda();
        assertEq(uint(ronda.currentState()), uint(Ronda.RondaState.Aborted));
    }

    function testPenaltyIssuance() public {
        _setupParticipantsAndVRF();
        _mockVRFResponse();

        // Only alice and bob deposit for milestone 0
        vm.prank(alice);
        ronda.deposit(0);
        vm.prank(bob);
        ronda.deposit(0);

        // Deliver milestone 0
        ronda.deliverRonda(0);

        // Verify carol has a penalty token
        assertTrue(penaltyToken.hasPenalty(carol));
        assertFalse(penaltyToken.hasPenalty(alice));
        assertFalse(penaltyToken.hasPenalty(bob));
    }

    function testPenaltyRemoval() public {
        _setupParticipantsAndVRF();
        _mockVRFResponse();

        // Only alice and bob deposit for milestone 0 (carol will get penalty)
        vm.prank(alice);
        ronda.deposit(0);
        vm.prank(bob);
        ronda.deposit(0);

        // Deliver milestone 0
        ronda.deliverRonda(0);

        // Verify carol has a penalty token
        assertTrue(penaltyToken.hasPenalty(carol));

        // Remove penalty from carol
        vm.prank(address(factory));
        ronda.removePenalty(carol);
        assertFalse(penaltyToken.hasPenalty(carol));
    }

    function testNonTransferablePenalty() public {
        _setupParticipantsAndVRF();
        // Try to transfer penalty token (should revert)
        address slot0Participant = ronda.slotToParticipant(0);
        vm.expectRevert("Token is non-transferable");
        vm.prank(slot0Participant);
        penaltyToken.transferFrom(slot0Participant, address(0xdead), 0);
    }

    function testWhitelistManagement() public {
        // Only the factory (proxy) can add to whitelist
        vm.prank(address(factory));
        penaltyToken.addToWhitelist(address(0x5));
        assertTrue(penaltyToken.whitelistedRondas(address(0x5)));
        vm.prank(address(factory));
        penaltyToken.removeFromWhitelist(address(0x5));
        assertFalse(penaltyToken.whitelistedRondas(address(0x5)));
    }

    function testNonWhitelistedMint() public {
        // Create a new RondaSBT instance without whitelisting
        RondaSBT newPenaltyToken = new RondaSBT();

        // Try to mint a penalty token without being whitelisted
        vm.expectRevert("Caller is not whitelisted");
        newPenaltyToken.mintPenalty(alice);
    }

    function testNonWhitelistedBurn() public {
        // Try to burn penalty from non-whitelisted address
        address notWhitelisted = address(0x7);
        vm.expectRevert("Caller is not whitelisted");
        penaltyToken.burnPenalty(notWhitelisted);
    }

    function testFactoryOwnership() public view {
        assertEq(ronda.factory(), address(factory));
        assertEq(ronda.owner(), address(owner));
    }

    function testReceiveRandomnessFromFactory() public {
        _setupParticipantsAndVRF();
        _mockVRFResponse();
        // This test is just to ensure the randomness flow works and doesn't revert
    }

    function testReceiveRandomnessOnlyFromFactory() public {
        _setupParticipantsAndVRF();
        // Try to call receiveRandomness from a non-factory address
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123;
        vm.prank(address(0x123));
        vm.expectRevert("Only factory or owner can call this function");
        ronda.receiveRandomness(1, randomWords);

        _mockVRFResponse();

        vm.expectRevert("Ronda must be in randomizing state");
        ronda.receiveRandomness(1, randomWords);
    }
}
