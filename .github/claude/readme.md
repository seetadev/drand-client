# drand-client

A robust JavaScript/TypeScript client library for the drand randomness beacon network, providing cryptographically verifiable random numbers with multi-node support and automatic failover capabilities.

## 🚀 Features

- **Multi-Node Support**: Automatically discovers and connects to multiple drand nodes for redundancy
- **Fastest Node Selection**: Intelligent speed testing to automatically use the fastest available node
- **Beacon Verification**: Built-in cryptographic verification of randomness beacons using BLS signatures
- **Caching Support**: HTTP caching with configurable cache control for optimal performance
- **Multiple Chain Support**: Compatible with default, quicknet, and testnet drand chains
- **Universal Compatibility**: Works in browsers, Node.js, and Deno environments
- **TypeScript Ready**: Full TypeScript support with comprehensive type definitions
- **Flexible Transport**: Extensible architecture supporting custom transport implementations
- **Health Monitoring**: Real-time health checks and automatic failover between nodes

## 🛠️ Tech Stack

### Core Technologies
- **TypeScript**: Primary development language with ES2020 target
- **Noble Cryptography**: BLS12-381 and BN254 curve implementations for signature verification
- **Isomorphic Fetch**: Universal HTTP client for cross-platform compatibility

### Development Tools
- **esbuild**: Lightning-fast bundler for ESM and CommonJS builds
- **Jest**: Comprehensive testing framework with TypeScript support
- **ESLint**: Code linting with TypeScript-specific rules
- **TypeScript Compiler**: Declaration file generation and type checking

### Build System
- **Dual Module Support**: Both ESM (.mjs) and CommonJS (.cjs) outputs
- **Browser Compatibility**: Optimized builds for browser environments
- **Node.js Support**: Server-side optimized builds with proper module resolution

## 📁 Project Structure

```
drand-client/
├── lib/                          # Source code
│   ├── beacon-verification.ts    # Cryptographic verification logic
│   ├── defaults.ts              # Default chain configurations
│   ├── fastest-node-client.ts   # Speed-optimized client implementation
│   ├── http-caching-chain.ts    # HTTP caching chain client
│   ├── http-chain-client.ts     # Basic HTTP chain client
│   ├── index.ts                 # Main entry point and type definitions
│   ├── multi-beacon-node.ts     # Multi-node management
│   ├── speedtest.ts             # Network speed testing utilities
│   └── util.ts                  # Common utilities and helpers
├── test/                        # Test suites
│   ├── integration.test.ts      # Integration tests
│   ├── beacon-verification.test.ts
│   └── *.test.ts               # Unit tests for each module
├── build/                       # Generated build outputs
│   ├── esm/                     # ES modules
│   ├── cjs/                     # CommonJS modules
│   └── *.d.ts                   # TypeScript declarations
└── package.json                 # Package configuration
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ (for development)
- npm or yarn package manager
- Modern browser with ES2020 support (for browser usage)

### Installation Steps

#### For Node.js/Bundlers
```bash
npm install drand-client
```

#### For Browser/Deno (CDN)
```javascript
import { HttpCachingChain, HttpChainClient } from 'https://cdn.jsdelivr.net/npm/drand-client/build/esm/index.mjs'
```

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/anisharma07/drand-client.git
cd drand-client

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## 🎯 Usage

### Basic Usage (Browser)

```html
<script type='module'>
import { defaultClient } from 'https://cdn.jsdelivr.net/npm/drand-client/build/esm/index.mjs'

// Get latest randomness beacon
const beacon = await defaultClient().latest()
console.log('Random value:', beacon.randomness)
console.log('Round:', beacon.round)
</script>
```

### Node.js/TypeScript Usage

```typescript
import { HttpChainClient, HttpCachingChain, FastestNodeClient } from 'drand-client'

// Using default drand network
import { defaultClient } from 'drand-client'

async function getRandomness() {
  const client = defaultClient()
  
  // Get latest beacon
  const latest = await client.latest()
  console.log('Latest randomness:', latest.randomness)
  
  // Get specific round
  const specific = await client.get(12345)
  console.log('Round 12345:', specific.randomness)
}

