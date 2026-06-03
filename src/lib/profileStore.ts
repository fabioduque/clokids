import type { Level } from './quiz'
import type { Lang } from './i18n'

export interface Settings {
  snap: 15 | 5 | 1
  showWords: boolean
  voice: boolean
  dayNight: boolean // false = manhã, true = tarde/noite
  showHandLegend: boolean
  showSeconds: boolean
  show24h: boolean
  lang: Lang // UI + voice language; Portuguese by default
}

export interface Progress {
  unlockedLevel: Level
  totalStars: number // cumulative stars earned (used by the top-bar; incremented per correct answer by the UI)
  starsByLevel: Record<Level, number> // best score per level (0..5)
  missionsUnlocked: boolean // one-time unlock of "Missões do Tempo" (costs stars)
}

export interface Profile {
  settings: Settings
  progress: Progress
}

export const STORAGE_KEY = 'relogio.profile.v1'

export const DEFAULT_PROFILE: Profile = {
  settings: {
    snap: 15,
    showWords: true,
    voice: true,
    dayNight: false,
    showHandLegend: true,
    showSeconds: false,
    show24h: false,
    lang: 'pt',
  },
  progress: {
    unlockedLevel: 1,
    totalStars: 0,
    starsByLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
    missionsUnlocked: false,
  },
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_PROFILE)
    const parsed = JSON.parse(raw) as Profile
    // shallow shape guard: fall back if required keys are missing
    if (!parsed?.settings || !parsed?.progress) return structuredClone(DEFAULT_PROFILE)
    // Deep-ish merge so older profiles (3 levels, no totalStars, no show24h) come
    // back with every new key defaulted, while preserving stored values.
    return {
      settings: { ...DEFAULT_PROFILE.settings, ...parsed.settings },
      progress: {
        ...DEFAULT_PROFILE.progress,
        ...parsed.progress,
        starsByLevel: { ...DEFAULT_PROFILE.progress.starsByLevel, ...(parsed.progress?.starsByLevel ?? {}) },
      },
    }
  } catch {
    return structuredClone(DEFAULT_PROFILE)
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
