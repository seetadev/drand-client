import fetchMock from 'jest-fetch-mock'
import HttpCachingChain from '../../lib/http-caching-chain'
import HttpChainClient from '../../lib/http-chain-client'
import { ChainVerificationParams, ChainOptions, defaultChainOptions } from '../../lib/index'
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

describe('Chain Verification Integration', () => {
  const validVerificationParams: ChainVerificationParams = {
    chainHash: mockChainInfo.hash,
    publicKey: mockChainInfo.public_key
  }

  const invalidVerificationParams: ChainVerificationParams = {
    chainHash: 'invalid_hash',
    publicKey: 'invalid_public_key'
  }

  describe('Successful Chain Verification', () => {
    it('should accept valid chain info', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: validVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      const info = await chain.info()
      expect(info).toEqual(mockChainInfo)
      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/info', {})
    })

    it('should cache validated chain info', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: validVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      // First call
      await chain.info()
      // Second call should use cache
      await chain.info()

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should work with HttpChainClient integration', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: validVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      const client = new HttpChainClient(chain, options)
      const beacon = mockRandomnessBeacon(1)
      
      fetchMock.mockResponses(
        [JSON.stringify(mockChainInfo), { status: 200 }],
        [JSON.stringify(beacon), { status: 200 }]
      )

      const result = await client.latest()
      expect(result).toEqual(beacon)
    })
  })

  describe('Failed Chain Verification', () => {
    it('should reject invalid chain hash', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: 'wrong_hash',
          publicKey: mockChainInfo.public_key
        }
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })

    it('should reject invalid public key', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: mockChainInfo.hash,
          publicKey: 'wrong_public_key'
        }
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })

    it('should reject both invalid hash and public key', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: invalidVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })

    it('should not cache failed verification attempts', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: invalidVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponse(JSON.stringify(mockChainInfo))

      // First call should fail
      await expect(chain.info()).rejects.toThrow('did not match the verification params')
      
      // Second call should also make HTTP request (not use cache)
      await expect(chain.info()).rejects.toThrow('did not match the verification params')

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('Chain Verification with Different Chain Info', () => {
    const alternativeChainInfo = {
      ...mockChainInfo,
      hash: 'alternative_hash',
      public_key: 'alternative_public_key'
    }

    it('should handle multiple chains with different verification params', async () => {
      const chain1Options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: mockChainInfo.hash,
          publicKey: mockChainInfo.public_key
        }
      }

      const chain2Options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: alternativeChainInfo.hash,
          publicKey: alternativeChainInfo.public_key
        }
      }
      
      const chain1 = new HttpCachingChain('https://api1.example.com', chain1Options)
      const chain2 = new HttpCachingChain('https://api2.example.com', chain2Options)
      
      fetchMock
        .mockResponseOnce(JSON.stringify(mockChainInfo))
        .mockResponseOnce(JSON.stringify(alternativeChainInfo))

      const [info1, info2] = await Promise.all([
        chain1.info(),
        chain2.info()
      ])

      expect(info1).toEqual(mockChainInfo)
      expect(info2).toEqual(alternativeChainInfo)
    })

    it('should reject cross-chain verification', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: alternativeChainInfo.hash,
          publicKey: alternativeChainInfo.public_key
        }
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo)) // Wrong chain info

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })
  })

  describe('Chain Verification Edge Cases', () => {
    it('should handle missing chain info fields', async () => {
      const incompleteChainInfo = {
        ...mockChainInfo,
        hash: undefined,
        public_key: undefined
      }
      
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: validVerificationParams
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(incompleteChainInfo))

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })

    it('should handle null verification params', async () => {
      const incompleteChainInfo = {
        ...mockChainInfo,
        hash: null,
        public_key: null
      }
      
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: mockChainInfo.hash,
          publicKey: mockChainInfo.public_key
        }
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(incompleteChainInfo))

      await expect(chain.info()).rejects.toThrow('did not match the verification params')
    })

    it('should handle empty string verification params', async () => {
      const emptyChainInfo = {
        ...mockChainInfo,
        hash: '',
        public_key: ''
      }
      
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: {
          chainHash: '',
          publicKey: ''
        }
      }
      
      const chain = new HttpCachingChain('https://api.example.com', options)
      fetchMock.mockResponseOnce(JSON.stringify(emptyChainInfo))

      const info = await chain.info()
      expect(info).toEqual(emptyChainInfo)
    })
  })

  describe('No Verification Mode', () => {
    it('should accept any chain info when verification is disabled', async () => {
      const chain = new HttpCachingChain('https://api.example.com', defaultChainOptions)
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      const info = await chain.info()
      expect(info).toEqual(mockChainInfo)
    })

    it('should work with malformed chain info when verification is disabled', async () => {
      const malformedChainInfo = {
        invalid_field: 'value',
        missing_required_fields: true
      }
      
      const chain = new HttpCachingChain('https://api.example.com', defaultChainOptions)
      fetchMock.mockResponseOnce(JSON.stringify(malformedChainInfo))

      const info = await chain.info()
      expect(info).toEqual(malformedChainInfo)
    })
  })

  describe('Verification with HTTP Options', () => {
    it('should pass HTTP options during verification', async () => {
      const options: ChainOptions = {
        ...defaultChainOptions,
        chainVerificationParams: validVerificationParams
      }
      
      const httpOptions = {
        userAgent: 'custom-agent',
        headers: { 'Custom-Header': 'value' }
      }
      
      // Using HttpChain directly to test httpOptions parameter
      const { HttpChain } = require('../../lib/http-caching-chain')
      const chain = new HttpChain('https://api.example.com', options, httpOptions)
      
      fetchMock.mockResponseOnce(JSON.stringify(mockChainInfo))

      await chain.info()
      
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/info',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'value',
            'User-Agent': 'custom-agent'
          })
        })
      )
    })
  })
})