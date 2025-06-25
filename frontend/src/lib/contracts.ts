// Shared contract ABIs and addresses

// Updated RONDA ABI with the new contract interface
export const RONDA_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_participantCount","type":"uint256"},{"internalType":"uint256","name":"_milestoneCount","type":"uint256"},{"internalType":"uint256","name":"_monthlyDeposit","type":"uint256"},{"internalType":"uint256","name":"_entryFee","type":"uint256"},{"internalType":"int256[]","name":"_interestDistribution","type":"int256[]"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"address","name":"_penaltyToken","type":"address"},{"internalType":"address","name":"_vrfCoordinator","type":"address"},{"internalType":"uint256","name":"_subscriptionId","type":"uint256"},{"internalType":"bytes32","name":"_keyHash","type":"bytes32"},{"internalType":"uint32","name":"_callbackGasLimit","type":"uint32"},{"internalType":"address","name":"_router","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"router","type":"address"}],"name":"InvalidRouter","type":"error"},
  {"inputs":[{"internalType":"address","name":"have","type":"address"},{"internalType":"address","name":"want","type":"address"}],"name":"OnlyCoordinatorCanFulfill","type":"error"},
  {"inputs":[{"internalType":"address","name":"have","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"coordinator","type":"address"}],"name":"OnlyOwnerOrCoordinator","type":"error"},
  {"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},
  {"inputs":[],"name":"ZeroAddress","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"vrfCoordinator","type":"address"}],"name":"CoordinatorSet","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"sourceChainSelector","type":"uint64"}],"name":"CrossChainDepositRequested","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint64","name":"sourceChainSelector","type":"uint64"}],"name":"CrossChainJoinRequested","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"DepositMade","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"}],"name":"ParticipantJoined","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"PenaltyIssued","type":"event"},
  {"anonymous":false,"inputs":[],"name":"RandomnessRequested","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"RondaDelivered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum Ronda.RondaState","name":"newState","type":"uint8"}],"name":"RondaStateChanged","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address[]","name":"participants","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"slots","type":"uint256[]"}],"name":"SlotsAssigned","type":"event"},
  {"inputs":[],"name":"abortRonda","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint64","name":"chainSelector","type":"uint64"},{"internalType":"address","name":"senderContract","type":"address"}],"name":"addSupportedChain","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"components":[{"internalType":"bytes32","name":"messageId","type":"bytes32"},{"internalType":"uint64","name":"sourceChainSelector","type":"uint64"},{"internalType":"bytes","name":"sender","type":"bytes"},{"internalType":"bytes","name":"data","type":"bytes"},{"components":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"internalType":"struct Client.EVMTokenAmount[]","name":"destTokenAmounts","type":"tuple[]"}],"internalType":"struct Client.Any2EVMMessage","name":"message","type":"tuple"}],"name":"ccipReceive","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"currentState","outputs":[{"internalType":"enum Ronda.RondaState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_milestone","type":"uint256"}],"name":"deliverRonda","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"entryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getRouter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"hasApprovedEnough","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"hasParticipantJoined","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"interestDistribution","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"joinRonda","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"joinedParticipants","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"milestoneCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"milestones","outputs":[{"internalType":"bool","name":"isComplete","type":"bool"},{"internalType":"uint256","name":"totalDeposits","type":"uint256"},{"internalType":"uint256","name":"requiredDeposits","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"monthlyDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"participantCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"participants","outputs":[{"internalType":"bool","name":"hasJoined","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paymentToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"penaltyToken","outputs":[{"internalType":"contract RondaSBT","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"requestId","type":"uint256"},{"internalType":"uint256[]","name":"randomWords","type":"uint256[]"}],"name":"rawFulfillRandomWords","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"removePenalty","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint64","name":"chainSelector","type":"uint64"}],"name":"removeSupportedChain","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"s_vrfCoordinator","outputs":[{"internalType":"contract IVRFCoordinatorV2Plus","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint64","name":"","type":"uint64"}],"name":"senderContracts","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_vrfCoordinator","type":"address"}],"name":"setCoordinator","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"slotToParticipant","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint64","name":"","type":"uint64"}],"name":"supportedChains","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
] as const;

// Factory ABI - Updated to match the actual deployed proxy contract
export const FACTORY_ABI = [
  // Read functions from the proxy contract
  {
    "inputs": [],
    "name": "getRondaCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRondaInstances",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "rondaInstances",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions from the proxy contract
  {
    "inputs": [
      {"internalType": "uint256", "name": "_participantCount", "type": "uint256"},
      {"internalType": "uint256", "name": "_milestoneCount", "type": "uint256"},
      {"internalType": "uint256", "name": "_monthlyDeposit", "type": "uint256"},
      {"internalType": "uint256", "name": "_entryFee", "type": "uint256"},
      {"internalType": "int256[]", "name": "_interestDistribution", "type": "int256[]"},
      {"internalType": "address", "name": "_paymentToken", "type": "address"}
    ],
    "name": "createRonda",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "rondaAddress", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "participantCount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "milestoneCount", "type": "uint256"}
    ],
    "name": "RondaCreated",
    "type": "event"
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  PROXY_FACTORY: "0xFd4F11F5B27B7a5e9c8Ce8784ebbFC180F129064",
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    blockExplorer: 'https://sepolia.etherscan.io',
  }
} as const;

// State enum mapping
export const RONDA_STATES = ['Open', 'Running', 'Finalized', 'Aborted', 'Randomizing'] as const;