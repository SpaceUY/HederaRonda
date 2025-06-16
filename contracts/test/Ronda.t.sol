// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ronda.sol";
import "../src/RondaSBT.sol";
import "./MockToken.sol";
import "@chainlink/contracts/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract MockVRFCoordinator {
    uint256 public lastRequestId;
    
    function requestRandomWords(
        bytes32 /* keyHash */,
        uint64 /* subId */,
        uint16 /* minimumRequestConfirmations */,
        uint32 /* callbackGasLimit */,
        uint32 /* numWords */
    ) external returns (uint256) {
        lastRequestId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        return lastRequestId;
    }
}

contract RondaTest is Test {
    Ronda public ronda;
    MockToken public token;
    RondaSBT public penaltyToken;
    MockVRFCoordinator public mockVRFCoordinator;
    address owner = address(this);
    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);

    uint256 participantCount = 3;
    uint256 milestoneCount = 3;
    uint256 monthlyDeposit = 100 ether;
    uint256 entryFee = 10 ether;
    int256[] interestDistribution;
    uint256 totalNeeded; // Total tokens needed per participant

    uint64 subscriptionId = 1;
    bytes32 keyHash = bytes32(uint256(1));
    uint32 callbackGasLimit = 100000;
    uint256 lastRequestId;

    function setUp() public {
        token = new MockToken();
        penaltyToken = new RondaSBT();
        mockVRFCoordinator = new MockVRFCoordinator();
        
        // Create interest distribution that sums to 0
        interestDistribution = new int256[](milestoneCount);
        interestDistribution[0] = 5;  // +5%
        interestDistribution[1] = -2; // -2%
        interestDistribution[2] = -3; // -3%

        ronda = new Ronda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(token),
            address(penaltyToken),
            address(mockVRFCoordinator),
            subscriptionId,
            keyHash,
            callbackGasLimit
        );

        // Add Ronda contract to whitelist
        penaltyToken.addToWhitelist(address(ronda));

        // Calculate total tokens needed per participant
        // Each participant needs: (monthlyDeposit * milestoneCount) + entryFee + extra for interest
        totalNeeded = (monthlyDeposit * milestoneCount) + entryFee + (monthlyDeposit * 2); // Extra for interest
        
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

        // Mock VRF response
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123; // Some random number
        
        // Call fulfillRandomWords with the captured request ID
        vm.prank(address(mockVRFCoordinator));
        ronda.rawFulfillRandomWords(lastRequestId, randomWords);
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
        assertEq(uint(ronda.currentState()), uint(Ronda.RondaState.Randomizing));
    }

    function testDepositAndDeliver() public {
        _setupParticipantsAndVRF();

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
        uint256 interestAmount = (baseAmount * uint256(interestDistribution[0])) / 100;
        uint256 expectedAmount = baseAmount + interestAmount;

        // Check the balance of the participant who got slot 0
        address slot0Participant = ronda.slotToParticipant(0);
        uint256 expectedBalance = totalNeeded - entryFee - monthlyDeposit + expectedAmount;
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
        new Ronda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            invalidDistribution,
            address(token),
            address(penaltyToken),
            address(mockVRFCoordinator),
            subscriptionId,
            keyHash,
            callbackGasLimit
        );
    }

    function testAbortRonda() public {
        ronda.abortRonda();
        assertEq(uint(ronda.currentState()), uint(Ronda.RondaState.Aborted));
    }

    function testPenaltyIssuance() public {
        _setupParticipantsAndVRF();

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

        // Only alice and bob deposit for milestone 0
        vm.prank(alice);
        ronda.deposit(0);
        vm.prank(bob);
        ronda.deposit(0);

        // Deliver milestone 0
        ronda.deliverRonda(0);

        // Verify carol has a penalty token
        assertTrue(penaltyToken.hasPenalty(carol));

        // Remove penalty
        ronda.removePenalty(carol);

        // Verify penalty is removed
        assertFalse(penaltyToken.hasPenalty(carol));
    }

    function testNonTransferablePenalty() public {
        _setupParticipantsAndVRF();

        // Only alice and bob deposit for milestone 0
        vm.prank(alice);
        ronda.deposit(0);
        vm.prank(bob);
        ronda.deposit(0);

        // Deliver milestone 0
        ronda.deliverRonda(0);

        // Try to transfer penalty token (should fail)
        vm.prank(carol);
        vm.expectRevert("Token is non-transferable");
        penaltyToken.transferFrom(carol, alice, 0);
    }

    function testWhitelistManagement() public {
        address newRonda = address(0x5);
        
        // Test adding to whitelist
        penaltyToken.addToWhitelist(newRonda);
        assertTrue(penaltyToken.whitelistedRondas(newRonda));
        
        // Test removing from whitelist
        penaltyToken.removeFromWhitelist(newRonda);
        assertFalse(penaltyToken.whitelistedRondas(newRonda));
        
        // Test adding invalid address
        vm.expectRevert("Invalid address");
        penaltyToken.addToWhitelist(address(0));
        
        // Test adding already whitelisted address
        penaltyToken.addToWhitelist(newRonda);
        vm.expectRevert("Already whitelisted");
        penaltyToken.addToWhitelist(newRonda);
        
        // Test removing non-whitelisted address
        penaltyToken.removeFromWhitelist(newRonda);
        vm.expectRevert("Not whitelisted");
        penaltyToken.removeFromWhitelist(newRonda);
    }

    function testNonWhitelistedMint() public {
        // Create a new RondaSBT instance without whitelisting
        RondaSBT newPenaltyToken = new RondaSBT();
        
        // Try to mint a penalty token without being whitelisted
        vm.expectRevert("Caller is not whitelisted");
        newPenaltyToken.mintPenalty(alice);
    }

    function testNonWhitelistedBurn() public {
        // Create a new Ronda contract that's not whitelisted
        Ronda newRonda = new Ronda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(token),
            address(penaltyToken),
            address(mockVRFCoordinator),
            subscriptionId,
            keyHash,
            callbackGasLimit
        );

        // Try to burn penalty token (should fail)
        vm.expectRevert("Caller is not whitelisted");
        newRonda.removePenalty(alice);
    }
} 