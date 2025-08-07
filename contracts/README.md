# RONDA Smart Contracts

A decentralized savings circle (Ronda) implementation using Solidity smart contracts for transparent and automated community savings groups.

## Overview

Ronda is a smart contract that implements a traditional savings circle (also known as a "Ronda" or "Tanda") on the blockchain. It provides a simple, secure, and transparent way for communities to organize rotating savings groups.

## Features

- **Simple Architecture**: Non-upgradeable contracts for maximum transparency
- **Automated Payments**: Smart contracts handle all transactions
- **Penalty System**: SBT tokens track missed payments
- **Factory Pattern**: Easy deployment of new Ronda groups
- **Transparent Operations**: All data publicly verifiable on-chain

## Technology Stack

- **Solidity**: ^0.8.20
- **Foundry**: For development, testing, and deployment
- **OpenZeppelin**: For secure contract implementations
- **Hedera Network**: For fast, cost-effective transactions

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/)
- Node.js (for frontend integration)
- Hedera Testnet account

### Installation

```bash
git clone https://github.com/yourusername/ronda.git
cd ronda/contracts
forge install
```

### Testing

```bash
forge test
```

### Deployment

1. Set up your environment variables:
```bash
cp env.example .env
```

2. Configure your deployment parameters in `.env`:
```bash
PRIVATE_KEY=your_hedera_private_key
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
```

3. Deploy the contracts:
```bash
forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

## Contract Architecture

### Core Contracts

- **RondaSBT.sol**: Soulbound token for penalty tracking
- **Ronda.sol**: Main savings circle contract
- **RondaFactorySimple.sol**: Factory contract for deploying new Rondas

### Key Features

#### Simple Ronda Structure
- Participants contribute monthly to a shared pool
- Payouts are distributed in a predefined order
- Smart contracts automate all transactions
- No complex auction or lottery systems

#### Payment Management
- Monthly contributions from all participants
- Automated milestone tracking
- Penalty system for missed payments
- Transparent payment history

#### Penalty System
- SBT tokens for tracking missed payments
- Non-transferable penalty tokens
- Reputation-based access control

## Configuration

### Network Configuration
- **Hedera Testnet**: Chain ID 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Gas Price**: 1 Gwei (1000000000 wei)

### Contract Addresses
After deployment, update the frontend configuration:
- `frontend/src/lib/contracts.ts` - Contract addresses
- `frontend/src/constants/network-config.ts` - Network configuration

## Security Considerations

- **Simple Architecture**: Non-upgradeable contracts for maximum trust
- **Access Control**: Owner-only functions for sensitive operations
- **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard
- **Comprehensive Testing**: Full test coverage with Foundry

## Testing

The test suite covers:
- Contract deployment and initialization
- Participant joining and payment flows
- Penalty and reputation systems
- Edge cases and error conditions

Run tests with:
```bash
forge test
```

## Deployment Scripts

- `DeployHedera.s.sol`: Main deployment script for Hedera
- `TestCreateRonda.s.sol`: Test script for creating Rondas
- `DeployMockToken.s.sol`: Mock token deployment for testing

## Script Usage

### Deploy to Hedera Testnet
```bash
forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

### Test Ronda Creation
```bash
FACTORY_ADDRESS=0x1ec9d4d0a2da2dee54652d46ad3d93c87c8397d8 forge script script/TestCreateRonda.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

## Contract Functions

### RondaFactorySimple
- `createRonda()`: Create a new Ronda group
- `getRondaCount()`: Get total number of Rondas
- `getRondaInstances()`: Get all Ronda addresses
- `deliverRonda()`: Deliver milestone payments (owner only)
- `mintPenalty()`: Mint penalty tokens (owner only)
- `removePenalty()`: Remove penalty tokens (owner only)

### Ronda
- `joinRonda()`: Join a Ronda group
- `currentState()`: Get current Ronda state
- `participantCount()`: Get number of participants
- `monthlyDeposit()`: Get monthly deposit amount
- `joinedParticipants()`: Get list of participants

### RondaSBT
- `mintPenalty()`: Mint penalty token (whitelisted only)
- `burnPenalty()`: Burn penalty token (whitelisted only)
- `balanceOf()`: Check penalty balance
- `addToWhitelist()`: Add address to whitelist (owner only)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details 