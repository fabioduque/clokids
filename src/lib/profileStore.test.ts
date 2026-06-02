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
})
