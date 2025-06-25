export const RONDA_FACTORY_ABI = [
        {
            "type": "constructor",
            "inputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "UPGRADE_INTERFACE_VERSION",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "acceptSubscriptionOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "addSupportedChain",
            "inputs": [
                {
                    "name": "rondaId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "chainSelector",
                    "type": "uint64",
                    "internalType": "uint64"
                },
                {
                    "name": "senderContract",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "callbackGasLimit",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "createRonda",
            "inputs": [
                {
                    "name": "_participantCount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_milestoneCount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_monthlyDeposit",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_entryFee",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_interestDistribution",
                    "type": "int256[]",
                    "internalType": "int256[]"
                },
                {
                    "name": "_paymentToken",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "createdRondas",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "deliverRonda",
            "inputs": [
                {
                    "name": "rondaId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "milestone",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getRondaCount",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getRondaInstances",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address[]",
                    "internalType": "address[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "initialize",
            "inputs": [
                {
                    "name": "_vrfCoordinator",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_subscriptionId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_keyHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "_callbackGasLimit",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "_penaltyToken",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_router",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "keyHash",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "mintPenalty",
            "inputs": [
                {
                    "name": "_participant",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "penaltyToken",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract RondaSBT"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "proxiableUUID",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "removePenalty",
            "inputs": [
                {
                    "name": "_participant",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "removeSupportedChain",
            "inputs": [
                {
                    "name": "rondaId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "chainSelector",
                    "type": "uint64",
                    "internalType": "uint64"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
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
            "name": "requestSubscriptionOwnerTransfer",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "rondaInstances",
            "inputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "router",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "setCallbackGasLimit",
            "inputs": [
                {
                    "name": "_callbackGasLimit",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setKeyHash",
            "inputs": [
                {
                    "name": "_keyHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setPenaltyToken",
            "inputs": [
                {
                    "name": "_penaltyToken",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setRouter",
            "inputs": [
                {
                    "name": "_router",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setSubscriptionId",
            "inputs": [
                {
                    "name": "_subscriptionId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setVrfCoordinator",
            "inputs": [
                {
                    "name": "_vrfCoordinator",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "subscriptionId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "upgradeToAndCall",
            "inputs": [
                {
                    "name": "newImplementation",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "data",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "vrfCoordinator",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "Initialized",
            "inputs": [
                {
                    "name": "version",
                    "type": "uint64",
                    "indexed": false,
                    "internalType": "uint64"
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
            "type": "event",
            "name": "RondaCreated",
            "inputs": [
                {
                    "name": "rondaAddress",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "participantCount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "milestoneCount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "monthlyDeposit",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "entryFee",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "paymentToken",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "penaltyToken",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Upgraded",
            "inputs": [
                {
                    "name": "implementation",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "AddressEmptyCode",
            "inputs": [
                {
                    "name": "target",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC1967InvalidImplementation",
            "inputs": [
                {
                    "name": "implementation",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC1967NonPayable",
            "inputs": []
        },
        {
            "type": "error",
            "name": "FailedCall",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InvalidInitialization",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotInitializing",
            "inputs": []
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "UUPSUnauthorizedCallContext",
            "inputs": []
        },
        {
            "type": "error",
            "name": "UUPSUnsupportedProxiableUUID",
            "inputs": [
                {
                    "name": "slot",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        }
    ] as const;