import { describe, it, expect, beforeEach } from 'vitest'
import { loadProfile, saveProfile, DEFAULT_PROFILE, STORAGE_KEY } from './profileStore'

describe('profileStore', () => {
  beforeEach(() => localStorage.clear())

  it('returns the default profile when storage is empty', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE)
  })

  it('default profile has 10 levels, totalStars 0, and show24h true', () => {
    expect(DEFAULT_PROFILE.progress.totalStars).toBe(0)
    expect(DEFAULT_PROFILE.settings.show24h).toBe(true)
    expect(Object.keys(DEFAULT_PROFILE.progress.starsByLevel)).toHaveLength(10)
    for (let l = 1; l <= 10; l++) {
      expect(DEFAULT_PROFILE.progress.starsByLevel[l as keyof typeof DEFAULT_PROFILE.progress.starsByLevel]).toBe(0)
    }
  })

  it('persists and reloads a profile', () => {
    const p = structuredClone(DEFAULT_PROFILE)
    p.settings.snap = 5
    p.progress.unlockedLevel = 2
    p.progress.totalStars = 7
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
    // An older profile saved before `showSeconds`/`show24h` existed: it must come
    // back with the defaults, while preserving stored values.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { snap: 5, showWords: false, voice: true, dayNight: true, showHandLegend: false },
        progress: { unlockedLevel: 2, starsByLevel: { 1: 5, 2: 3, 3: 0 } },
      }),
    )
    const loaded = loadProfile()
    expect(loaded.settings.showSeconds).toBe(false)
    expect(loaded.settings.show24h).toBe(true)
    expect(loaded.settings.snap).toBe(5)
    expect(loaded.settings.showWords).toBe(false)
    expect(loaded.settings.dayNight).toBe(true)
    expect(loaded.settings.showHandLegend).toBe(false)
    expect(loaded.progress.unlockedLevel).toBe(2)
    expect(loaded.progress.starsByLevel[1]).toBe(5)
  })

  it('upgrades an old 3-level profile to the 10-level shape with new defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { snap: 5, showWords: true, voice: true, dayNight: false, showHandLegend: true },
        progress: { unlockedLevel: 2, starsByLevel: { 1: 5, 2: 3 } },
      }),
    )
    const loaded = loadProfile()
    expect(loaded.progress.totalStars).toBe(0)
    expect(loaded.settings.show24h).toBe(true)
    expect(loaded.progress.unlockedLevel).toBe(2)
    expect(loaded.progress.starsByLevel[1]).toBe(5)
    expect(loaded.progress.starsByLevel[2]).toBe(3)
    for (let l = 3; l <= 10; l++) {
      expect(loaded.progress.starsByLevel[l as keyof typeof loaded.progress.starsByLevel]).toBe(0)
    }
  })
})
