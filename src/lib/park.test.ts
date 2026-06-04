import { describe, it, expect } from 'vitest'
import {
  makeParkRound,
  STORY_DAYS,
  storyStep,
  LEVEL_STEP,
  PARK_ROUND,
  type ParkLevel,
  type SetClockTask,
  type ChoiceTask,
} from './park'

const lcg = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32
  return seed / 2 ** 32
}

const LEVELS: ParkLevel[] = [1, 2, 3]

describe('makeParkRound', () => {
  it(`deals ${PARK_ROUND} tasks of the zone's own kind`, () => {
    expect(makeParkRound('estacao', 1, lcg(1), 'pt').every((t) => t.kind === 'set' && t.zone === 'estacao')).toBe(true)
    expect(makeParkRound('zoo', 1, lcg(2), 'pt').every((t) => t.kind === 'choice' && t.zone === 'zoo')).toBe(true)
    expect(makeParkRound('cinema', 1, lcg(3), 'pt')).toHaveLength(PARK_ROUND)
  })

  it('estação: target obeys the level ladder and starts elsewhere', () => {
    for (const level of LEVELS) {
      const rng = lcg(level * 7)
      for (const task of makeParkRound('estacao', level, rng, 'pt') as SetClockTask[]) {
        const grid = level === 1 ? 60 : level === 2 ? 15 : 5
        expect(task.target % grid).toBe(0)
        expect(task.startAt).not.toBe(task.target)
        expect(task.step).toBe(LEVEL_STEP[level])
        expect(task.showDigital).toBe(false)
      }
    }
  })

  it('cinema: leave-time = start − duration, realistic session window', () => {
    const rng = lcg(42)
    for (const task of makeParkRound('cinema', 3, rng, 'en') as SetClockTask[]) {
      // target is before the session, by at most 30 minutes
      expect(task.target).toBeGreaterThanOrEqual(11 * 60 - 30)
      expect(task.target).toBeLessThan(19 * 60)
      expect(task.text).toContain('LEAVE')
    }
  })

  it('oficina: starts WRONG, must repair to the stated time, digital reference on', () => {
    for (const level of LEVELS) {
      const rng = lcg(level * 13)
      for (const task of makeParkRound('oficina', level, rng, 'pt') as SetClockTask[]) {
        expect(task.startAt).not.toBe(task.target)
        expect(task.showDigital).toBe(true)
      }
    }
  })

  it('zoo: 4 unique options including the wait, wedge spans it', () => {
    const rng = lcg(99)
    for (const task of makeParkRound('zoo', 2, rng, 'pt') as ChoiceTask[]) {
      expect(new Set(task.options).size).toBe(4)
      expect(task.options).toContain(task.correct)
      expect(((task.wedgeToMin - task.wedgeFromMin + 60) % 60)).toBe(task.correct % 60)
      expect(task.correct).toBeLessThanOrEqual(30) // level 2 cap
    }
  })

  it('is deterministic for a fixed rng', () => {
    expect(makeParkRound('estacao', 2, lcg(5), 'pt')).toEqual(makeParkRound('estacao', 2, lcg(5), 'pt'))
  })
})

describe('STORY_DAYS', () => {
  it('both languages tell the same days with the same clock times', () => {
    expect(STORY_DAYS.pt.map((d) => d.id)).toEqual(STORY_DAYS.en.map((d) => d.id))
    for (let d = 0; d < STORY_DAYS.pt.length; d++) {
      expect(STORY_DAYS.pt[d].moments.map((m) => m.target)).toEqual(STORY_DAYS.en[d].moments.map((m) => m.target))
    }
  })

  it('moments march forward through the day', () => {
    for (const day of STORY_DAYS.pt) {
      for (let i = 1; i < day.moments.length; i++) {
        expect(day.moments[i].target).toBeGreaterThan(day.moments[i - 1].target)
      }
    }
  })

  it('storyStep gives a friendly snap per moment', () => {
    expect(storyStep(7 * 60 + 30)).toBe(15)
    expect(storyStep(8 * 60 + 50)).toBe(5)
  })
})
