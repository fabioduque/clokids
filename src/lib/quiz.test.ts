import { describe, it, expect } from 'vitest'
import { stepForLevel, randomTime, generateDistractors, makeQuestion } from './quiz'

// Deterministic rng: returns the queued values, then 0.
function seq(values: number[]): () => number {
  let i = 0
  return () => (i < values.length ? values[i++] : 0)
}

describe('stepForLevel', () => {
  it('maps levels 1/2/3 to 15/5/1 minutes', () => {
    expect(stepForLevel(1)).toBe(15)
    expect(stepForLevel(2)).toBe(5)
    expect(stepForLevel(3)).toBe(1)
  })
})

describe('randomTime', () => {
  it('returns a multiple of the level step within the day', () => {
    const t = randomTime(15, seq([0.5]))
    expect(t % 15).toBe(0)
    expect(t).toBeGreaterThanOrEqual(0)
    expect(t).toBeLessThan(1440)
  })
})

describe('generateDistractors', () => {
  it('returns 3 distinct times, none equal to the correct one', () => {
    const d = generateDistractors(180, 15, seq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]))
    expect(d).toHaveLength(3)
    expect(new Set(d).size).toBe(3)
    expect(d).not.toContain(180)
    for (const t of d) expect(t % 15).toBe(0)
  })
})

describe('makeQuestion', () => {
  it('produces 4 options including the correct one', () => {
    const q = makeQuestion(2, seq([0.5, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8]))
    expect(q.options).toHaveLength(4)
    expect(q.options).toContain(q.correct)
    expect(new Set(q.options).size).toBe(4)
    expect(['analogToDigital', 'digitalToAnalog']).toContain(q.direction)
  })
})

describe('makeQuestion fairness invariant', () => {
  it('never produces two options that look identical on an analog clock (distinct mod 720)', () => {
    // simple deterministic LCG in [0,1)
    let s = 123456789
    const rng = () => {
      s = (1103515245 * s + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
    for (let n = 0; n < 500; n++) {
      const level = ((n % 3) + 1) as 1 | 2 | 3
      const q = makeQuestion(level, rng)
      const keys = q.options.map((t) => t % 720)
      expect(new Set(keys).size).toBe(4)
    }
  })
})
