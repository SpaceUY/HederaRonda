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

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
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

## Setup

1. Set up environment variables:
```bash
cp .env.example .env
```


2. Deploy the contracts:
```bash
# Deploy RondaFactory
forge script script/DeployRondaFactory.s.sol:DeployRondaFactory --rpc-url $RPC_URL --broadcast --verify

# Update .env with the deployed RondaFactory address
# RONDA_FACTORY_ADDRESS=<deployed_address>
# PENALTY_TOKEN_ADDRESS=<deployed_address>

# Deploy RondaInstance
forge script script/DeployRondaInstance.s.sol:DeployRondaInstance --rpc-url $RPC_URL --broadcast --verify

```

## Deployment

### Local Testing with Anvil

1. Start Anvil in a separate terminal:
```bash
anvil
```


2. Deploy the contracts in sequence:

```bash
# Deploy MockToken
forge script script/DeployMockToken.s.sol:DeployMockToken --fork-url http://localhost:8545 --broadcast

# Update .env with the deployed MockToken address
# PAYMENT_TOKEN_ADDRESS=<deployed_address>

# Deploy RondaFactory
forge script script/DeployRondaFactory.s.sol:DeployRondaFactory --fork-url http://localhost:8545 --broadcast

# Update .env with the deployed RondaFactory address
# RONDA_FACTORY_ADDRESS=<deployed_address>
# PENALTY_TOKEN_ADDRESS=<deployed_address>

# Deploy a Ronda Instance
forge script script/DeployRondaInstance.s.sol:DeployRondaInstance --fork-url http://localhost:8545 --broadcast
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

Run all test doing:

bash
```
forge test
```

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