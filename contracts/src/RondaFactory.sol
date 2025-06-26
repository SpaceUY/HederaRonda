// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ronda} from "./Ronda.sol";
import {RondaSBT} from "./RondaSBT.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

contract RondaFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // Struct for default supported chain configuration
    struct DefaultSupportedChain {
        uint64 chainSelector;
        address senderContract;
    }

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

    event DefaultSupportedChainAdded(
        uint64 indexed chainSelector,
        address indexed senderContract
    );

    event DefaultSupportedChainRemoved(
        uint64 indexed chainSelector
    );

    event DefaultSupportedChainUpdated(
        uint64 indexed chainSelector,
        address indexed oldSenderContract,
        address indexed newSenderContract
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

    // Default supported chains storage
    DefaultSupportedChain[] public s_defaultSupportedChains;
    mapping(uint64 => uint256) private s_chainSelectorToIndex;
    mapping(uint64 => bool) public isDefaultSupportedChain;

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
        Ronda.RondaConfig memory rondaConfig = Ronda.RondaConfig({
            participantCount: _participantCount,
            milestoneCount: _milestoneCount,
            monthlyDeposit: _monthlyDeposit,
            entryFee: _entryFee,
            interestDistribution: _interestDistribution,
            paymentToken: _paymentToken,
            penaltyToken: address(penaltyToken)
        });

        Ronda.ChainlinkConfig memory chainlinkConfig = Ronda.ChainlinkConfig({
            router: router,
            vrfCoordinator: vrfCoordinator,
            subscriptionId: subscriptionId,
            keyHash: keyHash,
            callbackGasLimit: callbackGasLimit
        });

        Ronda newRonda = new Ronda(rondaConfig, chainlinkConfig);

        rondaInstances.push(address(newRonda));

        IVRFCoordinatorV2Plus(vrfCoordinator).addConsumer(
            subscriptionId,
            address(newRonda)
        );

        // Set up default supported chains on the new Ronda contract
        _setupDefaultSupportedChains(address(newRonda));

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

    // Default supported chains management functions
    function addDefaultSupportedChain(
        uint64 chainSelector,
        address senderContract
    ) external onlyOwner {
        require(senderContract != address(0), "Invalid sender contract");
        
        if (isDefaultSupportedChain[chainSelector]) {
            // Update existing chain
            uint256 index = s_chainSelectorToIndex[chainSelector];
            address oldSenderContract = s_defaultSupportedChains[index].senderContract;
            s_defaultSupportedChains[index].senderContract = senderContract;
            
            emit DefaultSupportedChainUpdated(chainSelector, oldSenderContract, senderContract);
        } else {
            // Add new chain
            s_defaultSupportedChains.push(DefaultSupportedChain({
                chainSelector: chainSelector,
                senderContract: senderContract
            }));
            
            s_chainSelectorToIndex[chainSelector] = s_defaultSupportedChains.length - 1;
            isDefaultSupportedChain[chainSelector] = true;
            
            emit DefaultSupportedChainAdded(chainSelector, senderContract);
        }
    }

    function removeDefaultSupportedChain(uint64 chainSelector) external onlyOwner {
        require(isDefaultSupportedChain[chainSelector], "Chain not supported");
        
        uint256 indexToRemove = s_chainSelectorToIndex[chainSelector];
        uint256 lastIndex = s_defaultSupportedChains.length - 1;
        
        // Move the last element to the index being removed
        if (indexToRemove != lastIndex) {
            DefaultSupportedChain memory lastChain = s_defaultSupportedChains[lastIndex];
            s_defaultSupportedChains[indexToRemove] = lastChain;
            s_chainSelectorToIndex[lastChain.chainSelector] = indexToRemove;
        }
        
        // Remove the last element
        s_defaultSupportedChains.pop();
        delete s_chainSelectorToIndex[chainSelector];
        isDefaultSupportedChain[chainSelector] = false;
        
        emit DefaultSupportedChainRemoved(chainSelector);
    }

    function getDefaultSupportedChains() external view returns (DefaultSupportedChain[] memory) {
        return s_defaultSupportedChains;
    }

    function getDefaultSupportedChainsCount() external view returns (uint256) {
        return s_defaultSupportedChains.length;
    }

    function getDefaultSupportedChain(uint64 chainSelector) external view returns (DefaultSupportedChain memory) {
        require(isDefaultSupportedChain[chainSelector], "Chain not supported");
        uint256 index = s_chainSelectorToIndex[chainSelector];
        return s_defaultSupportedChains[index];
    }

    // Internal function to set up default supported chains on new Ronda contracts
    function _setupDefaultSupportedChains(address rondaAddress) internal {
        for (uint256 i = 0; i < s_defaultSupportedChains.length; i++) {
            DefaultSupportedChain memory chain = s_defaultSupportedChains[i];
            Ronda(rondaAddress).addSupportedChain(
                chain.chainSelector,
                chain.senderContract
            );
        }
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

    // CCIP management functions (for specific Ronda instances)
    function addSupportedChain(
        uint256 rondaId,
        uint64 chainSelector,
        address senderContract
    ) external onlyOwner {
        require(rondaId < rondaInstances.length, "Invalid ronda ID");
        Ronda(rondaInstances[rondaId]).addSupportedChain(
            chainSelector,
            senderContract
        );
    }

    function removeSupportedChain(
        uint256 rondaId,
        uint64 chainSelector
    ) external onlyOwner {
        require(rondaId < rondaInstances.length, "Invalid ronda ID");
        Ronda(rondaInstances[rondaId]).removeSupportedChain(chainSelector);
    }

    // Required by UUPSUpgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
