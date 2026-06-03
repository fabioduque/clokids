import { describe, it, expect } from 'vitest'
import { toWordsEn, toSpokenWordsEn, format12En, fmtHourEn, periodWordEn } from './timeWordsEn'

describe('toWordsEn', () => {
  it('handles the landmark minutes', () => {
    expect(toWordsEn(3, 0)).toBe("three o'clock")
    expect(toWordsEn(3, 15)).toBe('quarter past three')
    expect(toWordsEn(3, 30)).toBe('half past three')
    expect(toWordsEn(3, 45)).toBe('quarter to four')
  })

  it('reads plain minutes digitally', () => {
    expect(toWordsEn(3, 5)).toBe('three oh five')
    expect(toWordsEn(3, 25)).toBe('three twenty-five')
    expect(toWordsEn(10, 40)).toBe('ten forty')
  })

  it('handles noon and midnight', () => {
    expect(toWordsEn(0, 0)).toBe('midnight')
    expect(toWordsEn(12, 0)).toBe('noon')
    expect(toWordsEn(11, 45)).toBe('quarter to noon')
    expect(toWordsEn(23, 45)).toBe('quarter to midnight')
  })

  it('crosses the hour for quarter-to', () => {
    expect(toWordsEn(12, 45)).toBe('quarter to one')
  })
})

describe('toSpokenWordsEn', () => {
  it('appends the day period', () => {
    expect(toSpokenWordsEn(9, 30)).toBe('half past nine in the morning')
    expect(toSpokenWordsEn(15, 0)).toBe("three o'clock in the afternoon")
    expect(toSpokenWordsEn(21, 10)).toBe('nine ten at night')
  })

  it('never decorates noon/midnight', () => {
    expect(toSpokenWordsEn(12, 0)).toBe('noon')
  })
})

describe('format helpers', () => {
  it('format12En uses AM/PM', () => {
    expect(format12En(10 * 60 + 34)).toBe('10:34 AM')
    expect(format12En(15 * 60 + 5)).toBe('3:05 PM')
    expect(format12En(0)).toBe('12:00 AM')
  })

  it('fmtHourEn renders mission times', () => {
    expect(fmtHourEn(8 * 60 + 45)).toBe('8:45')
    expect(fmtHourEn(10 * 60)).toBe('10:00')
  })

  it('periodWordEn buckets the day', () => {
    expect(periodWordEn(8)).toBe('in the morning')
    expect(periodWordEn(14)).toBe('in the afternoon')
    expect(periodWordEn(21)).toBe('at night')
  })
})
