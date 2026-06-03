import type { Lang } from './i18n'

// Preferred locale per app language; we accept any same-language voice as a
// fallback (pt-BR for pt, en-GB for en, etc.).
const PREFERRED: Record<Lang, string> = { pt: 'pt-pt', en: 'en-us' }

export function pickVoice(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const exact = PREFERRED[lang]
  const isExact = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().replace('_', '-') === exact
  const isLang = (v: SpeechSynthesisVoice) => !!v.lang?.toLowerCase().startsWith(lang)
  return (
    voices.find((v) => isExact(v) && v.localService) ??
    voices.find(isExact) ??
    voices.find((v) => isLang(v) && v.localService) ??
    voices.find(isLang) ??
    null
  )
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
    u.rate = 0.9
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
