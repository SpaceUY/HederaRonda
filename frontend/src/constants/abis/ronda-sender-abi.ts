export const RONDA_SENDER_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_router", "type": "address", "internalType": "address" },
      {
        "name": "_destinationChainSelector",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "rondaContract",
        "type": "address",
        "internalType": "address"
      },
      { "name": "milestone", "type": "uint256", "internalType": "uint256" },
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "joinRonda",
    "inputs": [
      {
        "name": "rondaContract",
        "type": "address",
        "internalType": "address"
      },
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      { "name": "newOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "MessageFailed",
    "inputs": [
      {
        "name": "messageId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "error",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MessageSent",
    "inputs": [
      {
        "name": "messageId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      { "name": "account", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" }
    ]
  }
] as const; 