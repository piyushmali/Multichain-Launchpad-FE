# Zero Launchpad UI

A decentralized token launchpad platform enabling seamless token launches across multiple blockchain networks. Built with Next.js and modern web technologies, Zero Launchpad provides a user-friendly interface for token creators and investors.

## 🚀 Features

### For Token Creators
- **Token Registration**
  - Register new tokens for launch
  - Set customizable soft and hard caps
  - Configure token distribution parameters
  - Manage token transfer settings

### For Sale Management
- **Flexible Sale Rounds**
  - Create multiple sale rounds with different parameters
  - Set token pricing
  - Define minimum and maximum contribution limits
  - Schedule start and end times
  - Control round activation status

### For Investors
- **Investment Tools**
  - Participate in active token sales
  - Track investment history
  - Monitor vesting schedules
  - Claim vested tokens when available

### Platform Features
- **Multi-Chain Support**
  - Support for multiple EVM-compatible networks
  - Solana blockchain integration
  - Seamless network switching
  - Cross-chain compatibility

- **Wallet Integration**
  - MetaMask support for EVM chains
  - Phantom Wallet integration for Solana
  - Secure transaction handling
  - Real-time balance updates

## 🛠 Technology Stack

- **Frontend Framework**: Next.js 15.1.6
- **Smart Contract Integration**: ethers.js 5.7.2
- **Styling**: TailwindCSS 3.4.1
- **Language**: TypeScript
- **State Management**: React Hooks
- **Blockchain Connectivity**: 
  - Web3 Provider
  - Solana Web3.js

## 📦 Installation

1. **Clone the Repository**
```bash
git clone <repository-url>
cd evm-launchpad-ui
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Access the Application**
- Open [http://localhost:3000](http://localhost:3000)
- Connect your wallet
- Start interacting with the platform

## 🏗 Project Structure

```
evm-launchpad-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application component
│   │   └── layout.tsx        # Root layout with providers
│   ├── config/
│   │   └── chains.ts         # Network configurations
│   ├── contracts/
│   │   ├── EVMLaunchpad.json # EVM contract ABI
│   │   └── ERC20_ABI.json   # Token standard ABI
│   ├── types/
│   │   └── ethereum.ts       # TypeScript definitions
│   └── utils/
│       └── solana.ts         # Solana utilities
├── public/                   # Static assets
└── ...configuration files
```

## 💡 Usage Guide

### Token Launch Process
1. **Registration**
   - Connect wallet
   - Enter token contract address
   - Set sale parameters
   - Configure caps

2. **Sale Round Setup**
   - Create sale round
   - Set token price
   - Define contribution limits
   - Schedule the round

3. **Sale Management**
   - Activate rounds
   - Monitor progress
   - Manage token distribution
   - Handle vesting schedules

### Investment Process
1. **Participation**
   - Browse active sales
   - Select investment amount
   - Confirm transaction
   - Track investment

2. **Token Claims**
   - View vesting schedule
   - Check claimable amounts
   - Execute claims
   - Monitor token balance

## 🔧 Development

### Available Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
NEXT_PUBLIC_INFURA_ID=your_infura_id
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](docs/README.md)
- [Issue Tracker](issues)
- [Project Homepage](https://your-project-homepage.com)

