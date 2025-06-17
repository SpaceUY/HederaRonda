// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RondaSender} from "../src/RondaSender.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {Ronda} from "../src/Ronda.sol";
import {RondaSBT} from "../src/RondaSBT.sol";
import "./mocks/MockRouter.sol";
import "./mocks/MockToken.sol";
import {Client} from "chainlink-ccip/contracts/libraries/Client.sol";

contract CrossChainRondaTest is Test {
    MockRouter public router;
    MockToken public paymentTokenSender;
    MockToken public paymentTokenReceiver;
    RondaSBT public penaltyToken;
    RondaFactory public factory;
    Ronda public ronda;
    RondaSender public sender;
    address public owner;
    address public participant;
    uint64 public sourceChainSelector = 1;
    uint64 public destinationChainSelector = 2;

    // VRF parameters
    address public vrfCoordinator = address(0x123);
    uint64 public subscriptionId = 1;
    bytes32 public keyHash = bytes32(uint256(1));
    uint32 public callbackGasLimit = 100000;

    function setUp() public {
        owner = makeAddr("owner");
        participant = makeAddr("participant");
        vm.startPrank(owner);

        // Deploy mock contracts
        router = new MockRouter();
        paymentTokenSender = new MockToken();
        paymentTokenReceiver = new MockToken();
        penaltyToken = new RondaSBT();

        // Deploy factory
        factory = new RondaFactory(
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
            address(penaltyToken),
            address(router)
        );

        // Setup penalty token
        penaltyToken.addToWhitelist(address(factory));
        penaltyToken.transferOwnership(address(factory));

        // Create Ronda instance
        uint256 participantCount = 10;
        uint256 milestoneCount = 12;
        uint256 monthlyDeposit = 1 ether;
        uint256 entryFee = 0.1 ether;

        int256[] memory interestDistribution = new int256[](milestoneCount);
        for (uint256 i = 0; i < milestoneCount; i++) {
            interestDistribution[i] = 0; // No interest for testing
        }

        address rondaAddress = factory.createRonda(
            participantCount,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            interestDistribution,
            address(paymentTokenReceiver)
        );
        ronda = Ronda(rondaAddress);

        // Deploy sender contract
        sender = new RondaSender(address(router), destinationChainSelector);

        // Setup CCIP configuration
        factory.addSupportedChain(0, sourceChainSelector, address(sender));

        // Fund participant
        paymentTokenSender.mint(participant, 1000 ether);
        vm.stopPrank();
    }

    function test_CrossChainJoin() public {
        vm.startPrank(participant);
        paymentTokenSender.approve(address(sender), 0.1 ether);

        // Calculate fee
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(ronda)),
            data: abi.encodeWithSelector(ronda.joinRonda.selector),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0), // Use native token for fees
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200000})
            )
        });
        uint256 fee = router.getFee(destinationChainSelector, message);

        // Send cross-chain join request
        vm.deal(participant, fee); // Fund participant with native token for fee
        sender.joinRonda{value: fee}(
            address(ronda),
            address(paymentTokenSender),
            0.1 ether
        );
        vm.stopPrank();

        // Verify the message was sent
        assertEq(router.lastMessageId() != bytes32(0), true);
    }

    function test_CrossChainDeposit() public {
        // First join the ronda
        vm.startPrank(participant);
        paymentTokenSender.approve(address(sender), 0.1 ether);
        Client.EVM2AnyMessage memory joinMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(address(ronda)),
            data: abi.encodeWithSelector(ronda.joinRonda.selector),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0), // Use native token for fees
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200000})
            )
        });
        uint256 joinFee = router.getFee(destinationChainSelector, joinMessage);
        vm.deal(participant, joinFee); // Fund participant with native token for fee
        sender.joinRonda{value: joinFee}(
            address(ronda),
            address(paymentTokenSender),
            0.1 ether
        );

        // Now try to deposit
        paymentTokenSender.approve(address(sender), 1 ether);
        Client.EVM2AnyMessage memory depositMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(address(ronda)),
            data: abi.encodeWithSelector(ronda.deposit.selector, 0),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0), // Use native token for fees
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200000})
            )
        });
        uint256 depositFee = router.getFee(
            destinationChainSelector,
            depositMessage
        );
        vm.deal(participant, depositFee); // Fund participant with native token for fee
        sender.deposit{value: depositFee}(
            address(ronda),
            0,
            address(paymentTokenSender),
            1 ether
        );
        vm.stopPrank();

        // Verify the message was sent
        assertEq(router.lastMessageId() != bytes32(0), true);
    }

    function test_RevertWhen_InsufficientFee() public {
        vm.startPrank(participant);
        paymentTokenSender.approve(address(sender), 0.1 ether);

        // Try to send with no fee
        vm.expectRevert("Insufficient balance");
        sender.joinRonda{value: 0}(
            address(ronda),
            address(paymentTokenSender),
            0.1 ether
        );
        vm.stopPrank();
    }

    function test_RevertWhen_NotApproved() public {
        vm.startPrank(participant);
        // Don't approve tokens

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(ronda)),
            data: abi.encodeWithSelector(ronda.joinRonda.selector),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0), // Use native token for fees
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200000})
            )
        });
        uint256 fee = router.getFee(destinationChainSelector, message);
        vm.deal(participant, fee); // Fund participant with native token for fee

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(
                    keccak256(
                        "ERC20InsufficientAllowance(address,uint256,uint256)"
                    )
                ),
                address(sender),
                0,
                0.1 ether
            )
        );
        sender.joinRonda{value: fee}(
            address(ronda),
            address(paymentTokenSender),
            0.1 ether
        );
        vm.stopPrank();
    }
}
