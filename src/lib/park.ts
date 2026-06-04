// O Parque do Cloki: five themed zones, each with its OWN game logic — not the
// same quiz with different words. Two interaction families:
//   SetClockTask — the child answers by DRAGGING THE HANDS and pressing Pronto
//                  (Estação targets, Cinema departures, Oficina repairs)
//   ChoiceTask   — pick-the-answer word problems (Zoo waits)
// plus the Casa story mode (guided days, no scoring) defined at the bottom.
// Pure + rng/lang-injected, mirroring missions.ts, so everything is testable.

import type { Lang } from './i18n'
import { fmtHourLang } from './missions'
import { mod1440 } from './timeModel'

export type Rng = () => number
export type ZoneId = 'estacao' | 'zoo' | 'cinema' | 'oficina' | 'casa'
export type ParkLevel = 1 | 2 | 3

export const PARK_ROUND = 5
export const PARK_ZONES: ZoneId[] = ['estacao', 'zoo', 'cinema', 'oficina', 'casa']
export const ZONE_EMOJI: Record<ZoneId, string> = {
  estacao: '🚂',
  zoo: '🦁',
  cinema: '🎬',
  oficina: '🛠️',
  casa: '🏠',
}

export interface SetClockTask {
  kind: 'set'
  zone: ZoneId
  text: string
  /** The time the child must set (minutes from midnight). */
  target: number
  /** Where the hands start (Oficina: the WRONG time to repair). */
  startAt: number
  /** Snap step for dragging at this level. */
  step: 15 | 5 | 1
  /** Oficina shows the correct time digitally as the reference to repair to. */
  showDigital: boolean
}

export interface ChoiceTask {
  kind: 'choice'
  zone: ZoneId
  text: string
  clockTotal: number
  wedgeFromMin: number
  wedgeToMin: number
  correct: number // minutes of waiting
  options: number[]
}

export type ParkTask = SetClockTask | ChoiceTask

const t = (h: number, m = 0) => h * 60 + m

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nearbyDistractors(correct: number, step: number, rng: Rng): number[] {
  const offsets = shuffle([-3, -2, -1, 1, 2, 3].map((k) => k * step), rng)
  const out: number[] = []
  for (const off of offsets) {
    const v = correct + off
    if (v > 0 && !out.includes(v)) out.push(v)
    if (out.length === 3) break
  }
  return out
}

// Allowed minute-of-hour per difficulty level (the learning ladder).
const LEVEL_MINUTES: Record<ParkLevel, number[]> = {
  1: [0],
  2: [0, 15, 30, 45],
  3: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
}
export const LEVEL_STEP: Record<ParkLevel, 15 | 5 | 1> = { 1: 15, 2: 15, 3: 5 }

function sampleTime(minHour: number, maxHour: number, level: ParkLevel, rng: Rng): number {
  const hour = minHour + Math.floor(rng() * (maxHour - minHour + 1))
  const minutes = LEVEL_MINUTES[level]
  return hour * 60 + minutes[Math.floor(rng() * minutes.length)]
}

/** A start clearly away from the target: 2–4 hours off AND a non-zero minute
 * offset on the drag grid, so BOTH hands must move. (A flat +3h start left the
 * minute hand already on the answer — half the task pre-solved.) */
function startAwayFrom(target: number, step: 15 | 5 | 1, rng: Rng): number {
  const hours = 2 + Math.floor(rng() * 3)
  const minutes = step * (1 + Math.floor(rng() * (60 / step - 1)))
  return mod1440(target + hours * 60 + minutes)
}

// ─── 🚂 Estação: set the clock to the departure time ────────────────────────
function makeEstacao(level: ParkLevel, rng: Rng, lang: Lang): SetClockTask {
  const target = sampleTime(7, 20, level, rng) // trains run all day
  const f = fmtHourLang(target, lang)
  return {
    kind: 'set',
    zone: 'estacao',
    text:
      lang === 'pt'
        ? `O comboio das ${f} vai partir! Acerta o relógio na hora da partida.`
        : `The ${f} train is leaving! Set the clock to departure time.`,
    target,
    startAt: startAwayFrom(target, LEVEL_STEP[level], rng),
    step: LEVEL_STEP[level],
    showDigital: false,
  }
}

