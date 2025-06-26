# 🌐 RONDA Web3 - Decentralized Rotating Savings Platform

A modern, decentralized platform for rotating savings groups (RONDAs) that brings traditional community savings circles on-chain with transparency, automation, and global scalability.

## 🎯 What is RONDA Web3?

RONDA Web3 digitizes "tandas", "panderos", and community savings circles where participants contribute to a shared pool and take turns receiving payouts. Our platform eliminates traditional trust issues through blockchain automation while preserving the social and economic benefits.

## 🎨 Economic Model

### Slot Distribution
- **Slots 1-4**: Auction-based early access (pay 2.5% - 10% fees)
- **Slot 5**: Neutral slot (no fees or interest)
- **Slot 6**: Neutral slot (no fees or interest)  
- **Slots 7-10**: VRF lottery assignment (earn 2.5% - 10% interest)

### Revenue Streams
- Auction fees from early slot premiums
- Default penalties (3x contribution for re-entry)
- Protocol fees on successful circle completion

## 🚀 Project Architecture

### Frontend (`/frontend`)
The UI is rapidly built and iterated using [Bolt.new](https://bolt.new), enabling fast prototyping and seamless integration with modern Web3 tools. The interface is clean, mobile-friendly, and optimized for onboarding, group management, and real-time RONDA participation.

- **Framework**: Next.js 14 with TypeScript and App Router
- **Web3 Integration**: Wagmi, Viem, RainbowKit for wallet connectivity
- **UI/UX**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for application state

### Smart Contracts (`/contracts`)
- **Development**: Foundry framework with Solidity
- **Core Logic**: RONDA circles, factory deployment, reputation management
- **External Integrations**: Chainlink VRF, CCIP, identity verification

### Supporting Entities
- **Identity Providers**: World ID for Sybil resistance
- **Real world data provider**: Chainlink services for randomness and cross-chain operations


## 📁 Repository Structure

```
RONDA-web3/
├── frontend/                    # Next.js application (Bolt.new UI)
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
│   │   ├── constants/          # App-wide constants
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
    ├── test/                   # Foundry test suite
    ├── script/                 # Deployment/config scripts
    └── lib/                    # External dependencies (OpenZeppelin, Chainlink, etc)
```

## 🔗 Chainlink Usage in Smart Contracts

The following files use Chainlink services (VRF, CCIP):

- [`contracts/src/Ronda.sol`](contracts/src/Ronda.sol) — **VRF** (randomness), **CCIP** (cross-chain)
- [`contracts/src/RondaFactory.sol`](contracts/src/RondaFactory.sol) — **VRF** (subscription management), **CCIP** (management)
- [`contracts/src/RondaSender.sol`](contracts/src/RondaSender.sol) — **CCIP** (message sending)
- [`contracts/script/TransferSubscriptionOwnership.s.sol`](contracts/script/TransferSubscriptionOwnership.s.sol) — **VRF** (subscription transfer)
- [`contracts/test/CCIPChainManagement.t.sol`](contracts/test/CCIPChainManagement.t.sol) — **VRF/CCIP** (testing)
- [`contracts/test/RondaFactory.t.sol`](contracts/test/RondaFactory.t.sol) — **VRF/CCIP** (testing)
- [`contracts/test/CCIPRonda.t.sol`](contracts/test/CCIPRonda.t.sol) — **CCIP** (testing)

## 🛡️ Security

### Identity & Privacy
- Privacy-preserving human verification
- No KYC requirements
- Minimal data collection

### Smart Contract Security
- Foundry test coverage
- Formal verification preparation
- Multi-signature emergency controls

### Economic Security
- Incentive alignment through fee structure
- Social enforcement through reputation
- Automated penalty application

## 🔮 Roadmap

- **MVP:** 10-person RONDAs, Chainlink VRF, CCIP, identity integration
- **Next:** Factory pattern, SBT-based reputation, mobile UI, gas optimizations
- **Planned:** Chainlink Automation for automated payouts

---

**RONDA Web3** - Democratizing access to community-based finance 🚀