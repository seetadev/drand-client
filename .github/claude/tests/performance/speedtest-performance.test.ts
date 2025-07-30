import { createSpeedTest } from '../../lib/speedtest'

describe('SpeedTest Performance Tests', () => {
  beforeEach(() => {
    jest.useRealTimers() // Use real timers for performance testing
  })

  afterEach(() => {
    jest.useFakeTimers()
  })

  describe('Performance Characteristics', () => {
    it('should complete speed tests within reasonable time', async () => {
      let executionCount = 0
      const fastTest = jest.fn().mockImplementation(async () => {
        executionCount++
        await new Promise(resolve => setTimeout(resolve, 10)) // 10ms test
      })

      const speedTest = createSpeedTest(fastTest, 50, 5) // Test every 50ms
      const startTime = Date.now()
      
      speedTest.start()
      
      // Wait for a few tests to complete
      await new Promise(resolve => setTimeout(resolve, 200))
      speedTest.stop()
      
      const endTime = Date.now()
      const elapsed = endTime - startTime
      
      expect(elapsed).toBeLessThan(300) // Should complete within 300ms
      expect(executionCount).toBeGreaterThan(0)
    })

    it('should handle high-frequency testing', async () => {
      const veryFastTest = jest.fn().mockResolvedValue(undefined)
      const speedTest = createSpeedTest(veryFastTest, 1, 10) // Test every 1ms
      
      speedTest.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      speedTest.stop()
      
      expect(veryFastTest).toHaveBeenCalledTimes(expect.any(Number))
      const average = speedTest.average()
      expect(average).toBeGreaterThan(0)
    })

    it('should maintain performance with large sample sizes', async () => {
      const test = jest.fn().mockResolvedValue(undefined)
      const speedTest = createSpeedTest(test, 10, 100) // Large sample size
      
      const startTime = Date.now()
      speedTest.start()
      
      // Let it collect many samples
      await new Promise(resolve => setTimeout(resolve, 200))
      speedTest.stop()
      
      const endTime = Date.now()
      const average = speedTest.average()
      
      expect(endTime - startTime).toBeLessThan(500)
      expect(average).toBeGreaterThan(0)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory with long-running tests', async () => {
      const test = jest.fn().mockResolvedValue(undefined)
      const speedTest = createSpeedTest(test, 5, 10)
      
      // Start and stop multiple times to check for memory leaks
      for (let i = 0; i < 10; i++) {
        speedTest.start()
        await new Promise(resolve => setTimeout(resolve, 20))
        speedTest.stop()
      }
      
      // Test should still work after multiple start/stop cycles
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should properly clean up resources', async () => {
      const test = jest.fn().mockResolvedValue(undefined)
      const speedTest = createSpeedTest(test, 10, 5)
      
      speedTest.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Verify test is running
      expect(test).toHaveBeenCalled()
      
      speedTest.stop()
      const callCountAfterStop = test.mock.calls.length
      
      // Wait and verify no more calls after stop
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(test.mock.calls.length).toBe(callCountAfterStop)
    })
  })

  describe('Accuracy Under Load', () => {
    it('should maintain timing accuracy under normal conditions', async () => {
      const delays = [10, 20, 30, 40, 50]
      let delayIndex = 0
      
      const variableDelayTest = jest.fn().mockImplementation(async () => {
        const delay = delays[delayIndex % delays.length]
        delayIndex++
        await new Promise(resolve => setTimeout(resolve, delay))
      })
      
      const speedTest = createSpeedTest(variableDelayTest, 70, 5)
      speedTest.start()
      
      // Wait for all samples to be collected
      await new Promise(resolve => setTimeout(resolve, 400))
      speedTest.stop()
      
      const average = speedTest.average()
      const expectedAverage = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
      
      // Allow for some variance due to system overhead
      expect(average).toBeGreaterThan(expectedAverage - 10)
      expect(average).toBeLessThan(expectedAverage + 50)
    })

    it('should handle concurrent speed tests', async () => {
      const test1 = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 15))
      )
      const test2 = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 25))
      )
      
      const speedTest1 = createSpeedTest(test1, 50, 3)
      const speedTest2 = createSpeedTest(test2, 50, 3)
      
      speedTest1.start()
      speedTest2.start()
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      speedTest1.stop()
      speedTest2.stop()
      
      const avg1 = speedTest1.average()
      const avg2 = speedTest2.average()
      
      expect(avg1).toBeLessThan(avg2) // First test should be faster
      expect(avg1).toBeGreaterThan(0)
      expect(avg2).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      const failingTest = jest.fn().mockRejectedValue(new Error('Test failed'))
      const speedTest = createSpeedTest(failingTest, 20, 5)
      
      const startTime = Date.now()
      speedTest.start()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      speedTest.stop()
      
      const endTime = Date.now()
      const elapsed = endTime - startTime
      
      // Should complete quickly even with failures
      expect(elapsed).toBeLessThan(200)
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle mixed success/failure scenarios', async () => {
      let callCount = 0
      const mixedTest = jest.fn().mockImplementation(async () => {
        callCount++
        if (callCount % 2 === 0) {
          throw new Error('Every other call fails')
        }
        await new Promise(resolve => setTimeout(resolve, 20))
      })
      
      const speedTest = createSpeedTest(mixedTest, 30, 6)
      speedTest.start()
      
      await new Promise(resolve => setTimeout(resolve, 200))
      speedTest.stop()
      
      const average = speedTest.average()
      expect(average).toBe(Number.MAX_SAFE_INTEGER) // Should be MAX due to failures
    })
  })

  describe('Resource Efficiency', () => {
    it('should efficiently manage timer resources', async () => {
      const tests: any[] = []
      
      // Create multiple speed tests
      for (let i = 0; i < 5; i++) {
        const test = jest.fn().mockResolvedValue(undefined)
        const speedTest = createSpeedTest(test, 100, 2)
        tests.push({ speedTest, mockFn: test })
        speedTest.start()
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Stop all tests
      tests.forEach(({ speedTest }) => speedTest.stop())
      
      // All should stop cleanly
      tests.forEach(({ speedTest }) => {
        expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
      })
    })

    it('should handle rapid start/stop cycles efficiently', async () => {
      const test = jest.fn().mockResolvedValue(undefined)
      const speedTest = createSpeedTest(test, 10, 3)
      
      // Rapid start/stop cycles
      for (let i = 0; i < 20; i++) {
        speedTest.start()
        speedTest.stop()
      }
      
      // Should still work correctly
      expect(speedTest.average()).toBe(Number.MAX_SAFE_INTEGER)
      
      // Final start should work
      speedTest.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      speedTest.stop()
      
      expect(test).toHaveBeenCalled()
    })
  })
})