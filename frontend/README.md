# RONDA Web3 - Decentralized Rotating Savings Platform

A modern, decentralized platform for rotating savings groups (RONDAs) built with Next.js 14, TypeScript, and Web3 technologies, deployed on Hedera blockchain.

## 🏗️ Project Architecture

This project follows a clean, scalable architecture with strict TypeScript configurations and modern React best practices, integrated with Web3 technologies.

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Wagmi, Viem, RainbowKit for blockchain integration
- **Blockchain**: Hedera Testnet (Chain ID: 296)
- **Development**: ESLint + Prettier with strict rules
- **Architecture**: Component-based with hooks and utilities

### Project Structure

```
src/
├── app/                    # Next.js 14 app router
│   ├── dashboard/         # Dashboard page
│   ├── create/           # Ronda creation page
│   ├── auth/             # Authentication page
│   └── group/            # Group pages (dynamic routes)
│       └── [id]/
│           └── contribute/  # Contribution page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── factory/          # Ronda creation components
│   ├── group/            # Group management components
│   ├── penalty/          # Penalty system components
│   ├── wallet/           # Wallet integration components
│   └── common/           # Shared components
├── hooks/                # Custom React hooks
│   ├── use-factory-contract.ts    # Factory contract interactions
│   ├── use-ronda-contracts.ts     # Ronda contract interactions
│   ├── use-single-ronda-contract.ts # Single Ronda interactions
│   └── use-wallet-info.ts         # Wallet information
├── lib/                  # Utilities and configurations
│   ├── contracts.ts      # Contract addresses and ABIs
│   └── wagmi.ts          # Wagmi configuration
├── constants/            # Application constants and ABIs
│   └── abis/             # Smart contract ABIs
├── types/                # TypeScript type definitions
├── providers/            # Context providers
└── styles/               # Global styles and themes
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Hedera Testnet account
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ronda-web3/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Update contract addresses (after deployment):

Update `src/lib/contracts.ts` and `src/constants/network-config.ts` with your deployed contract addresses.

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔗 Web3 Integration

### Wallet Connection

The application supports:
- **MetaMask**: Most popular Ethereum wallet
- **RainbowKit**: Modern wallet connection interface
- **Hedera Testnet**: Chain ID 296

### Smart Contract Integration

- **Factory Contract**: Creates new Ronda groups
- **Ronda Contracts**: Individual savings circle contracts
- **SBT Token**: Penalty tracking system

### Network Configuration

```typescript
// Hedera Testnet Configuration
export const NETWORKS: NetworkConfigs = {
  296: {
    name: 'Hedera Testnet',
    chainId: 296,
    rondaFactoryAddress: '0x1ec9d4d0a2da2dee54652d46ad3d93c87c8397d8',
    penaltyTokenAddress: '0x7fbd1e4f7fc00e3436d9050b700f5e173b23bf0b',
    mainTokenAddress: '0x01Ac06943d2B8327a7845235Ef034741eC1Da352', // Native HBAR
    isTestnet: true,
  },
};
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript compiler check
- `npm run check-all` - Run all checks (types, lint, format)

## 🎨 Design System

### Color Palette

The application uses a professional financial color scheme optimized for trust and usability:

- **Primary**: Professional blue (`hsl(221, 83%, 53%)`)
- **Success**: Financial green (`hsl(142, 76%, 36%)`)
- **Warning**: Attention orange (`hsl(38, 92%, 50%)`)
- **Destructive**: Error red (`hsl(0, 84%, 60%)`)

### Typography

- **Primary Font**: Inter (clean, modern sans-serif)
- **Monospace Font**: JetBrains Mono (code and financial data)

### Components

All UI components are built using shadcn/ui with custom theming:

- Buttons, Cards, Inputs, Labels
- Alerts, Dialogs, Badges
- Loading states and error boundaries
- Form components with validation
- Web3-specific components (wallet connection, transaction status)

## 🔧 Development Guidelines

### Code Style

This project follows the [SpaceUY React Guidelines](https://spaceuy.github.io/react-guidelines/) with additional strict rules:

- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Strict rules for code quality and consistency
- **Prettier**: Consistent code formatting
- **Import Organization**: Automatic import sorting and organization

### Component Guidelines

1. **Use TypeScript strictly** - All components must be fully typed
2. **Follow naming conventions** - PascalCase for components, camelCase for functions
3. **Implement proper error boundaries** - All async operations should be wrapped
4. **Use custom hooks** - Extract reusable logic into custom hooks
5. **Optimize for accessibility** - Include proper ARIA labels and keyboard navigation
6. **Handle Web3 states** - Loading, error, and success states for blockchain operations

### File Organization

- Keep components focused and under 200 lines
- Use barrel exports (`index.ts`) for clean imports
- Separate concerns into appropriate directories
- Include comprehensive JSDoc comments for complex functions
- Group Web3-related components and hooks together

## 🛠️ Infrastructure

### Error Handling

- **Error Boundaries**: Catch and display React errors gracefully
- **Loading States**: Comprehensive loading and skeleton components
- **Form Validation**: Built-in form validation with proper error display
- **Web3 Errors**: Handle blockchain transaction errors and network issues

### Performance

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Built-in Next.js image optimization
- **Bundle Analysis**: Built-in bundle analyzer for optimization
- **Web3 Optimization**: Efficient contract calls and state management

### Accessibility

- **WCAG Compliance**: Components follow accessibility guidelines
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Web3 Accessibility**: Clear transaction status and wallet connection feedback

## 🔮 Future Development

This foundation is prepared for:

- **Multi-Chain Support**: Ethereum, Polygon, Base networks
- **Enhanced Web3 Features**: Advanced DeFi integrations
- **Database Integration**: User data and transaction storage
- **Authentication**: User account management and security
- **Real-time Features**: WebSocket connections for live updates
- **Mobile App**: React Native integration potential

## 📝 Contributing

1. Follow the established code style and guidelines
2. Run `npm run check-all` before committing
3. Write comprehensive tests for new features
4. Update documentation for significant changes
5. Use conventional commit messages
6. Test Web3 functionality on Hedera Testnet

## 📄 License

This project is private and proprietary. All rights reserved.

---

**RONDA Web3** - Building the future of decentralized savings on Hedera 🚀
