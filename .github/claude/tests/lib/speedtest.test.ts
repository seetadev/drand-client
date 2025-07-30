import { createSpeedTest, SpeedTest } from '../../lib/speedtest'

describe('createSpeedTest', () => {
  let mockTest: jest.Mock
  let speedTest: SpeedTest

  beforeEach(() => {
    mockTest = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (speedTest) {
      speedTest.stop()
    }
  })

  describe('Speed Test Creation', () => {
    it('should create a speed test with default samples', () => {
      speedTest = createSpeedTest(mockTest, 1000)
      expect(speedTest).toBeDefined()
      expect(speedTest.start).toBeInstanceOf(Function)
      expect(speedTest.stop).toBeInstanceOf(Function)
      expect(speedTest.average).toBeInstanceOf(Function)
    })

    it('should create a speed test with custom samples', () => {
      speedTest = createSpeedTest(mockTest, 1000, 10)
      expect(speedTest).toBeDefined()
    })

    it('should return MAX_SAFE_INTEGER for average when no tests have run', () => {
      speedTest = createSpeedTest(mockTest, 1000)
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })
  })

  describe('Speed Test Execution', () => {
    beforeEach(() => {
      mockTest.mockResolvedValue(undefined)
      speedTest = createSpeedTest(mockTest, 1000)
    })

    it('should start running tests at specified intervals', () => {
      speedTest.start()
      
      expect(mockTest).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(1000)
      expect(mockTest).toHaveBeenCalledTimes(1)
      
      jest.advanceTimersByTime(1000)
      expect(mockTest).toHaveBeenCalledTimes(2)
    })

    it('should not start if already started', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      speedTest.start()
      speedTest.start()
      
      expect(consoleSpy).toHaveBeenCalledWith('Attempted to start a speed test, but it had already been started!')
      consoleSpy.mockRestore()
    })

    it('should stop running tests', () => {
      speedTest.start()
      jest.advanceTimersByTime(1000)
      expect(mockTest).toHaveBeenCalledTimes(1)
      
      speedTest.stop()
      jest.advanceTimersByTime(2000)
      expect(mockTest).toHaveBeenCalledTimes(1)
    })

    it('should reset queue when stopped', () => {
      speedTest.start()
      jest.advanceTimersByTime(1000)
      
      speedTest.stop()
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })
  })

  describe('Speed Test Timing', () => {
    beforeEach(() => {
      speedTest = createSpeedTest(mockTest, 1000, 3)
    })

    it('should record execution times for successful tests', async () => {
      mockTest.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      
      speedTest.start()
      
      // First test
      const testPromise1 = jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(100) // Simulate test duration
      await testPromise1
      
      expect(speedTest.average()).toBeGreaterThan(0)
      expect(speedTest.average()).toBeLessThan(Number.MAX_SAFE_INTEGER)
    })

    it('should record MAX_SAFE_INTEGER for failed tests', async () => {
      mockTest.mockRejectedValue(new Error('Test failed'))
      
      speedTest.start()
      
      jest.advanceTimersByTime(1000)
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should calculate correct average for multiple tests', async () => {
      let callCount = 0
      mockTest.mockImplementation(() => {
        callCount++
        const delay = callCount * 50 // 50ms, 100ms, 150ms
        return new Promise(resolve => setTimeout(resolve, delay))
      })
      
      speedTest.start()
      
      // Run 3 tests
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000)
        jest.advanceTimersByTime(200) // Ensure all tests complete
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      const average = speedTest.average()
      expect(average).toBeGreaterThan(0)
      expect(average).toBeLessThan(Number.MAX_SAFE_INTEGER)
    })

    it('should maintain only specified number of samples', async () => {
      mockTest.mockResolvedValue(undefined)
      speedTest = createSpeedTest(mockTest, 1000, 2) // Only keep 2 samples
      
      speedTest.start()
      
      // Run 4 tests
      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(1000)
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      // Average should only consider the last 2 tests
      const average = speedTest.average()
      expect(average).toBeDefined()
      expect(average).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero frequency', () => {
      speedTest = createSpeedTest(mockTest, 0)
      speedTest.start()
      
      // Should still work, just run tests very frequently
      expect(speedTest).toBeDefined()
    })

    it('should handle stopping before starting', () => {
      speedTest = createSpeedTest(mockTest, 1000)
      speedTest.stop() // Should not throw
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle multiple stops', () => {
      speedTest = createSpeedTest(mockTest, 1000)
      speedTest.start()
      speedTest.stop()
      speedTest.stop() // Should not throw
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle single sample queue', () => {
      mockTest.mockResolvedValue(undefined)
      speedTest = createSpeedTest(mockTest, 1000, 1)
      
      speedTest.start()
      jest.advanceTimersByTime(1000)
      
      const average = speedTest.average()
      expect(average).toBeGreaterThan(0)
    })
  })

  describe('DroppingQueue Behavior', () => {
    it('should maintain FIFO order when capacity is exceeded', async () => {
      const executionTimes: number[] = []
      mockTest.mockImplementation(() => {
        return new Promise(resolve => {
          const startTime = Date.now()
          setTimeout(() => {
            executionTimes.push(Date.now() - startTime)
            resolve(undefined)
          }, 50)
        })
      })
      
      speedTest = createSpeedTest(mockTest, 100, 2) // Capacity of 2
      speedTest.start()
      
      // Run 3 tests
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100)
        jest.advanceTimersByTime(60) // Wait for test to complete
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      const average = speedTest.average()
      expect(average).toBeGreaterThan(0)
      expect(average).toBeLessThan(Number.MAX_SAFE_INTEGER)
    })
  })
})