// ─── 🎬 Cinema: set the clock to the time you must LEAVE ────────────────────
const CINEMA_DURS: Record<ParkLevel, number[]> = { 1: [5, 10], 2: [5, 10, 15, 20], 3: [5, 10, 15, 20, 25, 30] }

function makeCinema(level: ParkLevel, rng: Rng, lang: Lang): SetClockTask {
  const start = sampleTime(11, 18, level, rng) // kids' sessions: late morning onwards
  const dur = pick(CINEMA_DURS[level], rng)
  const target = start - dur
  const f = fmtHourLang(start, lang)
  return {
    kind: 'set',
    zone: 'cinema',
    text:
      lang === 'pt'
        ? `O filme começa às ${f} e demoras ${dur} minutos até lá. Acerta o relógio na hora de SAIR de casa!`
        : `The movie starts at ${f} and it takes you ${dur} minutes to get there. Set the clock to the time you must LEAVE!`,
    target,
    startAt: startAwayFrom(target, 5, rng),
    step: 5, // leaving times land off the quarter grid even at L1 (e.g. 10h50)
    showDigital: false,
  }
}

// ─── 🛠️ Oficina: repair the crazy clock ─────────────────────────────────────
const OFICINA_ERRORS: Record<ParkLevel, number[]> = {
  1: [60, 120, 180, -60, -120], // whole hours wrong
  2: [30, 45, 90, -30, -45, -90],
  3: [5, 10, 20, 25, -5, -10, -20, -25],
}

function makeOficina(level: ParkLevel, rng: Rng, lang: Lang): SetClockTask {
  const target = sampleTime(8, 19, level, rng)
  const wrong = mod1440(target + pick(OFICINA_ERRORS[level], rng))
  const f = fmtHourLang(target, lang)
  return {
    kind: 'set',
    zone: 'oficina',
    text:
      lang === 'pt'
        ? `Este relógio está maluco! Deviam ser ${f}. Conserta-o!`
        : `This clock has gone crazy! It should say ${f}. Fix it!`,
    target,
    startAt: wrong,
    step: LEVEL_STEP[level],
    showDigital: true,
  }
}

// ─── 🦁 Zoo: how many minutes until it opens? ───────────────────────────────
const ZOO_DIFFS: Record<ParkLevel, number[]> = {
  1: [5, 10, 15],
  2: [5, 10, 15, 20, 25, 30],
  3: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
}
const ZOO_SCENES: Array<{ emoji: string; min: number; max: number; pt: (f: string) => string; en: (f: string) => string }> = [
  { emoji: '🦁', min: t(9), max: t(10), pt: (f) => `Os leões acordam às ${f}. Quantos minutos faltam?`, en: (f) => `The lions wake up at ${f}. How many minutes to go?` },
  { emoji: '🐧', min: t(10), max: t(11, 30), pt: (f) => `A hora de comer dos pinguins é às ${f}. Quantos minutos faltam?`, en: (f) => `The penguins eat at ${f}. How many minutes to go?` },
  { emoji: '🐘', min: t(9, 30), max: t(11), pt: (f) => `O banho dos elefantes é às ${f}. Quantos minutos faltam?`, en: (f) => `The elephants' bath is at ${f}. How many minutes to go?` },
]

function makeZoo(level: ParkLevel, rng: Rng, lang: Lang): ChoiceTask {
  const scene = pick(ZOO_SCENES, rng)
  const slots = Math.floor((scene.max - scene.min) / 5) + 1
  const target = scene.min + 5 * Math.floor(rng() * slots)
  const diff = pick(ZOO_DIFFS[level], rng)
  const now = target - diff
  return {
    kind: 'choice',
    zone: 'zoo',
    text: lang === 'pt' ? scene.pt(fmtHourLang(target, lang)) : scene.en(fmtHourLang(target, lang)),
    clockTotal: now,
    wedgeFromMin: now % 60,
    wedgeToMin: target % 60,
    correct: diff,
    options: shuffle([diff, ...nearbyDistractors(diff, 5, rng)], rng),
  }
}

export function makeParkRound(zone: Exclude<ZoneId, 'casa'>, level: ParkLevel, rng: Rng, lang: Lang): ParkTask[] {
  const gen = { estacao: makeEstacao, cinema: makeCinema, oficina: makeOficina, zoo: makeZoo }[zone]
  return Array.from({ length: PARK_ROUND }, () => gen(level, rng, lang))
}

// ─── 🏠 Casa do Cloki: guided story days (no scoring) ───────────────────────

