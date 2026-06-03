// The living sky: maps a time-of-day (minutes from midnight) to an atmosphere —
// a three-stop vertical gradient plus the sun or moon arcing overhead and a
// starfield that fades in at night. This is what makes "horas" tangible for a
// child: drag the clock in Brincar and the whole world changes from dawn to
// midnight. Pure + deterministic so it's trivially testable and cheap to call
// on every render / drag frame.

import { mod1440 } from './timeModel'

export interface SkyBody {
  /** Horizontal position across the viewport, 0–100 (%). */
  x: number
  /** Vertical position, 0 (top) – 100 (horizon), %. */
  y: number
  /** 0 at the horizon → 1 at peak altitude; drives size + glow strength. */
  altitude: number
}

export interface Sky {
  /** Top, middle and bottom gradient colours (hex). */
  stops: [string, string, string]
  /** The sun, when it is above the horizon (else null). */
  sun: SkyBody | null
  /** The moon, when it is above the horizon (else null). */
  moon: SkyBody | null
  /** Star visibility, 0 (day) → 1 (deep night). */
  starOpacity: number
  /** True while the sun is below the horizon — for any dark-mode hinting. */
  isNight: boolean
}

// Sunrise / sunset anchors (decimal hours). Kept child-simple and symmetric;
// the exact astronomy doesn't matter, the *feeling* of day vs night does.
const SUNRISE = 6.5
const SUNSET = 19

// Gradient keyframes around the 24h clock. Each is [hour, [top, mid, bottom]].
// Colours interpolate between neighbours so every minute has its own sky.
const KEYS: Array<[number, [string, string, string]]> = [
  [0, ['#0A1026', '#141B3F', '#26305C']], // deep night
  [5, ['#171F47', '#3A3A6E', '#6E5A86']], // last dark before dawn
  [6.5, ['#48508F', '#B5708F', '#F3A86B']], // dawn — peach horizon
  [8, ['#5AA8E0', '#9FD2F1', '#FBEACB']], // early morning
  [12, ['#2E9BE6', '#82CBF0', '#E9F7FC']], // bright midday
  [16, ['#3F9BDB', '#8FC4E9', '#FBE7C2']], // warm afternoon
  [19, ['#2C457A', '#C56B54', '#F4A65A']], // sunset — golden/orange
  [20.5, ['#1C2A5E', '#553C74', '#A85D78']], // twilight
  [22, ['#101839', '#1F2856', '#343E6E']], // night settling
  [24, ['#0A1026', '#141B3F', '#26305C']], // wrap to midnight
]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t))
}

function gradientAt(hour: number): [string, string, string] {
  // Find the two keyframes bracketing `hour` and blend between them.
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, c0] = KEYS[i]
    const [h1, c1] = KEYS[i + 1]
    if (hour >= h0 && hour <= h1) {
      const t = h1 === h0 ? 0 : (hour - h0) / (h1 - h0)
      return [
        lerpColor(c0[0], c1[0], t),
        lerpColor(c0[1], c1[1], t),
        lerpColor(c0[2], c1[2], t),
      ]
    }
  }
  return KEYS[0][1]
}

// Position a celestial body on a gentle arc between its rise and set. The arc
// runs left→right (east→west) and bows up to a peak at the midpoint.
function arc(hour: number, rise: number, set: number): SkyBody {
  const p = (hour - rise) / (set - rise) // 0 at rise, 1 at set
  const altitude = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI) // 0→1→0
  return {
    x: lerp(8, 92, p),
    y: lerp(78, 12, altitude), // horizon (78%) up to high (12%)
    altitude,
  }
}

export function skyAt(total: number): Sky {
  const hour = mod1440(total) / 60
  const stops = gradientAt(hour)

  // Sun is up between sunrise and sunset.
  const sunUp = hour >= SUNRISE && hour <= SUNSET
  const sun = sunUp ? arc(hour, SUNRISE, SUNSET) : null

  // Moon fills the rest of the cycle. Shift night hours onto a single 0..1 arc
  // that spans sunset→(next) sunrise so it rises in the east after dusk.
  let moon: SkyBody | null = null
  if (!sunUp) {
    const nightLen = 24 - SUNSET + SUNRISE
    const since = hour >= SUNSET ? hour - SUNSET : hour + (24 - SUNSET)
    const p = since / nightLen
    const altitude = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI)
    moon = { x: lerp(8, 92, p), y: lerp(78, 12, altitude), altitude }
  }

  // Stars: invisible in full day, ramping up through dusk into deep night.
  // Build a smooth 0→1 envelope that is 0 across the bright day and 1 at night.
  const starOpacity = sunUp
    ? // brief afterglow just inside sunrise/sunset where it's still dim
      Math.max(
        hour < SUNRISE + 0.75 ? (SUNRISE + 0.75 - hour) / 0.75 : 0,
        hour > SUNSET - 0.75 ? (hour - (SUNSET - 0.75)) / 0.75 : 0,
      ) * 0.4
    : 1

  return { stops, sun, moon, starOpacity: Math.max(0, Math.min(1, starOpacity)), isNight: !sunUp }
}
