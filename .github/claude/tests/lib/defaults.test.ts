import fetchMock from 'jest-fetch-mock'
import {
  defaultClient,
  quicknetClient,
  testnetDefaultClient,
  testnetQuicknetClient,
  DEFAULT_CHAIN_URL,
  DEFAULT_CHAIN_INFO,
  QUICKNET_CHAIN_URL,
  QUICKNET_CHAIN_INFO,
  TESTNET_DEFAULT_CHAIN_URL,
  TESTNET_DEFAULT_CHAIN_INFO,
  TESTNET_QUICKNET_CHAIN_URL,
  TESTNET_QUICKNET_CHAIN_INFO
} from '../../lib/defaults'
import HttpChainClient from '../../lib/http-chain-client'
import HttpCachingChain from '../../lib/http-caching-chain'

beforeAll(() => {
  fetchMock.enableMocks()
})

afterAll(() => {
  fetchMock.disableMocks()
})

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Default Chain Configuration', () => {
  it('should have correct default chain URL', () => {
    expect(DEFAULT_CHAIN_URL).toBe('https://api.drand.sh')
  })

  it('should have valid default chain info structure', () => {
    expect(DEFAULT_CHAIN_INFO).toEqual({
      public_key: expect.any(String),
      period: expect.any(Number),
      genesis_time: expect.any(Number),
      hash: expect.any(String),
      groupHash: expect.any(String),
      schemeID: expect.any(String),
      metadata: expect.any(Object)
    })
  })

  it('should have correct default chain values', () => {
    expect(DEFAULT_CHAIN_INFO.period).toBe(30)
    expect(DEFAULT_CHAIN_INFO.genesis_time).toBe(1595431050)
    expect(DEFAULT_CHAIN_INFO.schemeID).toBe('pedersen-bls-chained')
    expect(DEFAULT_CHAIN_INFO.metadata.beaconID).toBe('default')
  })
})

describe('Quicknet Chain Configuration', () => {
  it('should have correct quicknet chain URL', () => {
    expect(QUICKNET_CHAIN_URL).toBe('https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971')
  })

  it('should have valid quicknet chain info structure', () => {
    expect(QUICKNET_CHAIN_INFO).toEqual({
      public_key: expect.any(String),
      period: expect.any(Number),
      genesis_time: expect.any(Number),
      hash: expect.any(String),
      groupHash: expect.any(String),
      schemeID: expect.any(String),
      metadata: expect.any(Object)
    })
  })

  it('should have correct quicknet chain values', () => {
    expect(QUICKNET_CHAIN_INFO.period).toBe(3)
    expect(QUICKNET_CHAIN_INFO.genesis_time).toBe(1692803367)
    expect(QUICKNET_CHAIN_INFO.schemeID).toBe('bls-unchained-g1-rfc9380')
    expect(QUICKNET_CHAIN_INFO.metadata.beaconID).toBe('quicknet')
  })
})

describe('Testnet Chain Configuration', () => {
  it('should have correct testnet default chain URL', () => {
    expect(TESTNET_DEFAULT_CHAIN_URL).toBe('https://pl-us.testnet.drand.sh')
  })

  it('should have valid testnet default chain info', () => {
    expect(TESTNET_DEFAULT_CHAIN_INFO).toEqual({
      public_key: expect.any(String),
      period: 25,
      genesis_time: 1590445175,
      hash: expect.any(String),
      groupHash: expect.any(String),
      schemeID: 'pedersen-bls-chained',
      metadata: {
        beaconID: 'default'
      }
    })
  })

  it('should have valid testnet quicknet chain info', () => {
    expect(TESTNET_QUICKNET_CHAIN_INFO).toEqual({
      public_key: expect.any(String),
      period: 3,
      genesis_time: 1689232296,
      hash: expect.any(String),
      groupHash: expect.any(String),
      schemeID: 'bls-unchained-g1-rfc9380',
      metadata: {
        beaconID: 'quicknet-t'
      }
    })
  })
})

