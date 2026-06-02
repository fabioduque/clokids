import { describe, it, expect } from 'vitest'
import { mod1440, split, snap, angles, toWords, format24, format12, periodWord, toTotal, isPM, hour12Of, toSpokenWords, minuteDragTotal } from './timeModel'

describe('mod1440', () => {
  it('wraps negative and overflow into 0..1439', () => {
    expect(mod1440(-1)).toBe(1439)
    expect(mod1440(1440)).toBe(0)
    expect(mod1440(1500)).toBe(60)
  })
})

describe('split', () => {
  it('splits total minutes into hour24 and minute', () => {
    expect(split(0)).toEqual({ hour24: 0, minute: 0 })
    expect(split(945)).toEqual({ hour24: 15, minute: 45 }) // 15:45
    expect(split(1439)).toEqual({ hour24: 23, minute: 59 })
  })
})

describe('snap', () => {
  it('snaps to nearest multiple of step, wrapping the day', () => {
    expect(snap(53, 15)).toBe(60)   // nearest quarter is next hour
    expect(snap(52, 5)).toBe(50)
    expect(snap(53, 1)).toBe(53)
    expect(snap(1438, 15)).toBe(0)  // wraps to midnight
  })
})

describe('angles', () => {
  it('computes hour and minute hand angles in degrees from 12 o\'clock', () => {
    expect(angles(0)).toEqual({ hour: 0, minute: 0 })
    expect(angles(180)).toEqual({ hour: 90, minute: 0 })   // 03:00
    expect(angles(190).minute).toBe(60)                    // 10 min -> 60deg
    expect(angles(190).hour).toBeCloseTo(95, 5)            // 3h + 10min => 95deg
  })
})

describe('toWords (pt-PT)', () => {
  const cases: Array<[number, number, string]> = [
    [3, 0, 'três horas'],
    [1, 0, 'uma hora'],
    [12, 0, 'meio-dia'],
    [0, 0, 'meia-noite'],
    [3, 5, 'três e cinco'],
    [3, 15, 'três e um quarto'],
    [3, 25, 'três e vinte e cinco'],
    [3, 30, 'três e meia'],
    [12, 30, 'meio-dia e meia'],
    [0, 30, 'meia-noite e meia'],
    [15, 40, 'vinte para as quatro'],
    [15, 45, 'um quarto para as quatro'],
    [12, 45, 'um quarto para a uma'],   // next hour is 1 -> "a uma"
    [11, 50, 'dez para o meio-dia'],
    [23, 55, 'cinco para a meia-noite'],
    [1, 30, 'uma e meia'],
    [2, 0, 'duas horas'],
  ]
  for (const [h, m, expected] of cases) {
    it(`${h}:${String(m).padStart(2, '0')} -> "${expected}"`, () => {
      expect(toWords(h, m)).toBe(expected)
    })
  }
})

describe('toSpokenWords (simple spoken form)', () => {
  const cases: Array<[number, number, string]> = [
    [15, 45, 'três e quarenta e cinco da tarde'],
    [3, 0, 'três horas da manhã'],
    [1, 0, 'uma hora da manhã'],
    [13, 30, 'uma e trinta da tarde'],
    [20, 5, 'oito e cinco da noite'],
    [0, 1, 'doze e um da manhã'],
    [12, 15, 'doze e quinze da tarde'],
    [9, 59, 'nove e cinquenta e nove da manhã'],
  ]
  for (const [h, m, expected] of cases) {
    it(`${h}:${String(m).padStart(2, '0')} -> "${expected}"`, () => {
      expect(toSpokenWords(h, m)).toBe(expected)
    })
  }
})

describe('format24', () => {
  it('zero-pads hours and minutes', () => {
    expect(format24(945)).toBe('15:45')
    expect(format24(5)).toBe('00:05')
  })
})

describe('format12 + period', () => {
  it('shows 12h number with period word', () => {
    expect(format12(945)).toBe('3:45 da tarde')
    expect(format12(65)).toBe('1:05 da manhã')
    expect(format12(1230)).toBe('8:30 da noite') // 20:30
  })
  it('periodWord buckets the day', () => {
    expect(periodWord(9)).toBe('da manhã')
    expect(periodWord(15)).toBe('da tarde')
    expect(periodWord(22)).toBe('da noite')
  })
})

describe('minuteDragTotal (hour carry across 12)', () => {
  it('advances the hour when crossing 12 forward', () => {
    expect(minuteDragTotal(59, 0)).toBe(60)      // 00:59 -> 01:00
    expect(minuteDragTotal(119, 0)).toBe(120)    // 01:59 -> 02:00
  })
  it('decrements the hour when crossing 12 backward', () => {
    expect(minuteDragTotal(60, 59)).toBe(59)     // 01:00 -> 00:59
  })
  it('wraps the day at the boundaries', () => {
    expect(minuteDragTotal(1439, 0)).toBe(0)     // 23:59 -> 00:00
    expect(minuteDragTotal(0, 59)).toBe(1439)    // 00:00 -> 23:59
  })
  it('does not change the hour for normal in-hour moves', () => {
    expect(minuteDragTotal(180, 5)).toBe(185)    // 03:00 -> 03:05
    expect(minuteDragTotal(195, 10)).toBe(190)   // 03:15 -> 03:10
  })
})

describe('day/night conversion', () => {
  it('hour12Of maps 24h to 1..12', () => {
    expect(hour12Of(0)).toBe(12)
    expect(hour12Of(13)).toBe(1)
    expect(hour12Of(12)).toBe(12)
  })
  it('isPM is true for 12..23', () => {
    expect(isPM(11)).toBe(false)
    expect(isPM(12)).toBe(true)
    expect(isPM(23)).toBe(true)
  })
  it('toTotal builds total minutes from 12h hour, minute, and pm flag', () => {
    expect(toTotal(3, 45, true)).toBe(945)   // 15:45
    expect(toTotal(12, 0, false)).toBe(0)     // midnight
    expect(toTotal(12, 0, true)).toBe(720)    // noon
    expect(toTotal(1, 0, false)).toBe(60)     // 01:00
  })
})
