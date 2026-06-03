import { describe, it, expect } from 'vitest'
import { fmtHour, makeMission, makeMissionRound, MISSION_ROUND, UNTIL_SCENES, WAIT_SCENES, LEAVE_SCENES } from './missions'

// Deterministic rng from a fixed sequence (loops).
const seq = (...vals: number[]) => {
  let i = 0
  return () => vals[i++ % vals.length]
}

// Cheap LCG for broad sampling.
const lcg = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32
  return seed / 2 ** 32
}

describe('fmtHour', () => {
  it('formats the everyday "8h45" style', () => {
    expect(fmtHour(8 * 60 + 45)).toBe('8h45')
    expect(fmtHour(9 * 60)).toBe('9h00')
    expect(fmtHour(10 * 60 + 5)).toBe('10h05')
  })
})

describe('makeMission', () => {
  it('always produces 4 unique options that include the correct answer', () => {
    const rng = lcg(42)
    for (let i = 0; i < 300; i++) {
      const m = makeMission(rng)
      expect(m.options).toHaveLength(4)
      expect(new Set(m.options).size).toBe(4)
      expect(m.options).toContain(m.correct)
    }
  })

  it('until/wait answers are positive minute counts in 5-min steps', () => {
    const rng = lcg(7)
    for (let i = 0; i < 300; i++) {
      const m = makeMission(rng)
      if (m.kind === 'leave') continue
      expect(m.answerIsTime).toBe(false)
      expect(m.correct).toBeGreaterThan(0)
      expect(m.correct % 5).toBe(0)
      for (const o of m.options) expect(o).toBeGreaterThan(0)
      // the wedge spans exactly `correct` minutes (mod the hour ring)
      expect(((m.wedgeToMin - m.wedgeFromMin + 60) % 60)).toBe(m.correct % 60)
    }
  })

  it('leave answers are times BEFORE the shown target', () => {
    const rng = lcg(99)
    for (let i = 0; i < 300; i++) {
      const m = makeMission(rng)
      if (m.kind !== 'leave') continue
      expect(m.answerIsTime).toBe(true)
      expect(m.correct).toBeLessThan(m.clockTotal)
      expect(m.clockTotal - m.correct).toBeLessThanOrEqual(30)
    }
  })

  it('keeps every mentioned time in the morning (unambiguous "8h45" wording)', () => {
    const rng = lcg(1234)
    for (let i = 0; i < 500; i++) {
      const m = makeMission(rng)
      expect(m.clockTotal).toBeGreaterThanOrEqual(6 * 60)
      expect(m.clockTotal).toBeLessThan(12 * 60)
    }
  })

  it('is deterministic for a fixed rng', () => {
    expect(makeMission(seq(0.1, 0.4, 0.7, 0.2, 0.9))).toEqual(makeMission(seq(0.1, 0.4, 0.7, 0.2, 0.9)))
  })
})

describe('makeMissionRound', () => {
  it(`produces ${MISSION_ROUND} missions`, () => {
    expect(makeMissionRound(lcg(5))).toHaveLength(MISSION_ROUND)
  })
})

describe('realistic scene windows', () => {
  it('every mission keeps its target time inside the scene-declared window', () => {
    const rng = lcg(2026)
    const tables = { until: UNTIL_SCENES, wait: WAIT_SCENES, leave: LEAVE_SCENES }
    for (let i = 0; i < 600; i++) {
      const m = makeMission(rng)
      const scene = tables[m.kind].find((s) => s.emoji === m.emoji)!
      const target = m.kind === 'leave' ? m.clockTotal : m.clockTotal + m.correct
      expect(target).toBeGreaterThanOrEqual(scene.min)
      expect(target).toBeLessThanOrEqual(scene.max)
      expect(target % 5).toBe(0)
    }
  })

  it('kids cinema never starts before 10h30 and parties never before 9h30', () => {
    const film = WAIT_SCENES.find((s) => s.emoji === '🎬')!
    const party = LEAVE_SCENES.find((s) => s.emoji === '🎂')!
    expect(film.min).toBeGreaterThanOrEqual(10 * 60 + 30)
    expect(party.min).toBeGreaterThanOrEqual(9 * 60 + 30)
  })
})
