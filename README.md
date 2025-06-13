# Ronda Smart Contract

A decentralized savings circle (Ronda) implementation using Solidity and Chainlink VRF for fair participant selection.

## Overview

Ronda is a smart contract that implements a traditional savings circle (also known as a "Ronda" or "Tanda") on the blockchain. It uses Chainlink VRF (Verifiable Random Function) to ensure fair and transparent participant selection.

### Key Features

- Decentralized savings circle implementation
- Fair participant selection using Chainlink VRF
- Interest distribution mechanism
- Entry fee system
- Milestone-based deposits
- Emergency abort functionality

## Technical Requirements

- Solidity ^0.8.20
- Foundry
- Chainlink VRF v2
- OpenZeppelin Contracts

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chainlinkronda.git
cd chainlinkronda
```

2. Install dependencies:
```bash
forge install
```

## Development

### Compile Contracts

```bash
forge build
```

### Run Tests

```bash
forge test
```

### Run Tests with Coverage

```bash
forge coverage
```

## Deployment

1. Create a `.env` file with the following variables:
```env
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Deploy the contract:
```bash
forge script script/DeployRonda.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### Required Parameters

When deploying, you'll need to provide:
- `participantCount`: Number of participants in the Ronda
- `milestoneCount`: Number of milestones/deposits
- `monthlyDeposit`: Amount to deposit per milestone
- `entryFee`: One-time entry fee
- `interestDistribution`: Array of interest rates per milestone (must sum to 0)
- `paymentToken`: ERC20 token address for payments
- Chainlink VRF parameters:
  - `vrfCoordinator`: Chainlink VRF Coordinator address
  - `subscriptionId`: Your Chainlink VRF subscription ID
  - `keyHash`: Chainlink VRF key hash
  - `callbackGasLimit`: Gas limit for VRF callback

## Contract Architecture

### Main Contract: Ronda.sol

The main contract implements the core Ronda functionality:

- Participant management
- Deposit handling
- Interest distribution
- Random participant selection
- State management

### Key Functions

- `joinRonda()`: Join the Ronda (requires entry fee)
- `deposit(uint256 milestone)`: Make a deposit for a specific milestone
- `deliverRonda(uint256 milestone)`: Distribute funds for a milestone
- `abortRonda()`: Emergency function to abort the Ronda

## Testing

The test suite includes:
- Basic joining functionality
- Deposit and delivery mechanisms
- Interest distribution validation
- Emergency abort functionality
- VRF integration tests

## Security Considerations

- Entry fee is required only upon joining
- Interest distribution must sum to zero
- Emergency abort function for safety
- VRF for fair participant selection
- Reentrancy protection
- Access control for critical functions

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 