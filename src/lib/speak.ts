import type { Lang } from './i18n'

// Speech comes from the BROWSER's speechSynthesis — i.e. the voices installed
// on the user's OS. Quality varies wildly: macOS alone ships ~20 "novelty"
// voices (Albert, Fred, Zarvox, …) that genuinely terrify children, and a
// naive "first matching voice" pick lands on Albert (alphabetical!). So we
// rank: user's explicit choice → known-good names → exact locale → on-device →
// anything — with novelty voices strictly as a last resort.

const PREFERRED_LOCALE: Record<Lang, string> = { pt: 'pt-pt', en: 'en-us' }

// macOS novelty/character voices (base names). Never pick these unless they
// are literally the only option.
const NOVELTY = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'breaks', 'bubbles', 'cellos',
  'deranged', 'fred', 'good news', 'hysterical', 'jester', 'junior', 'kathy',
  'organ', 'pipe organ', 'princess', 'ralph', 'superstar', 'trinoids',
  'whisper', 'wobble', 'zarvox', 'grandma', 'grandpa', 'rocko', 'shelley',
  'eddy', 'flo', 'reed', 'sandy',
])

// Known high-quality voices per language, best first (macOS, Chrome, Windows).
const QUALITY_NAMES: Record<Lang, string[]> = {
  pt: ['joana', 'catarina', 'luciana', 'francisca', 'google português'],
  en: ['samantha', 'ava', 'allison', 'susan', 'zoe', 'alex', 'google us english', 'aria', 'jenny', 'zira', 'david'],
}

function baseName(v: SpeechSynthesisVoice): string {
  return (v.name ?? '').toLowerCase().split('(')[0].trim()
}

function isNovelty(v: SpeechSynthesisVoice): boolean {
  return NOVELTY.has(baseName(v))
}

function qualityRank(v: SpeechSynthesisVoice, lang: Lang): number {
  const n = (v.name ?? '').toLowerCase()
  const i = QUALITY_NAMES[lang].findIndex((q) => n.includes(q))
  return i === -1 ? 99 : i
}

function langOf(v: SpeechSynthesisVoice): string {
  return (v.lang ?? '').toLowerCase().replace('_', '-')
}

// The parent's explicit choice (Settings), per language. Set by the App when
// the profile loads/changes; voiceURI of the chosen voice.
const chosenVoice: Partial<Record<Lang, string>> = {}

export function setPreferredVoice(lang: Lang, voiceURI: string | undefined): void {
  chosenVoice[lang] = voiceURI
}

// Reading speed (utterance.rate). 0.9 reads calmly for kids; the Settings
// page offers slow/normal/fast.
let speechRate = 0.9

export function setSpeechRate(rate: number): void {
  speechRate = rate
}

/** All voices for a language, best first — for the Settings picker. */
export function listVoices(lang: Lang, voices?: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const all = voices ?? (synth()?.getVoices() ?? [])
  return all.filter((v) => langOf(v).startsWith(lang)).sort((a, b) => score(a, lang) - score(b, lang))
}

// Lower is better. Lexicographic tuple folded into one number:
// novelty → exact locale → quality-list position → on-device → default flag.
function score(v: SpeechSynthesisVoice, lang: Lang): number {
  const novelty = isNovelty(v) ? 1 : 0
  const exact = langOf(v) === PREFERRED_LOCALE[lang] ? 0 : 1
  const quality = qualityRank(v, lang)
  const local = v.localService ? 0 : 1
  const dflt = v.default ? 0 : 1
  return novelty * 100000 + exact * 10000 + quality * 100 + local * 10 + dflt
}

export function pickVoice(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const candidates = voices.filter((v) => langOf(v).startsWith(lang))
  if (candidates.length === 0) return null
  // The user's explicit pick always wins (if it still exists on this device).
  const wanted = chosenVoice[lang]
  if (wanted) {
    const match = candidates.find((v) => v.voiceURI === wanted)
    if (match) return match
  }
  return [...candidates].sort((a, b) => score(a, lang) - score(b, lang))[0]
}

/** Back-compat alias used by older tests. */
export function pickPortugueseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return pickVoice('pt', voices)
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null
}

export function isVoiceAvailable(lang: Lang = 'pt'): boolean {
  try {
    const s = synth()
    return !!s && pickVoice(lang, s.getVoices()) !== null
  } catch {
    return false
  }
}

export function speak(text: string, lang: Lang = 'pt'): void {
  // Defensive throughout: speechSynthesis is flaky in the wild (some Android
  // builds throw on voice assignment or mid-speak). Speech is a nice-to-have —
  // it must NEVER take the app down with an uncaught exception.
  try {
    const s = synth()
    if (!s) return
    const voice = pickVoice(lang, s.getVoices())
    if (!voice) return
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    // Pin the locale so a dropped voice still falls back to the right language.
    u.lang = lang === 'pt' ? 'pt-PT' : 'en-US'
    u.rate = speechRate
    if (s.speaking || s.pending) {
      // Chrome can drop the assigned voice if cancel() and speak() run in the same tick.
      s.cancel()
      setTimeout(() => {
        try {
          s.speak(u)
        } catch {
          /* ignore: see above */
        }
      }, 80)
    } else {
      s.speak(u)
    }
  } catch {
    /* ignore: see above */
  }
}

// Voices may load asynchronously; call this so callers can re-check
// isVoiceAvailable() after the list populates. Returns a cleanup function
// (call it on unmount) so it composes with React useEffect.
export function onVoicesReady(cb: () => void): () => void {
  const s = synth()
  if (!s) return () => {}
  try {
    if (s.getVoices().length > 0) cb()
    s.addEventListener('voiceschanged', cb)
    return () => s.removeEventListener('voiceschanged', cb)
  } catch {
    return () => {}
  }
}
