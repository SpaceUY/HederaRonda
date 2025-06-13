// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ronda.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MTK") {
        _mint(msg.sender, 1_000_000 ether);
    }
}

contract RondaTest is Test {
    Ronda public ronda;
    MockToken public token;
    address owner = address(this);
    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);

    uint256 participantCount = 3;
    uint256 milestoneCount = 3;
    uint256 monthlyDeposit = 100 ether;
    uint256 entryFee = 10 ether;
    int256[] interestDistribution;

    // Mock VRF Coordinator
    address vrfCoordinator = address(0x4);
    uint64 subscriptionId = 1;
    bytes32 keyHash = bytes32(uint256(1));
    uint32 callbackGasLimit = 100000;
    uint256 mockRequestId = 123; // Mock request ID

    function setUp() public {
        token = new MockToken();
        
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
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit
        );

        // Mock the VRF request ID for all tests
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(VRFCoordinatorV2Interface.requestRandomWords.selector),
            abi.encode(mockRequestId)
        );

        // Fund participants
        token.transfer(alice, 500 ether);
        token.transfer(bob, 500 ether);
        token.transfer(carol, 500 ether);
        
        // Approve Ronda contract
        vm.prank(alice);
        token.approve(address(ronda), 1000 ether);
        vm.prank(bob);
        token.approve(address(ronda), 1000 ether);
        vm.prank(carol);
        token.approve(address(ronda), 1000 ether);
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
        // Join all participants
        vm.prank(alice);
        ronda.joinRonda();
        vm.prank(bob);
        ronda.joinRonda();
        vm.prank(carol);
        ronda.joinRonda();

        // Mock VRF response
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123; // Some random number
        
        // Call fulfillRandomWords directly on the contract
        vm.prank(address(vrfCoordinator));
        ronda.rawFulfillRandomWords(mockRequestId, randomWords);

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
        assertEq(token.balanceOf(slot0Participant), 500 ether - entryFee - monthlyDeposit + expectedAmount);
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
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit
        );
    }

    function testAbortRonda() public {
        ronda.abortRonda();
        assertEq(uint(ronda.currentState()), uint(Ronda.RondaState.Aborted));
    }
} 