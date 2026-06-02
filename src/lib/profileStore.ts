import type { Level } from './quiz'

export interface Settings {
  snap: 15 | 5 | 1
  showWords: boolean
  voice: boolean
  dayNight: boolean // false = manhã, true = tarde/noite
  showHandLegend: boolean
}

export interface Progress {
  unlockedLevel: Level
  starsByLevel: Record<Level, number>
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
  },
  progress: {
    unlockedLevel: 1,
    starsByLevel: { 1: 0, 2: 0, 3: 0 },
  },
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_PROFILE)
    const parsed = JSON.parse(raw) as Profile
    // shallow shape guard: fall back if required keys are missing
    if (!parsed?.settings || !parsed?.progress) return structuredClone(DEFAULT_PROFILE)
    return structuredClone(parsed)
  } catch {
    return structuredClone(DEFAULT_PROFILE)
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
