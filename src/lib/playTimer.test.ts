import { describe, it, expect } from 'vitest'
import { playMinutes, shouldSuggestBreak, BREAK_AFTER_MIN, REMIND_EVERY_MIN } from './playTimer'

describe('playMinutes', () => {
  it('floors elapsed milliseconds to whole minutes', () => {
    const t0 = 1_000_000
    expect(playMinutes(t0, t0)).toBe(0)
    expect(playMinutes(t0, t0 + 59_999)).toBe(0)
    expect(playMinutes(t0, t0 + 60_000)).toBe(1)
    expect(playMinutes(t0, t0 + 31 * 60_000)).toBe(31)
  })

  it('never goes negative (clock weirdness)', () => {
    expect(playMinutes(2_000_000, 1_000_000)).toBe(0)
  })
})

describe('shouldSuggestBreak', () => {
  it('stays quiet before the threshold', () => {
    expect(shouldSuggestBreak(0, null)).toBe(false)
    expect(shouldSuggestBreak(BREAK_AFTER_MIN - 1, null)).toBe(false)
  })

  it('suggests a break at the threshold', () => {
    expect(shouldSuggestBreak(BREAK_AFTER_MIN, null)).toBe(true)
  })

  it('goes quiet after a dismissal, then reminds again later', () => {
    const dismissedAt = BREAK_AFTER_MIN
    expect(shouldSuggestBreak(dismissedAt, dismissedAt)).toBe(false)
    expect(shouldSuggestBreak(dismissedAt + REMIND_EVERY_MIN - 1, dismissedAt)).toBe(false)
    expect(shouldSuggestBreak(dismissedAt + REMIND_EVERY_MIN, dismissedAt)).toBe(true)
  })
})
