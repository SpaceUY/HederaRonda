// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Client} from "chainlink-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "chainlink-ccip/contracts/applications/CCIPReceiver.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {RondaSBT} from "./RondaSBT.sol";

contract Ronda is CCIPReceiver, VRFConsumerBaseV2Plus {
    using SafeERC20 for IERC20;

    enum RondaState {
        Open,
        Running,
        Finalized,
        Aborted,
        Randomizing
    }

    struct Milestone {
        bool isComplete;
        uint256 totalDeposits;
        uint256 requiredDeposits;
    }

    // State variables
    RondaState public currentState;
    uint256 public participantCount;
    uint256 public milestoneCount;
    uint256 public monthlyDeposit;
    uint256 public entryFee;
    int256[] public interestDistribution;
    IERC20 public paymentToken;
    address[] public joinedParticipants;
    RondaSBT public penaltyToken;
    address public factory;

    // VRF variables
    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;
    uint256 public lastRequestId;

    // Mappings
    mapping(address => bool) public hasJoined;
    mapping(address => mapping(uint256 => bool)) public milestonePaid;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => address) public slotToParticipant;

    // CCIP variables
    mapping(uint64 => bool) public supportedChains;
    mapping(uint64 => address) public senderContracts;

    // Events
    event RondaStateChanged(RondaState newState);
    event ParticipantJoined(address indexed participant);
    event DepositMade(address indexed participant, uint256 milestone);
    event RondaDelivered(address indexed participant, uint256 milestone);
    event RandomnessRequested(uint256 requestId);
    event RandomnessReceived(uint256 requestId, uint256[] randomWords);
    event SlotsAssigned(address[] participants, uint256[] slots);
    event PenaltyIssued(address indexed participant, uint256 milestone);

    // Events for cross-chain functions
    event CrossChainJoinRequested(
        address indexed participant,
        uint64 sourceChainSelector
    );
    event CrossChainDepositRequested(
        address indexed participant,
        uint256 milestone,
        uint64 sourceChainSelector
    );

    constructor(
        uint256 _participantCount,
        uint256 _milestoneCount,
        uint256 _monthlyDeposit,
        uint256 _entryFee,
        int256[] memory _interestDistribution,
        address _paymentToken,
        address _penaltyToken,
        address _router,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) CCIPReceiver(_router) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(
            _participantCount > 0,
            "Participant count must be greater than 0"
        );
        require(_milestoneCount > 0, "Milestone count must be greater than 0");
        require(_monthlyDeposit > 0, "Monthly deposit must be greater than 0");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(
            _interestDistribution.length == _milestoneCount,
            "Interest distribution length must match milestone count"
        );

        // Check that sum of interest distribution equals 0
        int256 sum = 0;
        for (uint256 i = 0; i < _interestDistribution.length; i++) {
            sum += _interestDistribution[i];
        }
        require(sum == 0, "Sum of interest distribution must equal 0");

        participantCount = _participantCount;
        milestoneCount = _milestoneCount;
        monthlyDeposit = _monthlyDeposit;
        entryFee = _entryFee;
        interestDistribution = _interestDistribution;
        paymentToken = IERC20(_paymentToken);
        penaltyToken = RondaSBT(_penaltyToken);
        factory = msg.sender;
        
        // Initialize VRF variables
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = 3;
        numWords = 1;
        
        _changeState(RondaState.Open);

        // Initialize milestones
        for (uint256 i = 0; i < _milestoneCount; i++) {
            milestones[i] = Milestone({
                isComplete: false,
                totalDeposits: 0,
                requiredDeposits: _participantCount
            });
        }
    }

    modifier onlyParticipant(address participant) {
        require(hasJoined[participant], "Not a participant");
        _;
    }

    modifier onlyOpen() {
        require(currentState == RondaState.Open, "Ronda is not open");
        _;
    }

    modifier onlyRunning() {
        require(currentState == RondaState.Running, "Ronda is not running");
        _;
    }

    modifier onlyOwnerOrFactory() {
        require(msg.sender == factory || msg.sender == owner(), "Only factory or owner can call this function");
        _;
    }

    modifier isWhitelisted(address _participant) {
        // TODO: implement whitelisting
        _;
    }

    function joinRonda() external {
        // Transfer entry fee
        paymentToken.safeTransferFrom(msg.sender, address(this), entryFee);
        _joinRondaInternal(msg.sender);
    }

    function deposit(uint256 milestone) external {
        // Transfer monthly deposit
        paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            monthlyDeposit
        );
        _depositInternal(msg.sender, milestone);
    }

    function deliverRonda(uint256 _milestone) external onlyOwnerOrFactory onlyRunning {
        require(_milestone < milestoneCount, "Invalid milestone");
        bool penaltyIssued = _checkAndIssuePenalties(_milestone);
        if (penaltyIssued) {
            return;
        }

        address participant = slotToParticipant[_milestone];
        require(participant != address(0), "No participant for this slot");

        // Calculate amount to deliver (including interest)
        uint256 amountToDeliver = monthlyDeposit * participantCount;
        int256 interest = (int256(amountToDeliver) *
            interestDistribution[_milestone]) / 100;
        uint256 totalAmount = amountToDeliver + uint256(interest);

        // Transfer funds to participant
        paymentToken.safeTransfer(participant, totalAmount);

        emit RondaDelivered(participant, _milestone);

        if (_milestone == milestoneCount - 1) {
            _changeState(RondaState.Finalized);
        }
    }

    function abortRonda() external onlyOwnerOrFactory{
        require(
            currentState != RondaState.Finalized,
            "Cannot abort finalized ronda"
        );
        _changeState(RondaState.Aborted);
    }

    function hasParticipantJoined(
        address _participant
    ) public view returns (bool) {
        return hasJoined[_participant];
    }

    function hasApprovedEnough(
        address _participant
    ) public view returns (bool) {
        uint256 allowance = paymentToken.allowance(_participant, address(this));
        return allowance >= monthlyDeposit;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        require(requestId == lastRequestId, "Invalid request ID");
        require(
            currentState == RondaState.Randomizing,
            "Ronda must be in randomizing state"
        );
        _assignSlots(randomWords[0]);
        _changeState(RondaState.Running);
        
        emit RandomnessReceived(requestId, randomWords);
    }

    function _changeState(RondaState _newState) internal {
        currentState = _newState;
        emit RondaStateChanged(_newState);
    }

    // Function to check and issue penalties for non-paying participants
    function _checkAndIssuePenalties(
        uint256 _milestone
    ) internal returns (bool) {
        require(_milestone < milestoneCount, "Invalid milestone");

        bool penaltyIssued = false;
        for (uint256 i = 0; i < participantCount; i++) {
            address participant = slotToParticipant[i];
            if (
                participant != address(0) &&
                !milestonePaid[participant][_milestone]
            ) {
                penaltyToken.mintPenalty(participant);
                penaltyIssued = true;
                emit PenaltyIssued(participant, _milestone);
            }
        }
        return penaltyIssued;
    }

    // Function to remove penalty when participant pays their dues
    function removePenalty(address _participant) external onlyOwnerOrFactory{
        penaltyToken.burnPenalty(_participant);
    }

    function addSupportedChain(
        uint64 chainSelector,
        address senderContract
    ) external onlyOwnerOrFactory{
        supportedChains[chainSelector] = true;
        senderContracts[chainSelector] = senderContract;
    }

    function removeSupportedChain(
        uint64 chainSelector
    ) external onlyOwnerOrFactory{
        supportedChains[chainSelector] = false;
        delete senderContracts[chainSelector];
    }

    function _depositInternal(
        address participant,
        uint256 milestone
    ) internal onlyParticipant(participant) onlyRunning {
        require(currentState == RondaState.Running, "Ronda is not running");
        require(milestone < milestoneCount, "Invalid milestone");
        require(
            !milestonePaid[participant][milestone],
            "Already paid for this milestone"
        );

        // Update milestone state
        milestonePaid[participant][milestone] = true;
        milestones[milestone].totalDeposits++;

        emit DepositMade(participant, milestone);

        // Check if milestone is complete
        if (
            milestones[milestone].totalDeposits ==
            milestones[milestone].requiredDeposits
        ) {
            milestones[milestone].isComplete = true;
        }
    }

    function _joinRondaInternal(
        address participant
    ) internal onlyOpen isWhitelisted(participant) {
        require(!hasParticipantJoined(participant), "Already joined");

        // Update participant state
        hasJoined[participant] = true;
        joinedParticipants.push(participant);

        emit ParticipantJoined(participant);

        if (joinedParticipants.length == participantCount) {
            _changeState(RondaState.Randomizing);
            _requestRandomnessInternal();
        }
    }

    function _requestRandomnessInternal() internal {
        require(
            currentState == RondaState.Randomizing,
            "Ronda must be in randomizing state"
        );
        
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
        });
        
        lastRequestId = s_vrfCoordinator.requestRandomWords(req);
        
        emit RandomnessRequested(lastRequestId);
    }
    
    function _assignSlots(uint256 _randomSeed) internal {
        require(
            joinedParticipants.length == participantCount,
            "Not all participants have joined"
        );

        // Create array of available slots
        uint256[] memory availableSlots = new uint256[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            availableSlots[i] = i;
        }

        // Fisher-Yates shuffle using the random seed
        for (uint256 i = participantCount - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(_randomSeed, i))) %
                (i + 1);
            uint256 temp = availableSlots[i];
            availableSlots[i] = availableSlots[j];
            availableSlots[j] = temp;
        }

        // Assign slots to participants
        for (uint256 i = 0; i < participantCount; i++) {
            slotToParticipant[availableSlots[i]] = joinedParticipants[i];
        }

        emit SlotsAssigned(joinedParticipants, availableSlots);
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        // Verify the chain is supported
        require(
            supportedChains[message.sourceChainSelector],
            "Chain not supported"
        );

        // Verify the sender contract is allowlisted
        require(
            senderContracts[message.sourceChainSelector] ==
                abi.decode(message.sender, (address)),
            "Invalid sender"
        );
        
        // Verify the token received is the same as the payment token
        Client.EVMTokenAmount memory destToken = message.destTokenAmounts[0];
        require(
            destToken.token == address(paymentToken),
            "Invalid token"
        );

        // Get the original sender from the source chain
        address originalSender = abi.decode(message.sender, (address));

        // Decode the function selector and parameters
        (bytes4 selector, bytes memory params) = abi.decode(
            message.data,
            (bytes4, bytes)
        );

        if (selector == this.joinRonda.selector) {
            // Verify the amount received is the same as the entry fee
            require(
                destToken.amount == entryFee,
                "Invalid amount"
            );

            _joinRondaInternal(originalSender);
            emit CrossChainJoinRequested(
                originalSender,
                message.sourceChainSelector
            );
        } else if (selector == this.deposit.selector) {
            // Verify the amount received is the same as the monthly deposit
            require(
                destToken.amount == monthlyDeposit,
                "Invalid amount"
            );

            uint256 milestone = abi.decode(params, (uint256));
            _depositInternal(originalSender, milestone);
            emit CrossChainDepositRequested(
                originalSender,
                milestone,
                message.sourceChainSelector
            );
        } else {
            revert("Invalid function selector");
        }
    }
}
