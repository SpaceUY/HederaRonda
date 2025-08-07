# 🌐 RONDA Web3 - Decentralized Rotating Savings Platform

A modern, decentralized platform for rotating savings groups (RONDAs) that brings traditional community savings circles on-chain with transparency, automation, and global scalability.

## 🎯 What is RONDA Web3?

RONDA Web3 digitizes ["tandas" (informal loan clubs)](https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)), community savings circles where participants contribute to a shared pool and take turns receiving payouts. Our platform eliminates traditional trust issues through blockchain automation while preserving the social and economic benefits.

## How does RONDA Web3 work?

A group of participants is formed, each contributing monthly to a shared pool.
Participants take turns receiving payouts based on a predefined schedule.
The system uses smart contracts to automate payments, track contributions, and manage penalties for missed payments.
All transactions are transparent and verifiable on the blockchain.

### 📈 Example RONDA Structure

| Participant | Payout Order | Status |
|-------------|-------------|---------|
| Alice       | 1st         | Paid    |
| Bob         | 2nd         | Paid    |
| Carol       | 3rd         | Pending |
| David       | 4th         | Pending |
| Eve         | 5th         | Pending |

### Key Features
- **Automated Payments**: Smart contracts handle all transactions
- **Penalty System**: SBT tokens track missed payments
- **Transparency**: All data is publicly verifiable
- **No Trust Required**: Code enforces all rules

## 🚀 Project Architecture

### Frontend (`/frontend`)
Modern, responsive web application built with Next.js 14 and TypeScript.

- **Framework**: Next.js 14 with TypeScript and App Router
- **Web3 Integration**: Wagmi, Viem, RainbowKit for wallet connectivity
- **UI/UX**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks for application state

### Smart Contracts (`/contracts`)
Simple, secure smart contracts built with Foundry.

- **Development**: Foundry framework with Solidity
- **Core Logic**: RONDA circles, factory deployment, penalty management
- **Architecture**: Simple, non-upgradeable contracts for maximum trust
- **Deployment**: Hedera Testnet for fast, cost-effective transactions

### Blockchain
- **Network**: Hedera Testnet (Chain ID: 296)
- **Explorer**: HashScan Testnet
- **Benefits**: Fast finality, low fees, EVM compatibility

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry
- Hedera Testnet account

### Deployment
1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd chainlinkronda/contracts
   cp env.example .env
   # Update .env with your Hedera credentials
   ```

2. **Deploy contracts**:
   ```bash
   forge build
   forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
   ```

3. **Update frontend config** with the deployed addresses:
   - Update `frontend/src/lib/contracts.ts` with new contract addresses
   - Update `frontend/src/constants/network-config.ts` with new addresses

4. **Start frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

📖 **For detailed deployment instructions, see [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md)**

## 📁 Repository Structure

```
RONDA-web3/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App router pages and layouts
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── create/         # Ronda creation page
│   │   │   ├── auth/           # Authentication page
│   │   │   └── group/          # Group pages (dynamic routes)
│   │   │       └── [id]/
│   │   │           └── contribute/  # Contribution page for a group
│   │   ├── components/         # UI and feature components (by domain)
│   │   ├── hooks/              # Custom hooks for contract and app logic
│   │   ├── lib/                # Utilities and contract configs
│   │   ├── utils/              # General utilities
│   │   ├── constants/          # App-wide constants and ABIs
│   │   ├── types/              # TypeScript types
│   │   ├── providers/          # Context and providers
│   │   ├── sections/           # Page sections
│   │   ├── styles/             # Global and modular styles
│   │   └── local-data/         # Static/local data
│   ├── public/                 # Static assets
│   └── ...                     # Config, scripts, etc.
│
└── contracts/                  # Solidity smart contracts (Foundry)
    ├── src/                    # Core contract source files
    │   ├── Ronda.sol           # Main RONDA contract
    │   ├── RondaFactorySimple.sol  # Factory for creating RONDAs
    │   └── RondaSBT.sol        # Penalty token (Soulbound Token)
    ├── test/                   # Foundry test suite
    ├── script/                 # Deployment scripts
    │   ├── DeployHedera.s.sol  # Main deployment script
    │   ├── TestCreateRonda.s.sol # Test script for creating RONDAs
    │   └── DeployMockToken.s.sol # Mock token deployment
    └── lib/                    # External dependencies (OpenZeppelin, etc)
```

## 🛡️ Security

### Smart Contract Security
- **Simple Architecture**: Non-upgradeable contracts for maximum transparency
- **Foundry Testing**: Comprehensive test coverage
- **OpenZeppelin**: Battle-tested libraries and patterns
- **Penalty System**: SBT tokens prevent abuse

### Economic Security
- **Automated Penalties**: Smart contracts enforce rules
- **Transparent Operations**: All data on-chain
- **No Trust Required**: Code is law

## 🔮 Roadmap

### 🤖 Enhanced Automation
- Automated payment delivery
- Smart contract-based milestone tracking
- Reduced manual intervention

### 🛡️ Identity & Reputation
- Enhanced identity verification
- Credit score system for participants
- Positive reputation tracking

### 💰 Asset Support
- Support for various payment tokens
- Interest-bearing asset integration
- Cross-chain compatibility

### 🌐 Multi-Chain Expansion
- Ethereum mainnet deployment
- Polygon integration
- Base network support

### 🗳️ Community Governance
- DAO governance structure
- Community voting on protocol changes
- Decentralized decision making

---

**RONDA Web3** - Democratizing access to community-based finance 🚀