// Using fastest node client with multiple URLs
const fastClient = new FastestNodeClient([
  'https://api.drand.sh',
  'https://api2.drand.sh',
  'https://api3.drand.sh'
])

// Start speed testing (don't forget to stop it!)
fastClient.start()
const beacon = await fastClient.latest()
fastClient.stop()
```

### Deno Usage

```typescript
import { quicknetClient } from 'https://cdn.jsdelivr.net/npm/drand-client/build/esm/index.mjs'

const client = quicknetClient()
const beacon = await client.latest()
console.log('Quicknet randomness:', beacon.randomness)
```

### Advanced Configuration

```typescript
import { HttpChainClient, HttpCachingChain } from 'drand-client'

// Custom chain with verification
const chain = new HttpCachingChain('https://custom-drand-node.com', {
  disableBeaconVerification: false,
  noCache: false,
  chainVerificationParams: {
    chainHash: 'your-chain-hash',
    publicKey: 'your-public-key'
  }
})

const client = new HttpChainClient(chain)
const beacon = await client.latest()
```

## 📱 Platform Support

- **Browsers**: Chrome, Firefox, Safari, Edge (ES2020+ support)
- **Node.js**: Version 16.0.0 and above
- **Deno**: Latest stable version
- **Mobile**: React Native, Ionic (via bundler)
- **Desktop**: Electron applications

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm test -- http-chain-client.test.ts
```

### Test Coverage
The project includes comprehensive tests for:
- Beacon verification and cryptographic functions
- HTTP client implementations
- Multi-node failover scenarios
- Speed testing and optimization
- Integration tests with live drand networks

### Integration Testing
```bash
# Run integration tests (requires network access)
npm test integration.test.ts
```

## 🔄 Deployment

### Building for Production

```bash
# Clean previous builds
npm run clean

# Build all targets
npm run build

# Individual build commands
npm run build:esm      # ES modules
npm run build:cjs      # CommonJS modules
npm run build:types    # TypeScript declarations
```

### Publishing

```bash
# Publish to npm
npm publish

# Publish to GitHub packages
npm run publish:github
```

### CDN Deployment
The package is automatically available via:
- jsDelivr: `https://cdn.jsdelivr.net/npm/drand-client/`
- unpkg: `https://unpkg.com/drand-client/`

## 📊 Performance & Optimization

### Speed Testing
The `FastestNodeClient` automatically benchmarks multiple drand nodes:

```typescript
const client = new FastestNodeClient(urls, {}, 30000) // 30-second intervals
client.start() // Begin background speed tests

// Client automatically uses fastest node
const beacon = await client.latest()

client.stop() // Stop speed testing when done
```

### Caching Strategy
- HTTP caching headers respected by default
- Configurable cache control with `noCache` option
- In-memory chain info caching for improved performance

### Bundle Sizes
- ESM build: Optimized for tree-shaking
- CommonJS build: Node.js optimized
- Browser build: Minimal dependencies, ~50KB gzipped

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow ESLint configuration
- **Testing**: Add tests for new features
- **Documentation**: Update README and JSDoc comments
- **TypeScript**: Maintain strict type safety
- **Compatibility**: Ensure cross-platform compatibility

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npx tsc --noEmit
```

## 📄 License

This project is dual-licensed under:
- [Apache License 2.0](LICENSE-APACHE)
- [MIT License](LICENSE-MIT)

You may choose either license for your use case.

## 🙏 Acknowledgments

- **drand Project**: For providing the randomness beacon network
- **Noble Cryptography**: For excellent BLS curve implementations  
- **Alan Shaw**: Original author and maintainer
- **drand Community**: For network infrastructure and support

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/anisharma07/drand-client/issues)
- **Documentation**: [drand.love](https://drand.love)
- **Community**: [drand Discord/Slack](https://drand.love/community)
- **Security**: Report security issues privately to the maintainers

### Quick Links
- 📖 [API Documentation](https://github.com/anisharma07/drand-client/blob/main/lib/index.ts)
- 🌐 [drand Network Status](https://drand.love/network)
- 🔍 [Example Applications](https://github.com/drand/awesome-drand)

---

*Built with ❤️ for the decentralized randomness community*