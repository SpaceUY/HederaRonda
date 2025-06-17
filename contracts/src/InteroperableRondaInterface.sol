// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface InteroperableRondaInterface {
    // Cross-chain functions
    function joinRonda(
        address rondaContract,
        address token,
        uint256 amount
    ) external payable;
    function deposit(
        address rondaContract,
        uint256 milestone,
        address token,
        uint256 amount
    ) external payable;
}