describe('Client Factory Functions', () => {
  beforeEach(() => {
    fetchMock.mockResponseOnce(JSON.stringify(DEFAULT_CHAIN_INFO))
  })

  describe('defaultClient()', () => {
    it('should return an HttpChainClient instance', () => {
      const client = defaultClient()
      expect(client).toBeInstanceOf(HttpChainClient)
    })

    it('should create client with correct chain verification params', () => {
      const client = defaultClient()
      expect(client.options.chainVerificationParams).toEqual({
        chainHash: DEFAULT_CHAIN_INFO.hash,
        publicKey: DEFAULT_CHAIN_INFO.public_key
      })
    })

    it('should have beacon verification enabled by default', () => {
      const client = defaultClient()
      expect(client.options.disableBeaconVerification).toBe(false)
    })

    it('should have caching enabled by default', () => {
      const client = defaultClient()
      expect(client.options.noCache).toBe(false)
    })
  })

  describe('quicknetClient()', () => {
    beforeEach(() => {
      fetchMock.resetMocks()
      fetchMock.mockResponseOnce(JSON.stringify(QUICKNET_CHAIN_INFO))
    })

    it('should return an HttpChainClient instance', () => {
      const client = quicknetClient()
      expect(client).toBeInstanceOf(HttpChainClient)
    })

    it('should create client with correct quicknet verification params', () => {
      const client = quicknetClient()
      expect(client.options.chainVerificationParams).toEqual({
        chainHash: QUICKNET_CHAIN_INFO.hash,
        publicKey: QUICKNET_CHAIN_INFO.public_key
      })
    })
  })

  describe('testnetDefaultClient()', () => {
    beforeEach(() => {
      fetchMock.resetMocks()
      fetchMock.mockResponseOnce(JSON.stringify(TESTNET_DEFAULT_CHAIN_INFO))
    })

    it('should return an HttpChainClient instance', () => {
      const client = testnetDefaultClient()
      expect(client).toBeInstanceOf(HttpChainClient)
    })

    it('should create client with correct testnet verification params', () => {
      const client = testnetDefaultClient()
      expect(client.options.chainVerificationParams).toEqual({
        chainHash: TESTNET_DEFAULT_CHAIN_INFO.hash,
        publicKey: TESTNET_DEFAULT_CHAIN_INFO.public_key
      })
    })
  })

  describe('testnetQuicknetClient()', () => {
    beforeEach(() => {
      fetchMock.resetMocks()
      fetchMock.mockResponseOnce(JSON.stringify(TESTNET_QUICKNET_CHAIN_INFO))
    })

    it('should return an HttpChainClient instance', () => {
      const client = testnetQuicknetClient()
      expect(client).toBeInstanceOf(HttpChainClient)
    })

    it('should create client with correct testnet quicknet verification params', () => {
      const client = testnetQuicknetClient()
      expect(client.options.chainVerificationParams).toEqual({
        chainHash: TESTNET_QUICKNET_CHAIN_INFO.hash,
        publicKey: TESTNET_QUICKNET_CHAIN_INFO.public_key
      })
    })
  })
})

describe('Chain Configuration Validation', () => {
  it('should have unique chain hashes for different networks', () => {
    const hashes = [
      DEFAULT_CHAIN_INFO.hash,
      QUICKNET_CHAIN_INFO.hash,
      TESTNET_DEFAULT_CHAIN_INFO.hash,
      TESTNET_QUICKNET_CHAIN_INFO.hash
    ]
    const uniqueHashes = new Set(hashes)
    expect(uniqueHashes.size).toBe(hashes.length)
  })

  it('should have unique public keys for different networks', () => {
    const publicKeys = [
      DEFAULT_CHAIN_INFO.public_key,
      QUICKNET_CHAIN_INFO.public_key,
      TESTNET_DEFAULT_CHAIN_INFO.public_key,
      TESTNET_QUICKNET_CHAIN_INFO.public_key
    ]
    const uniqueKeys = new Set(publicKeys)
    expect(uniqueKeys.size).toBe(publicKeys.length)
  })

  it('should have valid hex format for public keys', () => {
    const hexRegex = /^[a-fA-F0-9]+$/
    expect(DEFAULT_CHAIN_INFO.public_key).toMatch(hexRegex)
    expect(QUICKNET_CHAIN_INFO.public_key).toMatch(hexRegex)
    expect(TESTNET_DEFAULT_CHAIN_INFO.public_key).toMatch(hexRegex)
    expect(TESTNET_QUICKNET_CHAIN_INFO.public_key).toMatch(hexRegex)
  })

  it('should have valid hex format for chain hashes', () => {
    const hexRegex = /^[a-fA-F0-9]+$/
    expect(DEFAULT_CHAIN_INFO.hash).toMatch(hexRegex)
    expect(QUICKNET_CHAIN_INFO.hash).toMatch(hexRegex)
    expect(TESTNET_DEFAULT_CHAIN_INFO.hash).toMatch(hexRegex)
    expect(TESTNET_QUICKNET_CHAIN_INFO.hash).toMatch(hexRegex)
  })

  it('should have positive periods for all chains', () => {
    expect(DEFAULT_CHAIN_INFO.period).toBeGreaterThan(0)
    expect(QUICKNET_CHAIN_INFO.period).toBeGreaterThan(0)
    expect(TESTNET_DEFAULT_CHAIN_INFO.period).toBeGreaterThan(0)
    expect(TESTNET_QUICKNET_CHAIN_INFO.period).toBeGreaterThan(0)
  })

  it('should have valid genesis times for all chains', () => {
    expect(DEFAULT_CHAIN_INFO.genesis_time).toBeGreaterThan(0)
    expect(QUICKNET_CHAIN_INFO.genesis_time).toBeGreaterThan(0)
    expect(TESTNET_DEFAULT_CHAIN_INFO.genesis_time).toBeGreaterThan(0)
    expect(TESTNET_QUICKNET_CHAIN_INFO.genesis_time).toBeGreaterThan(0)
  })
})