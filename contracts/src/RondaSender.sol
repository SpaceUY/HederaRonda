// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "chainlink-ccip/contracts/interfaces/IRouterClient.sol";
import "chainlink-ccip/contracts/applications/CCIPReceiver.sol";
import "chainlink-ccip/contracts/libraries/Client.sol";
import "./InteroperableRondaInterface.sol";
import {Ronda} from "./Ronda.sol";

contract RondaSender is Ownable, InteroperableRondaInterface {
    using SafeERC20 for IERC20;

    // CCIP variables
    IRouterClient private immutable router;
    uint64 private immutable destinationChainSelector;

    // Events
    event MessageSent(bytes32 messageId);
    event MessageFailed(bytes32 messageId, bytes error);

    constructor(
        address _router,
        uint64 _destinationChainSelector
    ) Ownable(msg.sender) {
        router = IRouterClient(_router);
        destinationChainSelector = _destinationChainSelector;
    }

    function joinRonda(
        address rondaContract,
        address token,
        uint256 amount
    ) external payable {
        bytes memory data = abi.encode(
            bytes4(Ronda.joinRonda.selector),
            abi.encode(msg.sender)
        );

        _sendCCIPMessage(rondaContract, data, token, amount);
    }

    function deposit(
        address rondaContract, // Should be the indexer contract address, but then the factory should be the receiver
        uint256 milestone,
        address token,
        uint256 amount
    ) external payable {
        bytes memory data = abi.encode(
            bytes4(Ronda.deposit.selector),
            abi.encode(msg.sender, milestone)
        );

        _sendCCIPMessage(rondaContract, data, token, amount);
    }

    function _sendCCIPMessage(
        address _rondaContract,
        bytes memory _data,
        address _token,
        uint256 _amount
    ) internal {
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Create CCIP message
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        IERC20(_token).approve(address(router), _amount);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(_rondaContract),
            data: _data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200000})
            ),
            feeToken: address(0)
        });

        // Get the fee required to send the message
        uint256 fee = router.getFee(destinationChainSelector, message);
        require(msg.value >= fee, "Insufficient balance");

        // Send the message
        bytes32 messageId = router.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );

        emit MessageSent(messageId);
    }
}
