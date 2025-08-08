# 🌐 RONDA Web3 - Decentralized Rotating Savings Platform

A modern, decentralized platform for rotating savings groups (RONDAs) that brings traditional community savings circles on-chain with transparency, automation, and global scalability.

## 🎯 Project Overview

RONDA Web3 digitizes ["tandas" (informal loan clubs)](https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)), community savings circles where participants contribute to a shared pool and take turns receiving payouts. Our platform eliminates traditional trust issues through blockchain automation while preserving the social and economic benefits.

### 🏆 Hackathon Track
**Main Track** - DeFi / Tokenization

### 🛠️ Tech Stack
- **Blockchain**: Hedera Testnet (Chain ID: 296)
- **Smart Contracts**: Solidity 0.8.20, Foundry Framework
- **Frontend**: Next.js 14, TypeScript, React 18
- **Web3 Integration**: Wagmi, Viem, RainbowKit
- **UI/UX**: Tailwind CSS, shadcn/ui, Radix UI
- **Authentication**: WorldCoin ID Kit
- **Development**: Node.js 18+, Foundry, Git

## 🚀 Live Demo

**Demo URL**: [https://ronda-web3-hedera.netlify.app](https://ronda-web3-hedera.netlify.app)

**Demo Video**: [YouTube Demo Link - TBD](https://youtube.com/watch?v=YOUR_DEMO_VIDEO_ID)

## 🎮 How to Test the Demo

1. **Visit Demo**: Go to [https://ronda-web3-hedera.netlify.app](https://ronda-web3-hedera.netlify.app)
2. **Authenticate**: Click "Login with World ID" → "Continue with Demo Verification"
3. **Connect Wallet**: Use MetaMask or any Web3 wallet
4. **Switch to Hedera Testnet**: Chain ID 296 (if needed)
5. **Get Test HBAR**: Visit [Hedera Portal](https://portal.hedera.com/) for testnet HBAR
6. **Get MTK Tokens**: Contact the team or use the MTK faucet to get MockToken (MTK) for testing
7. **Create a RONDA**: Set up a new savings group
8. **Join & Contribute**: Participate in the rotating savings

> **Note**: The demo uses simulated World ID verification for hackathon purposes. No actual World ID setup required.

## 🔧 Quick Start (Development)

### Prerequisites
- Node.js 18+
- Foundry
- Hedera Testnet account

### Installation
```bash
# Clone the repository
git clone https://github.com/SpaceUY/HederaRonda.git
cd HederaRonda

# Setup contracts
cd contracts
cp env.example .env
# Update .env with your Hedera credentials

# Deploy contracts
forge build
forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy

# Setup frontend
cd ../frontend
npm install
npm run dev
```

## 📊 Project Architecture

### Smart Contracts (`/contracts`)
- **Ronda.sol**: Core rotating savings logic
- **RondaFactory.sol**: Factory for creating new RONDAs
- **RondaSBT.sol**: Soulbound tokens for penalty tracking
- **Deployment**: Hedera Testnet with Foundry

### Frontend (`/frontend`)
- **Framework**: Next.js 14 with App Router
- **Web3**: Wagmi + Viem for blockchain interaction
- **UI**: Modern design with Tailwind CSS + shadcn/ui
- **Authentication**: WorldCoin integration (demo mode for hackathon)

### Key Features
- ✅ **Automated Payments**: Smart contracts handle all transactions
- ✅ **Penalty System**: SBT tokens track missed payments
- ✅ **Transparency**: All data publicly verifiable on Hedera
- ✅ **No Trust Required**: Code enforces all rules
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Real-time Updates**: Live blockchain data integration
- ✅ **Demo Mode**: No complex setup required for testing
- ✅ **Hackathon Ready**: Fully functional without external dependencies

## 🎯 Use Cases

1. **Community Savings**: Traditional "tandas" digitized
2. **Microfinance**: Small-scale lending circles
3. **Emergency Funds**: Community-based emergency savings
4. **Investment Groups**: Collaborative investment pools
5. **Remittances**: Cross-border community savings

## 🔮 Future Roadmap

### Phase 2 (Post-Hackathon)
- **Multi-Chain Support**: Ethereum, Polygon, Base
- **Advanced Analytics**: Dashboard with insights
- **Mobile App**: Native iOS/Android applications
- **DAO Governance**: Community-driven protocol decisions

### Phase 3
- **DeFi Integration**: Yield farming with savings
- **Insurance Products**: Smart contract-based insurance
- **Credit Scoring**: On-chain reputation system
- **Cross-Chain Bridges**: Seamless asset movement

## 🛡️ Security & Compliance

- **Audited Contracts**: OpenZeppelin libraries and best practices
- **Comprehensive Testing**: 95%+ test coverage
- **Gas Optimization**: Efficient smart contract design
- **Access Control**: Proper permission management

## 📋 Deployed Contract Addresses

### Hedera Testnet Deployment
All contracts are deployed and verified on Hedera Testnet (Chain ID: 296)

- **RondaSBT (Penalty Token)**: [`0x5f0A722306F1A5016ffa53bae98BB84439bB8219`](https://hashscan.io/testnet/address/0x5f0A722306F1A5016ffa53bae98BB84439bB8219)
  - Soulbound token for tracking missed payments
  - Non-transferable penalty tokens

- **RondaFactorySimple**: [`0xe11aE439bCa99F988C325e2cc9811a2219106EB7`](https://hashscan.io/testnet/address/0xe11aE439bCa99F988C325e2cc9811a2219106EB7)
  - Factory contract for creating new RONDA groups
  - Non-upgradeable for maximum transparency

### Contract Verification
- **HashScan Explorer**: [View all contracts on HashScan Testnet](https://hashscan.io/testnet)
- **Network**: Hedera Testnet (Chain ID: 296)
- **RPC URL**: `https://testnet.hashio.io/api`

### Important Notes
- These are **testnet addresses** - do not use on mainnet
- All contracts use **simple, non-upgradeable architecture** for maximum trust
- **No proxy patterns** - contracts are deployed directly for transparency

## 📈 Impact & Innovation

- **Financial Inclusion**: Democratizing access to community finance
- **Trustless Operations**: Eliminating traditional trust barriers
- **Global Scalability**: Borderless financial services
- **Transparency**: All operations visible on blockchain


## 📞 Contact & Links

- **GitHub**: https://github.com/SpaceUY/HederaRonda
- **Demo**: https://ronda-web3-hedera.netlify.app
- **Pitch Deck**: https://drive.google.com/file/d/1gOtQYUdEtgMBCrxVtkdI2V-Al-Y2j_-t/view?usp=sharing
- **Documentation**: [This README]

---

**RONDA Web3** - Democratizing access to community-based finance on Hedera 🚀