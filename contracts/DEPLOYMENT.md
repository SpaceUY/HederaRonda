# RONDA Deployment Guide

This guide will help you deploy the RONDA system to Hedera Testnet using the simplified, non-upgradeable architecture.

## Prerequisites

1. **Hedera Account**: Create an account at [portal.hedera.com](https://portal.hedera.com)
2. **HBAR**: Get testnet HBAR from the Hedera portal
3. **Private Key**: Export your private key from your Hedera wallet
4. **Foundry**: Install Foundry for smart contract development

## Environment Setup

1. **Copy environment template**:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your credentials**:
   ```bash
   # Your Hedera private key (same format as Ethereum)
   PRIVATE_KEY=0xyour-private-key-here
   
   # Your Hedera account ID
   HEDERA_ACCOUNT_ID=0.0.your-account-id
   
   # Hedera Testnet RPC (this is correct)
   HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
   ```

## Deployment Steps

### 1. Compile Contracts
```bash
forge build
```

### 2. Deploy to Hedera Testnet
```bash
forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

### 3. Update Frontend Configuration

After deployment, you'll get contract addresses. Update these files:

#### `frontend/src/constants/network-config.ts`
```typescript
export const NETWORKS: NetworkConfigs = {
  296: {
    name: 'Hedera Testnet',
    chainId: 296,
    rondaFactoryAddress: 'YOUR_FACTORY_ADDRESS',
    penaltyTokenAddress: 'YOUR_RONDASBT_ADDRESS',
    mainTokenAddress: '0x01Ac06943d2B8327a7845235Ef034741eC1Da352', // Native HBAR
    rondaSenderAddress: '0x0000000000000000000000000000000000000000', // Not used
    isTestnet: true,
  },
};
```

#### `frontend/src/lib/contracts.ts`
```typescript
export const CONTRACT_ADDRESSES = {
  PROXY_FACTORY: "YOUR_FACTORY_ADDRESS",
  PENALTY_TOKEN: "YOUR_RONDASBT_ADDRESS",
  MOCK_USDC: "0xdEEa7Fe28c04315CFfe83c28eEF56A01A3E8d642"
} as const;
```

## Architecture Overview

```
┌─────────────────┐
│   HEDERA        │
│   TESTNET       │
│                 │
│ • RondaSBT      │ ← Penalty Token (Soulbound)
│ • RondaFactory  │ ← Simple Factory (Non-upgradeable)
│ • Ronda Instances│ ← Individual Rondas
└─────────────────┘
```

## What Gets Deployed

1. **RondaSBT**: Soulbound token for tracking penalties
2. **RondaFactorySimple**: Simple factory contract for creating Rondas
3. **Ownership Transfer**: RondaSBT ownership transferred to factory

## Testing the Deployment

### 1. Test Ronda Creation
```bash
FACTORY_ADDRESS=YOUR_FACTORY_ADDRESS forge script script/TestCreateRonda.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

### 2. Test Frontend
1. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Connect to Hedera Testnet** in your wallet
3. **Create a new Ronda** to test the factory
4. **Join the Ronda** to test the system

## Contract Addresses

### Current Deployment (Example)
- **RondaSBT**: `0x7fbd1e4f7fc00e3436d9050b700f5e173b23bf0b`
- **RondaFactorySimple**: `0x1ec9d4d0a2da2dee54652d46ad3d93c87c8397d8`

### Important Notes
- These are **testnet addresses** - don't use on mainnet
- The factory is **non-upgradeable** for maximum transparency
- All contracts use **simple architecture** without proxy patterns

## Troubleshooting

### Common Issues

1. **"OwnableUnauthorizedAccount"**: Ownership not properly set
   - Solution: Ensure ownership is transferred correctly after deployment

2. **"Not enough HBAR"**: Insufficient gas fees
   - Solution: Get more testnet HBAR from the portal

3. **"Wrong network"**: Connected to wrong network
   - Solution: Switch to Hedera Testnet (Chain ID: 296)

4. **"ABI mismatch"**: Frontend using wrong contract interface
   - Solution: Ensure frontend uses `RONDA_FACTORY_ABI` from `ronda-factory-abi.ts`

### Gas Settings
- **Gas Price**: 1 Gwei (1000000000 wei) - required for Hedera
- **Legacy Mode**: Use `--legacy` flag for compatibility

### Verification

Check your deployment on [HashScan Testnet](https://hashscan.io/testnet)

## Scripts Overview

### Available Scripts
- `DeployHedera.s.sol`: Main deployment script
- `TestCreateRonda.s.sol`: Test Ronda creation
- `DeployMockToken.s.sol`: Deploy mock tokens for testing

### Script Usage Examples
```bash
# Deploy contracts
forge script script/DeployHedera.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy

# Test Ronda creation
FACTORY_ADDRESS=0x1ec9d4d0a2da2dee54652d46ad3d93c87c8397d8 forge script script/TestCreateRonda.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy

# Deploy mock token
forge script script/DeployMockToken.s.sol --rpc-url https://testnet.hashio.io/api --broadcast --gas-price 1000000000 --legacy
```

## Notes

- This deployment creates a **fresh system** with no existing Rondas
- The **simple architecture** provides maximum transparency and trust
- All operations happen on **Hedera Testnet only**
- **No proxy patterns** - contracts are non-upgradeable for simplicity
- **Fast deployment** - single script deploys everything needed 