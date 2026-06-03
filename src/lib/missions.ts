// Missões do Tempo: real-life word problems about time arithmetic — the skill
// that comes after reading the clock. Three kinds, mirroring everyday moments:
//   'until' — "saímos às 8h45; daqui a quantos minutos?"   (target − now)
//   'wait'  — "o zoo abre às 9h00; quantos minutos de espera?" (same maths,
//             different story: you ARRIVED and are waiting)
//   'leave' — "o show é às 10h30 e demora-se 10 min; a que horas saímos?"
//             (target − duration → an actual time, the inverse problem)
// Pure + rng-injected like quiz.ts so rounds are fully testable.
//
// REALISM MATTERS: each scene declares the window where its target time is
// plausible — kids' films don't start at 9h50, birthday parties don't start at
// 8h00. All windows stay in the morning so "8h45" wording is unambiguous.

import type { Lang } from './i18n'
import { fmtHourEn } from './timeWordsEn'

export type MissionKind = 'until' | 'wait' | 'leave'
export type Rng = () => number

export interface Mission {
  kind: MissionKind
  emoji: string
  /** The question, pt-PT, with times already formatted ("8h45"). */
  text: string
  /** What the analog clock shows: "agora" for until/wait, the TARGET for leave. */
  clockTotal: number
  /** Minute-hand wedge illustrating the interval (drawn as feedback/hint). */
  wedgeFromMin: number
  wedgeToMin: number
  /** For until/wait: minutes. For leave: total minutes-from-midnight. */
  correct: number
  /** 4 options (incl. correct), shuffled, same unit as `correct`. */
  options: number[]
  /** True when options should render as clock times instead of "X minutos". */
  answerIsTime: boolean
}

export const MISSION_ROUND = 5
export const MISSIONS_UNLOCK_COST = 10

const t = (h: number, m = 0) => h * 60 + m

// Each scene: emoji + copy + the REALISTIC window [min..max] for its target
// time (5-min grid). Exported so tests can assert realism per scene.
export interface SceneDef {
  emoji: string
  min: number
  max: number
  tpl: Record<Lang, (alvo: string, dur: number) => string>
}

export const UNTIL_SCENES: SceneDef[] = [
  // leaving for school: morning rush
  { emoji: '🏫', min: t(7, 30), max: t(8, 45), tpl: { pt: (alvo) => `Temos de sair de casa para a escola às ${alvo}. Daqui a quantos minutos saímos?`, en: (alvo) => `We have to leave for school at ${alvo}. In how many minutes do we leave?` } },
  // weekend football practice: mid-morning
  { emoji: '⚽', min: t(9), max: t(11), tpl: { pt: (alvo) => `O treino de futebol começa às ${alvo}. Daqui a quantos minutos começa?`, en: (alvo) => `Soccer practice starts at ${alvo}. In how many minutes does it start?` } },
  // a bus can come at any reasonable morning hour
  { emoji: '🚌', min: t(7, 15), max: t(11, 30), tpl: { pt: (alvo) => `O autocarro chega às ${alvo}. Daqui a quantos minutos chega?`, en: (alvo) => `The bus arrives at ${alvo}. In how many minutes does it arrive?` } },
]

export const WAIT_SCENES: SceneDef[] = [
  // zoos open at 9–10
  { emoji: '🦁', min: t(9), max: t(10), tpl: { pt: (alvo) => `Chegámos ao Jardim Zoológico, mas só abre às ${alvo}. Quantos minutos esperamos?`, en: (alvo) => `We arrived at the Zoo, but it only opens at ${alvo}. How many minutes do we wait?` } },
  // bakeries open early
  { emoji: '🥐', min: t(7), max: t(9, 30), tpl: { pt: (alvo) => `A pastelaria abre às ${alvo}. Quantos minutos faltam?`, en: (alvo) => `The bakery opens at ${alvo}. How many minutes to go?` } },
  // kids' cinema sessions start 10h30 at the earliest
  { emoji: '🎬', min: t(10, 30), max: t(11, 45), tpl: { pt: (alvo) => `O filme começa às ${alvo}. Quantos minutos faltam?`, en: (alvo) => `The movie starts at ${alvo}. How many minutes to go?` } },
]

