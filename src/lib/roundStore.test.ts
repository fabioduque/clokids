import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadQuizRound,
  saveQuizRound,
  clearQuizRound,
  loadMissionRound,
  saveMissionRound,
  clearMissionRound,
  fmtDuration,
  type StoredQuizRound,
  type StoredMissionRound,
} from './roundStore'
import type { Question } from './quiz'
import type { Mission } from './missions'

const q = (correct: number): Question => ({
  direction: 'analogToDigital',
  correct,
  options: [correct, correct + 5, correct + 10, correct + 15],
  is24h: false,
})

const m = (correct: number): Mission => ({
  kind: 'until',
  emoji: '🏫',
  text: 'Saímos às 8h30. Daqui a quantos minutos?',
  clockTotal: 8 * 60,
  wedgeFromMin: 0,
  wedgeToMin: 30,
  correct,
  options: [correct, correct + 5, correct - 5, correct + 10],
  answerIsTime: false,
})

describe('roundStore', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a quiz round', () => {
    const round: StoredQuizRound = { level: 3, questions: [q(60), q(120)], idx: 1, score: 1, startedAt: 12345, elapsedMs: 9000 }
    saveQuizRound(round)
    expect(loadQuizRound()).toEqual(round)
  })

  it('round-trips a mission round', () => {
    const round: StoredMissionRound = { missions: [m(30), m(15)], idx: 0, score: 0, startedAt: 999, elapsedMs: 0 }
    saveMissionRound(round)
    expect(loadMissionRound()).toEqual(round)
  })

  it('treats a FINISHED round as absent', () => {
    saveQuizRound({ level: 1, questions: [q(60)], idx: 1, score: 1, startedAt: 1, elapsedMs: 5 })
    expect(loadQuizRound()).toBeNull()
    saveMissionRound({ missions: [m(5)], idx: 1, score: 0, startedAt: 1, elapsedMs: 5 })
    expect(loadMissionRound()).toBeNull()
  })

  it('survives corrupt or wrong-shaped storage', () => {
    localStorage.setItem('relogio.round.quiz.v1', '{nope')
    expect(loadQuizRound()).toBeNull()
    localStorage.setItem('relogio.round.quiz.v1', JSON.stringify({ level: 1 }))
    expect(loadQuizRound()).toBeNull()
    localStorage.setItem('relogio.round.missions.v1', JSON.stringify({ missions: [] }))
    expect(loadMissionRound()).toBeNull()
    // pre-elapsedMs payloads (old format) are discarded, not crashed on
    localStorage.setItem('relogio.round.quiz.v1', JSON.stringify({ level: 1, questions: [{ correct: 1 }], idx: 0, score: 0, startedAt: 1 }))
    expect(loadQuizRound()).toBeNull()
  })

  it('clears', () => {
    saveQuizRound({ level: 1, questions: [q(60)], idx: 0, score: 0, startedAt: 1, elapsedMs: 5 })
    clearQuizRound()
    expect(loadQuizRound()).toBeNull()
    saveMissionRound({ missions: [m(5)], idx: 0, score: 0, startedAt: 1, elapsedMs: 5 })
    clearMissionRound()
    expect(loadMissionRound()).toBeNull()
  })
})

describe('fmtDuration', () => {
  it('formats seconds and minutes', () => {
    expect(fmtDuration(47_000)).toBe('47s')
    expect(fmtDuration(92_000)).toBe('1m 32s')
    expect(fmtDuration(60_000)).toBe('1m 00s')
    expect(fmtDuration(-5)).toBe('0s')
  })
})
