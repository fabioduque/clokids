export const MINUTES_IN_DAY = 1440

export function mod1440(n: number): number {
  return ((n % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
}

export function split(total: number): { hour24: number; minute: number } {
  const t = mod1440(total)
  return { hour24: Math.floor(t / 60), minute: t % 60 }
}

export function snap(total: number, step: number): number {
  return mod1440(Math.round(total / step) * step)
}

export function angles(total: number): { hour: number; minute: number } {
  const { hour24, minute } = split(total)
  return { hour: (hour24 % 12) * 30 + minute * 0.5, minute: minute * 6 }
}

// Masculine cardinals 0..29 (used for minutes).
const UNITS_M = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete',
  'dezoito', 'dezanove', 'vinte', 'vinte e um', 'vinte e dois', 'vinte e três',
  'vinte e quatro', 'vinte e cinco', 'vinte e seis', 'vinte e sete',
  'vinte e oito', 'vinte e nove',
]

// Feminine hour names 1..12 (clock hours agree with "hora/horas").
const HOURS_F = [
  '', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete',
  'oito', 'nove', 'dez', 'onze', 'doze',
]

export function hour12Of(hour24: number): number {
  return ((hour24 + 11) % 12) + 1
}

export function toWords(hour24: number, minute: number): string {
  const h = hour12Of(hour24)
  // base name of the *current* hour for the "e ..." side
  const baseName =
    hour24 === 0 ? 'meia-noite' : hour24 === 12 ? 'meio-dia' : HOURS_F[h]

  if (minute === 0) {
    if (hour24 === 0) return 'meia-noite'
    if (hour24 === 12) return 'meio-dia'
    return h === 1 ? 'uma hora' : `${HOURS_F[h]} horas`
  }
  if (minute === 30) return `${baseName} e meia`
  if (minute < 30) {
    const m = minute === 15 ? 'um quarto' : UNITS_M[minute]
    return `${baseName} e ${m}`
  }
  // minute > 30 -> "<n> para <article> <next hour>"
  const toMin = 60 - minute
  const toWord = toMin === 15 ? 'um quarto' : UNITS_M[toMin]
  const next24 = (hour24 + 1) % 24
  let nextName: string
  let article: string
  if (next24 === 0) {
    nextName = 'meia-noite'
    article = 'a'
  } else if (next24 === 12) {
    nextName = 'meio-dia'
    article = 'o'
  } else {
    const hn = hour12Of(next24)
    nextName = HOURS_F[hn]
    article = hn === 1 ? 'a' : 'as'
  }
  return `${toWord} para ${article} ${nextName}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function format24(total: number): string {
  const { hour24, minute } = split(total)
  return `${pad2(hour24)}:${pad2(minute)}`
}

export function periodWord(hour24: number): 'da manhã' | 'da tarde' | 'da noite' {
  if (hour24 < 12) return 'da manhã'
  if (hour24 < 20) return 'da tarde'
  return 'da noite'
}

export function format12(total: number): string {
  const { hour24, minute } = split(total)
  return `${hour12Of(hour24)}:${pad2(minute)} ${periodWord(hour24)}`
}

export function isPM(hour24: number): boolean {
  return hour24 >= 12
}

export function toTotal(h12: number, minute: number, pm: boolean): number {
  const base = h12 % 12 // 12 -> 0
  const hour24 = pm ? base + 12 : base
  return mod1440(hour24 * 60 + minute)
}

// Tens words, index = tens digit (used for minute cardinals 30..59).
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta']

function minuteCardinal(n: number): string {
  if (n < 30) return UNITS_M[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]} e ${UNITS_M[u]}`
}

export function toSpokenWords(hour24: number, minute: number, withPeriod = true): string {
  const h = hour12Of(hour24)
  const hWord = HOURS_F[h]
  const suffix = withPeriod ? ` ${periodWord(hour24)}` : ''
  if (minute === 0) return `${hWord} ${h === 1 ? 'hora' : 'horas'}${suffix}`
  return `${hWord} e ${minuteCardinal(minute)}${suffix}`
}

// Given the current total minutes and a new snapped minute-of-hour (0..59)
// chosen by dragging the minute hand, return the new total minutes, carrying
// the hour across the 12 o'clock boundary based on rotation direction.
export function minuteDragTotal(currentTotal: number, snappedMinute: number): number {
  const cur = split(currentTotal)
  const diff = snappedMinute - cur.minute
  let hourDelta = 0
  if (diff < -30) hourDelta = 1 // crossed 12 going forward (e.g. 59 -> 0)
  else if (diff > 30) hourDelta = -1 // crossed 12 going backward (e.g. 0 -> 59)
  return mod1440((cur.hour24 + hourDelta) * 60 + snappedMinute)
}
