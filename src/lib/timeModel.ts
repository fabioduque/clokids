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

function hour12(hour24: number): number {
  return ((hour24 + 11) % 12) + 1
}

export function toWords(hour24: number, minute: number): string {
  const h = hour12(hour24)
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
    const hn = hour12(next24)
    nextName = HOURS_F[hn]
    article = hn === 1 ? 'a' : 'as'
  }
  return `${toWord} para ${article} ${nextName}`
}
