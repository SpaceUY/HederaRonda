// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ronda} from "./Ronda.sol";
import {RondaSBT} from "./RondaSBT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RondaFactorySimple is Ownable {
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
    RondaSBT public penaltyToken;
    address[] public rondaInstances;
    mapping(address => bool) public createdRondas;

    constructor(address _penaltyToken) Ownable(msg.sender) {
        penaltyToken = RondaSBT(_penaltyToken);
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

        Ronda newRonda = new Ronda(rondaConfig);
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

    function mintPenalty(address _participant) external onlyOwner {
        penaltyToken.mintPenalty(_participant);
    }

    function removePenalty(address _participant) external onlyOwner {
        penaltyToken.burnPenalty(_participant);
    }

    function setPenaltyToken(address _penaltyToken) external onlyOwner {
        penaltyToken = RondaSBT(_penaltyToken);
    }
} 