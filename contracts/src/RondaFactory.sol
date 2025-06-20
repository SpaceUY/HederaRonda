// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ronda} from "./Ronda.sol";
import {RondaSBT} from "./RondaSBT.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {VRFConsumerBaseV2Upgradeable} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Upgradeable.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract RondaFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable, VRFConsumerBaseV2Upgradeable {
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

    event RandomnessRequested(
        address indexed rondaAddress,
        uint256 requestId
    );

    event RandomnessFulfilled(
        address indexed rondaAddress,
        uint256 requestId,
        uint256[] randomWords
    );

    // State variables (changed from immutable to storage)
    address public vrfCoordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    RondaSBT public penaltyToken;
    address public router;

    // VRF constants
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Array to track all created Ronda instances
    address[] public rondaInstances;

    // Mapping to track VRF requests
    mapping(uint256 => address) public vrfRequestToRonda;

    // Mapping to track created Rondas
    mapping(address => bool) public createdRondas;

    // Modifier to check if Ronda was created by this factory
    modifier onlyCreatedRonda(address rondaAddress) {
        require(createdRondas[rondaAddress], "Ronda not from this factory");
        _;
    }

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
        __VRFConsumerBaseV2_init(_vrfCoordinator);
        
        vrfCoordinator = _vrfCoordinator;
        subscriptionId = uint64(_subscriptionId);
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
    ) external onlyOwner returns (address) {
        Ronda newRonda = new Ronda(
            _participantCount,
            _milestoneCount,
            _monthlyDeposit,
            _entryFee,
            _interestDistribution,
            _paymentToken,
            address(penaltyToken),
            router
        );

        rondaInstances.push(address(newRonda));

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

        newRonda.transferOwnership(address(owner()));

        return address(newRonda);
    }

    function requestRandomnessForRonda(address rondaAddress) external onlyCreatedRonda(rondaAddress) {
        require(rondaAddress != address(0), "Invalid ronda address");

        uint256 requestId = VRFCoordinatorV2Interface(vrfCoordinator).requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );

        vrfRequestToRonda[requestId] = rondaAddress;

        emit RandomnessRequested(rondaAddress, requestId);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address rondaAddress = vrfRequestToRonda[requestId];
        require(rondaAddress != address(0), "Invalid request ID");

        Ronda(rondaAddress).receiveRandomness(requestId, randomWords);

        delete vrfRequestToRonda[requestId];

        emit RandomnessFulfilled(rondaAddress, requestId, randomWords);
    }

    function getRondaCount() external view returns (uint256) {
        return rondaInstances.length;
    }

    function getRondaInstances() external view returns (address[] memory) {
        return rondaInstances;
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
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
