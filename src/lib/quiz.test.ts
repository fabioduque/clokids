import { describe, it, expect } from 'vitest'
import {
  levelConfig,
  levelIs24h,
  levelLabel,
  validTimes,
  randomTime,
  generateDistractors,
  makeQuestion,
  LEVEL_COUNT,
  type Level,
} from './quiz'

// Deterministic rng: returns the queued values, then 0.
function seq(values: number[]): () => number {
  let i = 0
  return () => (i < values.length ? values[i++] : 0)
}

// Simple deterministic LCG in [0,1) for property tests.
function lcg(seed: number): () => number {
  let s = seed
  return () => {
    s = (1103515245 * s + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const ALL_LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

describe('LEVEL_COUNT', () => {
  it('is 10', () => {
    expect(LEVEL_COUNT).toBe(10)
  })
})

describe('levelConfig / levelIs24h / levelLabel', () => {
  it('level 1 is o\'clock, 12h', () => {
    expect(levelConfig(1).minutes).toEqual([0])
    expect(levelIs24h(1)).toBe(false)
    expect(levelLabel(1)).toBe('Horas certas')
  })

  it('level 5 is every minute, 12h', () => {
    expect(levelConfig(5).minutes).toHaveLength(60)
    expect(levelIs24h(5)).toBe(false)
    expect(levelLabel(5)).toBe('Minuto a minuto')
  })

  it('level 6 is o\'clock, 24h', () => {
    expect(levelConfig(6).minutes).toEqual([0])
    expect(levelIs24h(6)).toBe(true)
    expect(levelLabel(6)).toBe('Horas certas · 24h')
  })

  it('level 10 is every minute, 24h', () => {
    expect(levelConfig(10).minutes).toHaveLength(60)
    expect(levelIs24h(10)).toBe(true)
    expect(levelLabel(10)).toBe('Minuto a minuto · 24h')
  })
})

describe('validTimes', () => {
  it('level 1 has 12 entries, all minute 0, hours 0..11', () => {
    const ts = validTimes(1)
    expect(ts).toHaveLength(12)
    for (const t of ts) {
      expect(t % 60).toBe(0)
      const h = Math.floor(t / 60)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(12)
    }
  })

  it('level 6 has 24 entries (o\'clock, 24h)', () => {
    const ts = validTimes(6)
    expect(ts).toHaveLength(24)
    for (const t of ts) expect(t % 60).toBe(0)
    expect(Math.max(...ts.map((t) => Math.floor(t / 60)))).toBe(23)
  })

  it('level 3 minutes are in {0,15,30,45} and hours 0..11', () => {
    const ts = validTimes(3)
    expect(ts).toHaveLength(12 * 4)
    for (const t of ts) {
      expect([0, 15, 30, 45]).toContain(t % 60)
      expect(Math.floor(t / 60)).toBeLessThan(12)
    }
  })
})

describe('randomTime', () => {
  it('returns a value within validTimes for several levels', () => {
    const rng = lcg(42)
    for (const level of ALL_LEVELS) {
      const valid = new Set(validTimes(level))
      for (let i = 0; i < 50; i++) {
        expect(valid.has(randomTime(level, rng))).toBe(true)
      }
    }
  })

  it('honours the rng index', () => {
    // rng -> 0 picks first valid time of level 1 (hour 0, minute 0)
    expect(randomTime(1, seq([0]))).toBe(0)
  })
})

describe('generateDistractors', () => {
  it('returns 3 distinct, none equal to correct, all valid', () => {
    const valid = new Set(validTimes(3))
    const correct = validTimes(3)[5]
    const d = generateDistractors(3, correct, lcg(7))
    expect(d).toHaveLength(3)
    expect(new Set(d).size).toBe(3)
    expect(d).not.toContain(correct)
    for (const t of d) expect(valid.has(t)).toBe(true)
  })

  it('for a 24h level produces 4 (correct+3) with distinct appearance keys mod 720', () => {
    const correct = validTimes(6)[0]
    const d = generateDistractors(6, correct, lcg(99))
    const keys = [correct, ...d].map((t) => t % 720)
    expect(new Set(keys).size).toBe(4)
  })
})

describe('makeQuestion', () => {
  it('produces 4 distinct options including the correct one; is24h matches the level', () => {
    const q = makeQuestion(2, lcg(3))
    expect(q.options).toHaveLength(4)
    expect(q.options).toContain(q.correct)
    expect(new Set(q.options).size).toBe(4)
    expect(['analogToDigital', 'digitalToAnalog']).toContain(q.direction)
    expect(q.is24h).toBe(false)
  })

  it('for a 24h level reports is24h true', () => {
    expect(makeQuestion(8, lcg(5)).is24h).toBe(true)
  })

  it('for a 12h level all options are < 720 (hours < 12)', () => {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      const rng = lcg(level * 13 + 1)
      for (let i = 0; i < 30; i++) {
        const q = makeQuestion(level, rng)
        for (const o of q.options) expect(o).toBeLessThan(720)
      }
    }
  })
})

describe('makeQuestion fairness invariant', () => {
  it('the 4 options always have distinct appearance keys (mod 720) across all 10 levels', () => {
    const rng = lcg(123456789)
    for (let n = 0; n < 2000; n++) {
      const level = ((n % LEVEL_COUNT) + 1) as Level
      const q = makeQuestion(level, rng)
      const keys = q.options.map((t) => t % 720)
      expect(new Set(keys).size).toBe(4)
    }
  })
})

describe('every level has at least 4 distinct appearances', () => {
  it('so 3 distractors are always available', () => {
    for (const level of ALL_LEVELS) {
      const keys = new Set(validTimes(level).map((t) => t % 720))
      expect(keys.size).toBeGreaterThanOrEqual(4)
    }
  })
})
