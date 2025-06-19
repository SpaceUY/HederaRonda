// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ronda} from "./Ronda.sol";
import {RondaSBT} from "./RondaSBT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RondaFactory is Ownable {
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
    address public immutable vrfCoordinator;
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public immutable callbackGasLimit;
    RondaSBT public immutable penaltyToken;
    address public immutable router;

    // Array to track all created Ronda instances
    address[] public rondaInstances;

    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        address _penaltyToken,
        address _router
    ) Ownable(msg.sender) {
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
    ) external onlyOwner returns (address) {
        Ronda newRonda = new Ronda(
            _participantCount,
            _milestoneCount,
            _monthlyDeposit,
            _entryFee,
            _interestDistribution,
            _paymentToken,
            address(penaltyToken),
            vrfCoordinator,
            subscriptionId,
            keyHash,
            callbackGasLimit,
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

        return address(newRonda);
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
}
