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
