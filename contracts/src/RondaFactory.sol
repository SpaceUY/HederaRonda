// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ronda} from "./Ronda.sol";
import {RondaSBT} from "./RondaSBT.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

contract RondaFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Events
    event RondaCreated(
        address indexed rondaAddress,
        uint256 participantCount,
        uint256 milestoneCount,
        uint256 monthlyDeposit,
        uint256 entryFee,
        address paymentToken,
        address penaltyToken
    );

    // State variables
    address public vrfCoordinator;
    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    RondaSBT public penaltyToken;
    address public router;

    address[] public rondaInstances;

    mapping(address => bool) public createdRondas;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        address _penaltyToken,
        address _router
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        vrfCoordinator = _vrfCoordinator;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        penaltyToken = RondaSBT(_penaltyToken);
        router = _router;
    }

    function createRonda(
        uint256 _participantCount,
        uint256 _milestoneCount,
        uint256 _monthlyDeposit,
        uint256 _entryFee,
        int256[] memory _interestDistribution,
        address _paymentToken
    ) external returns (address) {
        Ronda newRonda = new Ronda(
            _participantCount,
            _milestoneCount,
            _monthlyDeposit,
            _entryFee,
            _interestDistribution,
            _paymentToken,
            address(penaltyToken),
            router,
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit
        );

        rondaInstances.push(address(newRonda));

        IVRFCoordinatorV2Plus(vrfCoordinator).addConsumer(
            subscriptionId,
            address(newRonda)
        );

        emit RondaCreated(
            address(newRonda),
            _participantCount,
            _milestoneCount,
            _monthlyDeposit,
            _entryFee,
            _paymentToken,
            address(penaltyToken)
        );

        penaltyToken.addToWhitelist(address(newRonda));

        createdRondas[address(newRonda)] = true;

        return address(newRonda);
    }

    function getRondaCount() external view returns (uint256) {
        return rondaInstances.length;
    }

    function getRondaInstances() external view returns (address[] memory) {
        return rondaInstances;
    }

    function deliverRonda(
        uint256 rondaId,
        uint256 milestone
    ) external onlyOwner {
        require(rondaId < rondaInstances.length, "Invalid ronda ID");
        Ronda(rondaInstances[rondaId]).deliverRonda(milestone);
    }

    // VRF V2.5 subscription management functions
    function acceptSubscriptionOwnership() external onlyOwner {
        IVRFCoordinatorV2Plus(vrfCoordinator).acceptSubscriptionOwnerTransfer(
            subscriptionId
        );
    }

    function requestSubscriptionOwnerTransfer(
        address newOwner
    ) external onlyOwner {
        IVRFCoordinatorV2Plus(vrfCoordinator).requestSubscriptionOwnerTransfer(
            subscriptionId,
            newOwner
        );
    }

    function mintPenalty(address _participant) external onlyOwner {
        penaltyToken.mintPenalty(_participant);
    }

    function removePenalty(address _participant) external onlyOwner {
        penaltyToken.burnPenalty(_participant);
    }

    function setPenaltyToken(address _penaltyToken) external onlyOwner {
        penaltyToken = RondaSBT(_penaltyToken);
    }

    function setVrfCoordinator(address _vrfCoordinator) external onlyOwner {
        vrfCoordinator = _vrfCoordinator;
    }

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = uint64(_subscriptionId);
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
    }

    // CCIP management functions
    function addSupportedChain(
        uint256 rondaId,
        uint64 chainSelector,
        address senderContract
    ) external onlyOwner {
        Ronda(rondaInstances[rondaId]).addSupportedChain(
            chainSelector,
            senderContract
        );
    }

    function removeSupportedChain(
        uint256 rondaId,
        uint64 chainSelector
    ) external onlyOwner {
        Ronda(rondaInstances[rondaId]).removeSupportedChain(chainSelector);
    }

    // Required by UUPSUpgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
