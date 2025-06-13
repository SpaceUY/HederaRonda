// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract Ronda is Ownable, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

    enum RondaState { Open, Running, Finalized, Aborted, Randomizing }

    struct Participant {
        bool hasJoined;
        mapping(uint256 => bool) milestonePaid;
    }

    struct Milestone {
        bool isComplete;
        uint256 totalDeposits;
        uint256 requiredDeposits;
    }

    // Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    uint64 private immutable subscriptionId;
    bytes32 private immutable keyHash;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // State variables
    RondaState public currentState;
    uint256 public participantCount;
    uint256 public milestoneCount;
    uint256 public monthlyDeposit;
    uint256 public entryFee;
    int256[] public interestDistribution;
    IERC20 public paymentToken;
    address[] private joinedParticipants;
    uint256 private vrfRequestId;

    // Mappings
    mapping(address => Participant) public participants;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => address) public slotToParticipant;

    // Events
    event RondaStateChanged(RondaState newState);
    event ParticipantJoined(address indexed participant);
    event DepositMade(address indexed participant, uint256 milestone);
    event RondaDelivered(address indexed participant, uint256 milestone);
    event RandomnessRequested();
    event SlotsAssigned(address[] participants, uint256[] slots);

    constructor(
        uint256 _participantCount,
        uint256 _milestoneCount,
        uint256 _monthlyDeposit,
        uint256 _entryFee,
        int256[] memory _interestDistribution,
        address _paymentToken,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) Ownable(msg.sender) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_participantCount > 0, "Participant count must be greater than 0");
        require(_milestoneCount > 0, "Milestone count must be greater than 0");
        require(_monthlyDeposit > 0, "Monthly deposit must be greater than 0");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(_interestDistribution.length == _milestoneCount, "Interest distribution length must match milestone count");
        
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
        _changeState(RondaState.Open);

        // Initialize VRF variables
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;

        // Initialize milestones
        for (uint256 i = 0; i < _milestoneCount; i++) {
            milestones[i] = Milestone({
                isComplete: false,
                totalDeposits: 0,
                requiredDeposits: _participantCount
            });
        }
    }

    modifier onlyParticipant() {
        require(participants[msg.sender].hasJoined, "Not a participant");
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

    modifier isWhitelisted(address _participant) {
        // TODO: implemtent whitelisting
        _;
    }

    function joinRonda() external onlyOpen isWhitelisted(msg.sender) {
        require(!hasParticipantJoined(msg.sender), "Already joined");

        // Transfer entry fee
        paymentToken.safeTransferFrom(msg.sender, address(this), entryFee);

        // Update participant state
        participants[msg.sender].hasJoined = true;
        joinedParticipants.push(msg.sender);

        emit ParticipantJoined(msg.sender);

        // Check if ronda is full
        if (joinedParticipants.length == participantCount) {
            requestRandomness();
        }
    }

    function deposit(uint256 _milestone) external onlyParticipant onlyRunning {
        require(_milestone < milestoneCount, "Invalid milestone");
        require(!participants[msg.sender].milestonePaid[_milestone], "Already paid for this milestone");

        // Transfer monthly deposit
        paymentToken.safeTransferFrom(msg.sender, address(this), monthlyDeposit);

        // Update milestone state
        participants[msg.sender].milestonePaid[_milestone] = true;
        milestones[_milestone].totalDeposits++;

        emit DepositMade(msg.sender, _milestone);

        // Check if milestone is complete
        if (milestones[_milestone].totalDeposits == milestones[_milestone].requiredDeposits) {
            milestones[_milestone].isComplete = true;
        }
    }

    function deliverRonda(uint256 _milestone) external onlyOwner onlyRunning {
        require(currentState == RondaState.Running, "Ronda is not running");
        require(_milestone < milestoneCount, "Invalid milestone");
        require(milestones[_milestone].isComplete, "Milestone not complete");

        address participant = slotToParticipant[_milestone];
        require(participant != address(0), "No participant for this slot");

        // Calculate amount to deliver (including interest)
        uint256 amountToDeliver = monthlyDeposit * participantCount;
        int256 interest = (int256(amountToDeliver) * interestDistribution[_milestone]) / 100;
        uint256 totalAmount = amountToDeliver + uint256(interest);

        // Transfer funds to participant
        paymentToken.safeTransfer(participant, totalAmount);

        emit RondaDelivered(participant, _milestone);

        if (_milestone == milestoneCount - 1) {
            _changeState(RondaState.Finalized);
        }
    }

    function abortRonda() external onlyOwner {
        require(currentState != RondaState.Finalized, "Cannot abort finalized ronda");
        _changeState(RondaState.Aborted);
    }

    function hasParticipantJoined(address _participant) public view returns (bool) {
        return participants[_participant].hasJoined;
    }

    function hasApprovedEnough(address _participant) public view returns (bool) {
        uint256 allowance = paymentToken.allowance(_participant, address(this));
        return allowance >= monthlyDeposit;
    }

    function requestRandomness() internal {
        require(currentState == RondaState.Open, "Ronda must be in open state");
        vrfRequestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        _changeState(RondaState.Randomizing);
        emit RandomnessRequested();
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        require(requestId == vrfRequestId, "Invalid request ID");
        require(currentState == RondaState.Randomizing, "Ronda must be in randomizing state");
        _assignSlots(randomWords[0]);
        _changeState(RondaState.Running);
    }

    function _changeState(RondaState _newState) internal {
        currentState = _newState;
        emit RondaStateChanged(_newState);
    }

    function _assignSlots(uint256 _randomSeed) internal {
        require(joinedParticipants.length == participantCount, "Not all participants have joined");

        // Create array of available slots
        uint256[] memory availableSlots = new uint256[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            availableSlots[i] = i;
        }

        // Fisher-Yates shuffle using the random seed
        for (uint256 i = participantCount - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(_randomSeed, i))) % (i + 1);
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
} 