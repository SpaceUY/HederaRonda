# RONDA Web3 - Decentralized Rotating Savings Platform

A moderns, decentralized platform for rotating savings groups (RONDAs) built with Next.js 14, TypeScript, and Web3 technologies.

## 🏗️ Project Architecture

This project follows a clean, scalable architecture with strict TypeScript configurations and modern React best practices.

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Development**: ESLint + Prettier with strict rules
- **Architecture**: Component-based with hooks and utilities

### Project Structure

```
src/
├── app/                    # Next.js 14 app router
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── forms/             # Form components
│   └── common/            # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── styles/                # Global styles and themes
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ronda-web3
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

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

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

### File Organization

- Keep components focused and under 200 lines
- Use barrel exports (`index.ts`) for clean imports
- Separate concerns into appropriate directories
- Include comprehensive JSDoc comments for complex functions

## 🛠️ Infrastructure

### Error Handling

- **Error Boundaries**: Catch and display React errors gracefully
- **Loading States**: Comprehensive loading and skeleton components
- **Form Validation**: Built-in form validation with proper error display

### Performance

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Built-in Next.js image optimization
- **Bundle Analysis**: Built-in bundle analyzer for optimization

### Accessibility

- **WCAG Compliance**: Components follow accessibility guidelines
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

## 🔮 Future Development

This foundation is prepared for:

- **Web3 Integration**: Blockchain connectivity and smart contracts
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

## 📄 License

This project is private and proprietary. All rights reserved.

---

**RONDA Web3** - Building the future of decentralized savings 🚀