export const LEAVE_SCENES: SceneDef[] = [
  // marine park shows: late morning
  { emoji: '🎢', min: t(10), max: t(11, 30), tpl: { pt: (alvo, dur) => `O espetáculo dos golfinhos começa às ${alvo}. Demoramos ${dur} minutos até lá. A que horas saímos?`, en: (alvo, dur) => `The dolphin show starts at ${alvo}. It takes us ${dur} minutes to get there. What time do we leave?` } },
  // birthday parties: never before 9h30!
  { emoji: '🎂', min: t(9, 30), max: t(11, 45), tpl: { pt: (alvo, dur) => `A festa de anos começa às ${alvo}. O caminho demora ${dur} minutos. A que horas saímos?`, en: (alvo, dur) => `The birthday party starts at ${alvo}. The trip takes ${dur} minutes. What time do we leave?` } },
  // swimming lessons: mid-morning
  { emoji: '🏊', min: t(9), max: t(11, 30), tpl: { pt: (alvo, dur) => `A aula de natação começa às ${alvo}. Demoramos ${dur} minutos até à piscina. A que horas saímos?`, en: (alvo, dur) => `Swimming class starts at ${alvo}. It takes us ${dur} minutes to get to the pool. What time do we leave?` } },
]

const SCENES: Record<MissionKind, SceneDef[]> = {
  until: UNTIL_SCENES,
  wait: WAIT_SCENES,
  leave: LEAVE_SCENES,
}

/** "8h45" — the everyday Portuguese way of writing a kid's schedule. */
export function fmtHour(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h}h00` : `${h}h${String(m).padStart(2, '0')}`
}

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

// A target time on the 5-min grid inside the scene's realistic window.
function sampleTarget(scene: SceneDef, rng: Rng): number {
  const slots = Math.floor((scene.max - scene.min) / 5) + 1
  return scene.min + 5 * Math.floor(rng() * slots)
}

// 3 distinct wrong answers near the correct one, all positive, in `step` jumps.
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

const DIFFS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const LEAVE_DURS = [5, 10, 15, 20, 30]

/** Language-aware "8h45" (pt) vs "8:45" (en). */
export function fmtHourLang(total: number, lang: Lang): string {
  return lang === 'pt' ? fmtHour(total) : fmtHourEn(total)
}

export function makeMission(rng: Rng, lang: Lang = 'pt'): Mission {
  const kind: MissionKind = pick(['until', 'wait', 'leave'], rng)
  const scene = pick(SCENES[kind], rng)
  const target = sampleTarget(scene, rng)

  if (kind === 'leave') {
    const dur = pick(LEAVE_DURS, rng)
    const correct = target - dur
    return {
      kind,
      emoji: scene.emoji,
      text: scene.tpl[lang](fmtHourLang(target, lang), dur),
      clockTotal: target,
      wedgeFromMin: correct % 60,
      wedgeToMin: target % 60,
      correct,
      options: shuffle([correct, ...nearbyDistractors(correct, 5, rng)], rng),
      answerIsTime: true,
    }
  }

  const diff = pick(DIFFS, rng)
  const now = target - diff
  return {
    kind,
    emoji: scene.emoji,
    text: scene.tpl[lang](fmtHourLang(target, lang), 0),
    clockTotal: now,
    wedgeFromMin: now % 60,
    wedgeToMin: target % 60,
    correct: diff,
    options: shuffle([diff, ...nearbyDistractors(diff, 5, rng)], rng),
    answerIsTime: false,
  }
}

export function makeMissionRound(rng: Rng, lang: Lang = 'pt'): Mission[] {
  return Array.from({ length: MISSION_ROUND }, () => makeMission(rng, lang))
}
