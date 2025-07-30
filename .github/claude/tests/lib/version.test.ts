import { LIB_VERSION } from '../../lib/version'

describe('Version Configuration', () => {
  it('should have a defined version', () => {
    expect(LIB_VERSION).toBeDefined()
  })

  it('should be a non-empty string', () => {
    expect(typeof LIB_VERSION).toBe('string')
    expect(LIB_VERSION.length).toBeGreaterThan(0)
  })

  it('should follow semantic versioning pattern', () => {
    // Basic semver pattern: major.minor.patch with optional pre-release
    const semverPattern = /^\d+\.\d+\.\d+(-[\w\d\-_.]+)?(\+[\w\d\-_.]+)?$/
    expect(LIB_VERSION).toMatch(semverPattern)
  })

  it('should not contain whitespace', () => {
    expect(LIB_VERSION.trim()).toBe(LIB_VERSION)
    expect(LIB_VERSION).not.toContain(' ')
  })

  it('should be a valid version for user agent strings', () => {
    // Ensure version is safe for HTTP headers
    const userAgentSafePattern = /^[\x21-\x7E]+$/
    expect(LIB_VERSION).toMatch(userAgentSafePattern)
  })

  it('should not be a placeholder version', () => {
    const placeholders = ['0.0.0', 'x.x.x', 'VERSION', 'TBD', 'TODO']
    expect(placeholders).not.toContain(LIB_VERSION)
  })
})

describe('Version Integration', () => {
  it('should be usable in user agent strings', () => {
    const userAgent = `drand-client-${LIB_VERSION}`
    expect(userAgent).toContain(LIB_VERSION)
    expect(userAgent.length).toBeGreaterThan('drand-client-'.length)
  })

  it('should be compatible with HTTP headers', () => {
    // Test that version doesn't contain characters that would break HTTP headers
    const forbiddenChars = ['\n', '\r', '\0', '\t']
    forbiddenChars.forEach(char => {
      expect(LIB_VERSION).not.toContain(char)
    })
  })
})