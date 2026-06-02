import { describe, it, expect } from 'vitest'
import { mod1440, split, snap, angles } from './timeModel'

describe('mod1440', () => {
  it('wraps negative and overflow into 0..1439', () => {
    expect(mod1440(-1)).toBe(1439)
    expect(mod1440(1440)).toBe(0)
    expect(mod1440(1500)).toBe(60)
  })
})

describe('split', () => {
  it('splits total minutes into hour24 and minute', () => {
    expect(split(0)).toEqual({ hour24: 0, minute: 0 })
    expect(split(945)).toEqual({ hour24: 15, minute: 45 }) // 15:45
    expect(split(1439)).toEqual({ hour24: 23, minute: 59 })
  })
})

describe('snap', () => {
  it('snaps to nearest multiple of step, wrapping the day', () => {
    expect(snap(53, 15)).toBe(60)   // nearest quarter is next hour
    expect(snap(52, 5)).toBe(50)
    expect(snap(53, 1)).toBe(53)
    expect(snap(1438, 15)).toBe(0)  // wraps to midnight
  })
})

describe('angles', () => {
  it('computes hour and minute hand angles in degrees from 12 o\'clock', () => {
    expect(angles(0)).toEqual({ hour: 0, minute: 0 })
    expect(angles(180)).toEqual({ hour: 90, minute: 0 })   // 03:00
    expect(angles(190).minute).toBe(60)                    // 10 min -> 60deg
    expect(angles(190).hour).toBeCloseTo(95, 5)            // 3h + 10min => 95deg
  })
})
