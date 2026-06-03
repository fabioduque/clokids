export type QuizDirection = 'analogToDigital' | 'digitalToAnalog'
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type Rng = () => number

export interface LevelConfig {
  minutes: number[] // allowed minute-of-hour values
  is24h: boolean
  label: string
}

export interface Question {
  direction: QuizDirection
  correct: number // total minutes
  options: number[] // 4 totals incl. correct, shuffled
  is24h: boolean // copied from the level so the UI knows whether to show 24h numbers / 24h digital
}

export const LEVEL_COUNT = 10

const OCLOCK = [0]
const HALF = [0, 30]
const QUARTER = [0, 15, 30, 45]
const FIVE = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const EVERY = Array.from({ length: 60 }, (_, i) => i)

const LEVELS: Record<Level, LevelConfig> = {
  1: { minutes: OCLOCK, is24h: false, label: 'Horas certas' },
  2: { minutes: HALF, is24h: false, label: 'Meias horas' },
  3: { minutes: QUARTER, is24h: false, label: 'Quartos de hora' },
  4: { minutes: FIVE, is24h: false, label: 'Cinco em cinco' },
  5: { minutes: EVERY, is24h: false, label: 'Minuto a minuto' },
  6: { minutes: OCLOCK, is24h: true, label: 'Horas certas · 24h' },
  7: { minutes: HALF, is24h: true, label: 'Meias horas · 24h' },
  8: { minutes: QUARTER, is24h: true, label: 'Quartos de hora · 24h' },
  9: { minutes: FIVE, is24h: true, label: 'Cinco em cinco · 24h' },
  10: { minutes: EVERY, is24h: true, label: 'Minuto a minuto · 24h' },
}

export function levelConfig(level: Level): LevelConfig {
  return LEVELS[level]
}

export function levelIs24h(level: Level): boolean {
  return LEVELS[level].is24h
}

export function levelLabel(level: Level): string {
  return LEVELS[level].label
}

// all valid total-minutes for a level (hours 0..11 for 12h, 0..23 for 24h, × allowed minutes)
export function validTimes(level: Level): number[] {
  const cfg = LEVELS[level]
  const hours = cfg.is24h ? 24 : 12
  const out: number[] = []
  for (let h = 0; h < hours; h++) for (const m of cfg.minutes) out.push(h * 60 + m)
  return out
}

export function randomTime(level: Level, rng: Rng): number {
  const all = validTimes(level)
  return all[Math.floor(rng() * all.length)]
}

// Appearance key: two analog clocks look identical iff equal mod 720 (12h) with same minute.
// For 12h levels every total < 720 so totals are already distinct by appearance.
function appearanceKey(total: number): number {
  return total % 720
}

// 3 distinct wrong answers from the level's valid set, distinct from `correct` AND from each
// other BY APPEARANCE (so option clocks never look identical), preferring nearer times.
export function generateDistractors(level: Level, correct: number, rng: Rng): number[] {
  const usedKeys = new Set<number>([appearanceKey(correct)])
  const pool = validTimes(level).filter((t) => t !== correct)
  // shuffle (Fisher–Yates with rng) then sort by closeness to correct for plausible-but-fair picks
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  pool.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct))
  const result: number[] = []
  for (const t of pool) {
    if (result.length >= 3) break
    const k = appearanceKey(t)
    if (!usedKeys.has(k)) {
      usedKeys.add(k)
      result.push(t)
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
  const correct = randomTime(level, rng)
  const direction: QuizDirection = rng() < 0.5 ? 'analogToDigital' : 'digitalToAnalog'
  const options = shuffle([correct, ...generateDistractors(level, correct, rng)], rng)
  return { direction, correct, options, is24h: levelIs24h(level) }
}
