// English (US) time words, mirroring the pt-PT engine in timeModel.ts:
// "three o'clock", "quarter past three", "half past three", "quarter to four",
// "three oh five", "three twenty-five" — plus AM/PM for the digital line.

import { hour12Of, split, mod1440 } from './timeModel'

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty']

function numberWord(n: number): string {
  if (n < 20) return ONES[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]}-${ONES[u]}`
}

export function periodWordEn(hour24: number): 'in the morning' | 'in the afternoon' | 'at night' {
  if (hour24 < 12) return 'in the morning'
  if (hour24 < 20) return 'in the afternoon'
  return 'at night'
}

export function toWordsEn(hour24: number, minute: number): string {
  const h = hour12Of(hour24)
  const hWord = ONES[h]
  const nextWord = hour24 + 1 === 12 ? 'noon' : hour24 + 1 === 24 ? 'midnight' : ONES[hour12Of(hour24 + 1)]
  if (minute === 0) {
    if (hour24 === 0) return 'midnight'
    if (hour24 === 12) return 'noon'
    return `${hWord} o'clock`
  }
  if (minute === 15) return `quarter past ${hWord}`
  if (minute === 30) return `half past ${hWord}`
  if (minute === 45) return `quarter to ${nextWord}`
  if (minute < 10) return `${hWord} oh ${ONES[minute]}`
  return `${hWord} ${numberWord(minute)}`
}

export function toSpokenWordsEn(hour24: number, minute: number, withPeriod = true): string {
  const base = toWordsEn(hour24, minute)
  if (base === 'midnight' || base === 'noon') return base
  return withPeriod ? `${base} ${periodWordEn(hour24)}` : base
}

/** "10:34 AM" — the US digital secondary line. */
export function format12En(total: number): string {
  const { hour24, minute } = split(mod1440(total))
  const ampm = hour24 < 12 ? 'AM' : 'PM'
  return `${hour12Of(hour24)}:${String(minute).padStart(2, '0')} ${ampm}`
}

/** "8:45" — how mission times read in English copy. */
export function fmtHourEn(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
