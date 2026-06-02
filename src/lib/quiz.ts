import { mod1440 } from './timeModel'

export type QuizDirection = 'analogToDigital' | 'digitalToAnalog'
export type Level = 1 | 2 | 3
export type Rng = () => number

export interface Question {
  direction: QuizDirection
  correct: number // total minutes
  options: number[] // 4 total minutes, includes correct, shuffled
}

export function stepForLevel(level: Level): number {
  return level === 1 ? 15 : level === 2 ? 5 : 1
}

export function randomTime(step: number, rng: Rng): number {
  const slots = Math.floor(1440 / step)
  const idx = Math.floor(rng() * slots)
  return mod1440(idx * step)
}

// Plausible-but-fair wrong answers: near misses by step, by an hour,
// and an hour/minute confusion. Falls back to random multiples to fill.
export function generateDistractors(correct: number, step: number, rng: Rng): number[] {
  const used = new Set<number>([correct])
  const result: number[] = []
  // NOTE: offsets are chosen so no two options are ever 720 min (12h) apart —
  // in the digitalToAnalog direction, clocks are drawn without 24h numbers, so
  // two times 12h apart would render identically. See the mod-720 test in quiz.test.ts.
  const candidates = [
    mod1440(correct + step),
    mod1440(correct - step),
    mod1440(correct + 60),
    mod1440(correct - 60),
    mod1440(correct + 2 * step),
    mod1440(correct - 2 * step),
  ]
  for (const c of candidates) {
    if (result.length >= 3) break
    if (!used.has(c)) {
      used.add(c)
      result.push(c)
    }
  }
  let guard = 0
  while (result.length < 3 && guard++ < 100) {
    const r = randomTime(step, rng)
    if (!used.has(r)) {
      used.add(r)
      result.push(r)
    }
  }
  return result
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function makeQuestion(level: Level, rng: Rng): Question {
  const step = stepForLevel(level)
  const correct = randomTime(step, rng)
  const direction: QuizDirection =
    rng() < 0.5 ? 'analogToDigital' : 'digitalToAnalog'
  const options = shuffle([correct, ...generateDistractors(correct, step, rng)], rng)
  return { direction, correct, options }
}
