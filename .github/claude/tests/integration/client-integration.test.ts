import fetchMock from 'jest-fetch-mock'
import HttpChainClient from '../../lib/http-chain-client'
import HttpCachingChain from '../../lib/http-caching-chain'
import FastestNodeClient from '../../lib/fastest-node-client'
import MultiBeaconNode from '../../lib/multi-beacon-node'
import { fetchBeacon, fetchBeaconByTime, watch, defaultChainOptions } from '../../lib/index'
import { mockChainInfo, mockRandomnessBeacon } from '../data'

beforeAll(() => {
  fetchMock.enableMocks()
})

afterAll(() => {
  fetchMock.disableMocks()
})

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Client Integration Tests', () => {
  describe('HttpChainClient Integration', () => {
    let client: HttpChainClient
    let chain: HttpCachingChain

    beforeEach(() => {
      chain = new HttpCachingChain('https://api.example.com')
      client = new HttpChainClient(chain)
    })

    it('should fetch beacon and validate through complete pipeline', async () => {
      const beacon = mockRandomnessBeacon(1)
      fetchMock.mockResponses(
        [JSON.stringify(mockChainInfo), { status: 200 }],
        [JSON.stringify(beacon), { status: 200 }]
      )

      const result = await fetchBeacon(client, 1)
      expect(result).toEqual(beacon)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('should handle beacon verification in integration flow', async () => {
      const beacon = mockRandomnessBeacon(1)
      const options = { ...defaultChainOptions, disableBeaconVerification: true }
      const clientWithoutVerification = new HttpChainClient(chain, options)
      
      fetchMock.mockResponses(
        [JSON.stringify(mockChainInfo), { status: 200 }],
        [JSON.stringify(beacon), { status: 200 }]
      )

      const result = await fetchBeacon(clientWithoutVerification, 1)
      expect(result).toEqual(beacon)
    })

    it('should fetch beacon by time correctly', async () => {
      const beacon = mockRandomnessBeacon(2)
      const time = mockChainInfo.genesis_time * 1000 + mockChainInfo.period * 1000
      
      fetchMock.mockResponses(
        [JSON.stringify(mockChainInfo), { status: 200 }],
        [JSON.stringify(beacon), { status: 200 }]
      )

      const result = await fetchBeaconByTime(client, time)
      expect(result).toEqual(beacon)
    })

    it('should handle network errors gracefully', async () => {
      fetchMock.mockReject(new Error('Network error'))

      await expect(client.latest()).rejects.toThrow('Network error')
    })

    it('should handle HTTP errors gracefully', async () => {
      fetchMock.mockResponseOnce('Server Error', { status: 500 })

      await expect(client.latest()).rejects.toThrow('Error response fetching')
    })
  })

  describe('FastestNodeClient Integration', () => {
    let fastestClient: FastestNodeClient

    beforeEach(() => {
      fastestClient = new FastestNodeClient([
        'https://api.example1.com',
        'https://api.example2.com',
        'https://api.example3.com'
      ])
    })

    afterEach(() => {
      fastestClient.stop()
    })

    it('should work with single URL without speed testing', async () => {
      const singleUrlClient = new FastestNodeClient(['https://api.example.com'])
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      fetchMock.mockResponseOnce(JSON.stringify(mockRandomnessBeacon(1)))
      
      const result = await singleUrlClient.latest()
      expect(result).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('single base URL'))
      
      consoleSpy.mockRestore()
    })

    it('should start speed testing with multiple URLs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      fastestClient.start()
      expect(fastestClient.speedTests.length).toBe(3)
      
      consoleSpy.mockRestore()
    })

    it('should choose fastest node based on speed test results', async () => {
      fetchMock.mockResponse(JSON.stringify(mockChainInfo))
      
      fastestClient.start()
      
      // Simulate speed test completion
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const current = fastestClient.current()
      expect(current).toBeDefined()
      expect(current.baseUrl).toContain('api.example')
    })

    it('should handle speed test failures', async () => {
      fetchMock.mockReject(new Error('Connection failed'))
      
      fastestClient.start()
      
      // Speed tests should handle failures gracefully
      const current = fastestClient.current()
      expect(current).toBeDefined()
    })
  })

  describe('MultiBeaconNode Integration', () => {
    let multiNode: MultiBeaconNode

    beforeEach(() => {
      multiNode = new MultiBeaconNode('https://multi.example.com')
    })

    it('should fetch multiple chains', async () => {
      const chainHashes = ['hash1', 'hash2', 'hash3']
      fetchMock.mockResponseOnce(JSON.stringify(chainHashes))

      const chains = await multiNode.chains()
      expect(chains).toHaveLength(3)
      expect(chains[0].baseUrl).toContain('hash1')
    })

    it('should handle health check success', async () => {
      const healthResponse = { current: 100, expected: 100 }
      fetchMock.mockResponseOnce(JSON.stringify(healthResponse), { status: 200 })

      const health = await multiNode.health()
      expect(health).toEqual({
        status: 200,
        current: 100,
        expected: 100
      })
    })

    it('should handle health check failure', async () => {
      fetchMock.mockResponseOnce('Service Unavailable', { status: 503 })

      const health = await multiNode.health()
      expect(health).toEqual({
        status: 503,
        current: -1,
        expected: -1
      })
    })

    it('should handle invalid chains response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ invalid: 'response' }))

      await expect(multiNode.chains()).rejects.toThrow('Expected an array')
    })
  })

  describe('Watch Function Integration', () => {
    let client: HttpChainClient
    let controller: AbortController

    beforeEach(() => {
      const chain = new HttpCachingChain('https://api.example.com')
      client = new HttpChainClient(chain)
      controller = new AbortController()
    })

    afterEach(() => {
      controller.abort()
    })

    it('should watch for new beacons', async () => {
      fetchMock.mockResponses(
        [JSON.stringify(mockChainInfo), { status: 200 }],
        [JSON.stringify(mockRandomnessBeacon(1)), { status: 200 }],
        [JSON.stringify(mockRandomnessBeacon(2)), { status: 200 }]
      )

      const beacons: any[] = []
      const watchGenerator = watch(client, controller)
      
      // Collect a few beacons
      for (let i = 0; i < 2; i++) {
        const { value, done } = await watchGenerator.next()
        if (!done) beacons.push(value)
        if (i === 1) controller.abort() // Stop after 2 beacons
      }

      expect(beacons.length).toBe(2)
      expect(beacons[0].round).toBeDefined()
    })

    it('should handle watch errors gracefully', async () => {
      fetchMock.mockReject(new Error('Watch failed'))

      const watchGenerator = watch(client, controller)
      
      await expect(watchGenerator.next()).rejects.toThrow('Watch failed')
    })

    it('should respect abort signal', async () => {
      fetchMock.mockResponse(JSON.stringify(mockChainInfo))
      
      const watchGenerator = watch(client, controller)
      controller.abort() // Abort immediately
      
      const { done } = await watchGenerator.next()
      expect(done).toBe(true)
    })
  })

  describe('Cross-Client Compatibility', () => {
    it('should work with different client types for same chain', async () => {
      const baseUrl = 'https://api.example.com'
      const chain = new HttpCachingChain(baseUrl)
      const httpClient = new HttpChainClient(chain)
      const fastestClient = new FastestNodeClient([baseUrl])
      
      const beacon = mockRandomnessBeacon(1)
      fetchMock.mockResponse(JSON.stringify(beacon))

      try {
        const [httpResult, fastestResult] = await Promise.all([
          httpClient.latest(),
          fastestClient.latest()
        ])

        expect(httpResult).toEqual(fastestResult)
      } finally {
        fastestClient.stop()
      }
    })

    it('should maintain consistent chain info across clients', async () => {
      const baseUrl = 'https://api.example.com'
      const chain1 = new HttpCachingChain(baseUrl)
      const chain2 = new HttpCachingChain(baseUrl)
      
      fetchMock.mockResponse(JSON.stringify(mockChainInfo))

      const [info1, info2] = await Promise.all([
        chain1.info(),
        chain2.info()
      ])

      expect(info1).toEqual(info2)
    })
  })

  describe('Error Recovery and Resilience', () => {
    let client: HttpChainClient

    beforeEach(() => {
      const chain = new HttpCachingChain('https://api.example.com')
      client = new HttpChainClient(chain, defaultChainOptions)
    })

    it('should handle intermittent network failures', async () => {
      const beacon = mockRandomnessBeacon(1)
      
      // First call fails, second succeeds
      fetchMock
        .mockRejectOnce(new Error('Network error'))
        .mockResponseOnce(JSON.stringify(beacon))

      await expect(client.latest()).rejects.toThrow('Network error')
      
      const result = await client.latest()
      expect(result).toEqual(beacon)
    })

    it('should handle malformed JSON responses', async () => {
      fetchMock.mockResponseOnce('invalid json', { status: 200 })

      await expect(client.latest()).rejects.toThrow()
    })

    it('should handle empty responses', async () => {
      fetchMock.mockResponseOnce('', { status: 200 })

      await expect(client.latest()).rejects.toThrow()
    })
  })
})