# 🌐 RONDA Web3 - Decentralized Rotating Savings Platform

A modern, decentralized platform for rotating savings groups (RONDAs) that brings traditional community savings circles on-chain with transparency, automation, and global scalability.

## 🎯 What is RONDA Web3?

RONDA Web3 digitizes ["tandas" (informal loan clubs)](https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)), community savings circles where participants contribute to a shared pool and take turns receiving payouts. Our platform eliminates traditional trust issues through blockchain automation while preserving the social and economic benefits.

## How does RONDA Web3 work?

A group of 10 people is formed, each contributing monthly (e.g., $100).
An auction is held for the early slots (1–4), where those who want the money first pay a commission (%). Each slot guarantees a minimum commission, the rest goes to the protocol.
Slot 5 is neutral, with no cost or gain.
Slots 6–10 are assigned by lottery using Chainlink VRF. These receive the money at the end, but earn interest.
The commissions paid by slots 1–4 go into a common pool and are redistributed to the protocol.


### 📈 Example Distribution

| Slot | Assignment      | Fee / Interest |
|------|----------------|---------------|
| 1    | Auction        | Pays >=+10%   |
| 2    | Auction        | Pays >=+7.5%  |
| 3    | Auction        | Pays >=+5%    |
| 4    | Auction        | Pays >=+2.5%  |
| 5    | Neutral        | 0%            |
| 6    | Neutral        | 0%            |
| 7    | Lottery (VRF)  | Earns +2.5%   |
| 8    | Lottery (VRF)  | Earns +5%     |
| 9    | Lottery (VRF)  | Earns +7.5%   |
| 10   | Lottery (VRF)  | Earns +10%    |


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

- [`contracts/src/Ronda.sol`](contracts/src/Ronda.sol) — **VRF** (randomness), **CCIP** (cross-chain receiver)
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

### 🛡️ Enhanced Identity Security
On-Chain Humanity Validation
Currently, identity verification happens once during signup. We'll implement continuous validation where each transaction requires proving you're the same verified human, regardless of which wallet you use. This prevents bad actors from creating multiple accounts or transferring verified status between wallets.

### 🏆 Credit Score System
Enhanced Reputation with Positive Tokens
Right now, we only mark bad actors. We'll create a full credit history system where good participants earn positive reputation points. Think of it like a blockchain credit score - the more circles you complete successfully, the better rates and access you get.

### 💰 Real-World Asset Support
RWA Integration with Ondo Finance
Instead of just using regular USDC, participants could contribute with assets that earn interest while sitting in the circle pot. For example, tokenized treasury bills that earn 4-5% annually, making the whole circle more profitable for everyone.

### 🌐 Multi-Chain Expansion
Deploy to More Blockchains
Currently limited to Arbitrum and Ethereum. We'll expand to:

- Optimism - Cheaper transactions
- Base - Easy onramp for new crypto users
- Polygon - Established user base

This means people can join circles from whichever blockchain they prefer, increasing participation.

### 🗳️ Community Governance
$RONDA Token and DAO
Give users voting power over important decisions like:

- What fees the platform charges
- Which new features to build first
- How to spend protocol revenue

Token holders vote on proposals, making RONDA truly community-owned rather than controlled by a single team.

---

**RONDA Web3** - Democratizing access to community-based finance 🚀