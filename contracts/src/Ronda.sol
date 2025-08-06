// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {RondaSBT} from "./RondaSBT.sol";

contract Ronda {
    using SafeERC20 for IERC20;

    enum RondaState {
        Open,
        Running,
        Finalized,
        Aborted
    }

    struct Milestone {
        bool isComplete;
        uint256 totalDeposits;
        uint256 requiredDeposits;
    }

    struct RondaConfig {
        uint256 participantCount;
        uint256 milestoneCount;
        uint256 monthlyDeposit;
        uint256 entryFee;
        int256[] interestDistribution;
        address paymentToken;
        address penaltyToken;
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

    // Mappings
    mapping(address => bool) public hasJoined;
    mapping(address => mapping(uint256 => bool)) public milestonePaid;
    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => address) public slotToParticipant;

    // Events
    event RondaStateChanged(RondaState newState);
    event ParticipantJoined(address indexed participant);
    event DepositMade(address indexed participant, uint256 milestone);
    event RondaDelivered(address indexed participant, uint256 milestone);
    event SlotsAssigned(address[] participants, uint256[] slots);
    event PenaltyIssued(address indexed participant, uint256 milestone);

    constructor(RondaConfig memory _rondaConfig) {
        require(
            _rondaConfig.participantCount > 0,
            "Participant count must be greater than 0"
        );
        require(_rondaConfig.milestoneCount > 0, "Milestone count must be greater than 0");
        require(_rondaConfig.monthlyDeposit > 0, "Monthly deposit must be greater than 0");
        require(_rondaConfig.entryFee > 0, "Entry fee must be greater than 0");
        require(
            _rondaConfig.interestDistribution.length == _rondaConfig.milestoneCount,
            "Interest distribution length must match milestone count"
        );

        // Check that sum of interest distribution equals 0
        int256 sum = 0;
        for (uint256 i = 0; i < _rondaConfig.interestDistribution.length; i++) {
            sum += _rondaConfig.interestDistribution[i];
        }
        require(sum == 0, "Sum of interest distribution must equal 0");

        participantCount = _rondaConfig.participantCount;
        milestoneCount = _rondaConfig.milestoneCount;
        monthlyDeposit = _rondaConfig.monthlyDeposit;
        entryFee = _rondaConfig.entryFee;
        interestDistribution = _rondaConfig.interestDistribution;
        paymentToken = IERC20(_rondaConfig.paymentToken);
        penaltyToken = RondaSBT(_rondaConfig.penaltyToken);
        factory = msg.sender;
        
        _changeState(RondaState.Open);

        // Initialize milestones
        for (uint256 i = 0; i < _rondaConfig.milestoneCount; i++) {
            milestones[i] = Milestone({
                isComplete: false,
                totalDeposits: 0,
                requiredDeposits: _rondaConfig.participantCount
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

    function abortRonda() external onlyOwnerOrFactory {
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
    function removePenalty(address _participant) external onlyOwnerOrFactory {
        penaltyToken.burnPenalty(_participant);
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
            _assignSlots();
            _changeState(RondaState.Running);
        }
    }

    function _assignSlots() internal {
        require(
            joinedParticipants.length == participantCount,
            "Not all participants have joined"
        );

        // Create array of available slots
        uint256[] memory availableSlots = new uint256[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            availableSlots[i] = i;
        }

        // Fisher-Yates shuffle using block-based randomness
        // Note: This is not cryptographically secure but sufficient for our use case
        // as the economic incentives and penalties help prevent manipulation
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            joinedParticipants
        )));

        for (uint256 i = participantCount - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
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

    function owner() public view returns (address) {
        return factory;
    }
}
