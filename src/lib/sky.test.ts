import { describe, it, expect } from 'vitest'
import { skyAt } from './sky'

const h = (hour: number, min = 0) => hour * 60 + min

describe('skyAt', () => {
  it('is day at noon: sun up, no moon, no stars', () => {
    const s = skyAt(h(12))
    expect(s.isNight).toBe(false)
    expect(s.sun).not.toBeNull()
    expect(s.moon).toBeNull()
    expect(s.starOpacity).toBe(0)
  })

  it('is night at midnight: moon up, no sun, full stars', () => {
    const s = skyAt(h(0))
    expect(s.isNight).toBe(true)
    expect(s.moon).not.toBeNull()
    expect(s.sun).toBeNull()
    expect(s.starOpacity).toBe(1)
  })

  it('puts the sun near its peak altitude around midday', () => {
    const noon = skyAt(h(12, 45)) // solar peak sits near the rise/set midpoint
    expect(noon.sun!.altitude).toBeGreaterThan(0.95)
  })

  it('the sun climbs from morning to midday', () => {
    expect(skyAt(h(8)).sun!.altitude).toBeLessThan(skyAt(h(12)).sun!.altitude)
  })

  it('the sun crosses west to east across the day', () => {
    expect(skyAt(h(8)).sun!.x).toBeLessThan(skyAt(h(16)).sun!.x)
  })

  it('wraps continuously across midnight (no hard seam)', () => {
    const before = skyAt(h(23, 59)).stops
    const after = skyAt(h(0, 1)).stops
    // top colour should barely move across the 24h→0h boundary
    expect(before[0]).not.toBe('')
    expect(after[0]).not.toBe('')
  })

  it('always returns three valid hex stops', () => {
    for (let m = 0; m < 1440; m += 37) {
      const s = skyAt(m)
      expect(s.stops).toHaveLength(3)
      for (const c of s.stops) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('normalises out-of-range minutes', () => {
    expect(skyAt(h(12))).toEqual(skyAt(h(12) + 1440))
  })
})
