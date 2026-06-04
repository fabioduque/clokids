// Resumable rounds: when a quiz/missions round starts, ALL its questions are
// generated up-front and persisted, so the child can hop to Brincar mid-round
// (to poke the clock and think!) and come back to exactly the same question.
// The round survives reloads too and is cleared on completion or abandonment.
// startedAt is kept so each finished phase can report how long it took.

import type { Question, Level } from './quiz'
import type { Mission } from './missions'
import type { ParkTask, ZoneId, ParkLevel } from './park'

export interface StoredQuizRound {
  level: Level
  questions: Question[]
  idx: number
  score: number
  startedAt: number // epoch ms (informational)
  // ACTIVE time spent answering, accumulated per answer. Walking away mid-round
  // (the whole point of resumable rounds!) must not count toward the duration.
  elapsedMs: number
}

export interface StoredMissionRound {
  missions: Mission[]
  idx: number
  score: number
  startedAt: number
  elapsedMs: number
}

export interface StoredParkRound {
  zone: ZoneId
  level: ParkLevel
  tasks: ParkTask[]
  idx: number
  score: number
  startedAt: number
  elapsedMs: number
}

const QUIZ_KEY = 'relogio.round.quiz.v1'
const MISSIONS_KEY = 'relogio.round.missions.v1'
const PARK_KEY = 'relogio.round.park.v1'

function read<T>(key: string, guard: (v: unknown) => v is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — rounds just won't resume */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// Shape guards: a malformed/old payload must come back as null, never crash.
function isRoundBase(v: unknown): v is { idx: number; score: number; startedAt: number } {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.idx === 'number' &&
    typeof r.score === 'number' &&
    typeof r.startedAt === 'number' &&
    typeof r.elapsedMs === 'number'
  )
}

function isQuizRound(v: unknown): v is StoredQuizRound {
  if (!isRoundBase(v)) return false
  const r = v as unknown as StoredQuizRound
  return typeof r.level === 'number' && Array.isArray(r.questions) && r.questions.length > 0
}

function isMissionRound(v: unknown): v is StoredMissionRound {
  if (!isRoundBase(v)) return false
  const r = v as unknown as StoredMissionRound
  return Array.isArray(r.missions) && r.missions.length > 0
}

function isParkRound(v: unknown): v is StoredParkRound {
  if (!isRoundBase(v)) return false
  const r = v as unknown as StoredParkRound
  return typeof r.zone === 'string' && typeof r.level === 'number' && Array.isArray(r.tasks) && r.tasks.length > 0
}

export function loadQuizRound(): StoredQuizRound | null {
  const r = read(QUIZ_KEY, isQuizRound)
  // A finished round is stale — treat as absent.
  return r && r.idx < r.questions.length ? r : null
}

export function saveQuizRound(round: StoredQuizRound): void {
  write(QUIZ_KEY, round)
}

export function clearQuizRound(): void {
  remove(QUIZ_KEY)
}

export function loadMissionRound(): StoredMissionRound | null {
  const r = read(MISSIONS_KEY, isMissionRound)
  return r && r.idx < r.missions.length ? r : null
}

export function saveMissionRound(round: StoredMissionRound): void {
  write(MISSIONS_KEY, round)
}

export function clearMissionRound(): void {
  remove(MISSIONS_KEY)
}

export function loadParkRound(): StoredParkRound | null {
  const r = read(PARK_KEY, isParkRound)
  return r && r.idx < r.tasks.length ? r : null
}

export function saveParkRound(round: StoredParkRound): void {
  write(PARK_KEY, round)
}

export function clearParkRound(): void {
  remove(PARK_KEY)
}

/** "1m 32s" / "47s" — for the result screen's time-taken line. */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}
