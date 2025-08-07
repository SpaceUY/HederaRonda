// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RondaFactory} from "../src/RondaFactory.sol";
import {Ronda} from "../src/Ronda.sol";
import {RondaSBT} from "../src/RondaSBT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";


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
    address public router = address(0x456);

    function setUp() public {
        penaltyToken = new RondaSBT();
        paymentToken = new MockERC20();
        
        // Deploy the implementation contract
        factoryImplementation = new RondaFactory();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RondaFactory.initialize.selector,
            address(penaltyToken)
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
        // Test basic factory setup
        assertEq(address(factory.penaltyToken()), address(penaltyToken));
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




}