export type ClokiPose = 'idle' | 'wave' | 'walk' | 'cheer' | 'sleep'

export interface StoryMoment {
  emoji: string
  text: string
  /** The time the child sets the clock to, advancing the story + sky. */
  target: number
  pose: ClokiPose
}

export interface StoryDay {
  id: string
  emoji: string
  title: string
  moments: StoryMoment[]
}

export const STORY_DAYS: Record<Lang, StoryDay[]> = {
  pt: [
    {
      id: 'escola',
      emoji: '🎒',
      title: 'Dia de escola',
      moments: [
        { emoji: '🌅', text: 'O Cloki acorda às 7h30. Acerta o relógio!', target: t(7, 30), pose: 'sleep' },
        { emoji: '🎒', text: 'Sai de casa para a escola às 8h30.', target: t(8, 30), pose: 'walk' },
        { emoji: '🍲', text: 'O almoço é às 12h30. Que fome!', target: t(12, 30), pose: 'idle' },
        { emoji: '⚽', text: 'Às 17h00 vai brincar com os amigos!', target: t(17, 0), pose: 'cheer' },
        { emoji: '🛁', text: 'Hora do banho: 19h30.', target: t(19, 30), pose: 'idle' },
        { emoji: '🌙', text: 'Às 21h00 vai dormir. Boa noite, Cloki!', target: t(21, 0), pose: 'sleep' },
      ],
    },
    {
      id: 'fimdesemana',
      emoji: '🥞',
      title: 'Fim de semana',
      moments: [
        { emoji: '😴', text: 'Sábado! O Cloki dorme até às 9h00.', target: t(9, 0), pose: 'sleep' },
        { emoji: '🥞', text: 'Panquecas ao pequeno-almoço às 9h30!', target: t(9, 30), pose: 'cheer' },
        { emoji: '🚲', text: 'Passeio de bicicleta às 11h00.', target: t(11, 0), pose: 'walk' },
        { emoji: '🍕', text: 'Pizza ao almoço, às 13h00!', target: t(13, 0), pose: 'cheer' },
        { emoji: '🎬', text: 'Filme em família às 16h30.', target: t(16, 30), pose: 'idle' },
        { emoji: '🌙', text: 'Cama às 21h30 — que grande dia!', target: t(21, 30), pose: 'sleep' },
      ],
    },
  ],
  en: [
    {
      id: 'escola',
      emoji: '🎒',
      title: 'School day',
      moments: [
        { emoji: '🌅', text: 'Cloki wakes up at 7:30. Set the clock!', target: t(7, 30), pose: 'sleep' },
        { emoji: '🎒', text: 'He leaves for school at 8:30.', target: t(8, 30), pose: 'walk' },
        { emoji: '🍲', text: 'Lunch is at 12:30. So hungry!', target: t(12, 30), pose: 'idle' },
        { emoji: '⚽', text: 'At 5:00 he plays with his friends!', target: t(17, 0), pose: 'cheer' },
        { emoji: '🛁', text: 'Bath time: 7:30.', target: t(19, 30), pose: 'idle' },
        { emoji: '🌙', text: 'At 9:00 he goes to sleep. Good night, Cloki!', target: t(21, 0), pose: 'sleep' },
      ],
    },
    {
      id: 'fimdesemana',
      emoji: '🥞',
      title: 'Weekend',
      moments: [
        { emoji: '😴', text: 'Saturday! Cloki sleeps in until 9:00.', target: t(9, 0), pose: 'sleep' },
        { emoji: '🥞', text: 'Pancakes for breakfast at 9:30!', target: t(9, 30), pose: 'cheer' },
        { emoji: '🚲', text: 'Bike ride at 11:00.', target: t(11, 0), pose: 'walk' },
        { emoji: '🍕', text: 'Pizza for lunch at 1:00!', target: t(13, 0), pose: 'cheer' },
        { emoji: '🎬', text: 'Family movie at 4:30.', target: t(16, 30), pose: 'idle' },
        { emoji: '🌙', text: 'Bed at 9:30 — what a day!', target: t(21, 30), pose: 'sleep' },
      ],
    },
  ],
}

/** Story moments answer with a generous snap (kid sets e.g. 7h30 on a 15-min grid;
 * moments off the quarter grid use 5). */
export function storyStep(target: number): 15 | 5 {
  return target % 15 === 0 ? 15 : 5
}
