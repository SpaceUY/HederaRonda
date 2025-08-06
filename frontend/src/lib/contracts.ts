// Shared contract ABIs and addresses

// Updated RONDA ABI with the new contract interface
export const RONDA_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_participantCount","type":"uint256"},{"internalType":"uint256","name":"_milestoneCount","type":"uint256"},{"internalType":"uint256","name":"_monthlyDeposit","type":"uint256"},{"internalType":"uint256","name":"_entryFee","type":"uint256"},{"internalType":"int256[]","name":"_interestDistribution","type":"int256[]"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"address","name":"_penaltyToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"DepositMade","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"}],"name":"ParticipantJoined","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"PenaltyIssued","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"},{"indexed":false,"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"RondaDelivered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum Ronda.RondaState","name":"newState","type":"uint8"}],"name":"RondaStateChanged","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address[]","name":"participants","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"slots","type":"uint256[]"}],"name":"SlotsAssigned","type":"event"},
  {"inputs":[],"name":"abortRonda","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"currentState","outputs":[{"internalType":"enum Ronda.RondaState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_milestone","type":"uint256"}],"name":"deliverRonda","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"milestone","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"entryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"hasApprovedEnough","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"hasParticipantJoined","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"interestDistribution","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"joinRonda","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"joinedParticipants","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"milestoneCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"milestones","outputs":[{"internalType":"bool","name":"isComplete","type":"bool"},{"internalType":"uint256","name":"totalDeposits","type":"uint256"},{"internalType":"uint256","name":"requiredDeposits","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"monthlyDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"participantCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paymentToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"penaltyToken","outputs":[{"internalType":"contract RondaSBT","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_participant","type":"address"}],"name":"removePenalty","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"slotToParticipant","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
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
      {"indexed": false, "internalType": "uint256", "name": "participantCount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "milestoneCount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "monthlyDeposit", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "entryFee", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "paymentToken", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "penaltyToken", "type": "address"}
    ],
    "name": "RondaCreated",
    "type": "event"
  }
] as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  PROXY_FACTORY: "0xf1dB7Ea49c20Ecf95e6ab8F57889769F4C34b0fb",
  PENALTY_TOKEN: "0x8550C69142c56De276cC351000F91Eb36Ed2Be56",
  MOCK_USDC: "0xdEEa7Fe28c04315CFfe83c28eEF56A01A3E8d642"
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  HEDERA: {
    chainId: 296,
    name: 'Hedera Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api",
    blockExplorer: 'https://hashscan.io/testnet',
  }
} as const;

// State enum mapping
export const RONDA_STATES = ['Open', 'Running', 'Finalized', 'Aborted'] as const;