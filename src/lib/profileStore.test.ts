import { describe, it, expect, beforeEach } from 'vitest'
import { loadProfile, saveProfile, DEFAULT_PROFILE, STORAGE_KEY } from './profileStore'

describe('profileStore', () => {
  beforeEach(() => localStorage.clear())

  it('returns the default profile when storage is empty', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('persists and reloads a profile', () => {
    const p = structuredClone(DEFAULT_PROFILE)
    p.settings.snap = 5
    p.progress.unlockedLevel = 2
    p.progress.starsByLevel[1] = 5
    saveProfile(p)
    expect(loadProfile()).toEqual(p)
  })

  it('falls back to default on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('falls back to default when required keys are missing', () => {
    localStorage.setItem(STORAGE_KEY, '{"settings":null}')
    expect(loadProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('merges defaults for settings missing from an older stored profile', () => {
    // An older profile saved before `showSeconds` existed: it must come back
    // with showSeconds === false (the default), while preserving stored values.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { snap: 5, showWords: false, voice: true, dayNight: true, showHandLegend: false },
        progress: { unlockedLevel: 2, starsByLevel: { 1: 5, 2: 3, 3: 0 } },
      }),
    )
    const loaded = loadProfile()
    expect(loaded.settings.showSeconds).toBe(false)
    expect(loaded.settings.snap).toBe(5)
    expect(loaded.settings.showWords).toBe(false)
    expect(loaded.settings.dayNight).toBe(true)
    expect(loaded.settings.showHandLegend).toBe(false)
    expect(loaded.progress.unlockedLevel).toBe(2)
    expect(loaded.progress.starsByLevel[1]).toBe(5)
  })
})
