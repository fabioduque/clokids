export function pickPortugueseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const isPtPT = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase() === 'pt-pt'
  const isPt = (v: SpeechSynthesisVoice) => !!v.lang?.toLowerCase().startsWith('pt')
  return (
    voices.find((v) => isPtPT(v) && v.localService) ??
    voices.find(isPtPT) ??
    voices.find((v) => isPt(v) && v.localService) ??
    voices.find(isPt) ??
    null
  )
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null
}

export function isVoiceAvailable(): boolean {
  const s = synth()
  return !!s && pickPortugueseVoice(s.getVoices()) !== null
}

export function speak(text: string): void {
  const s = synth()
  if (!s) return
  const voice = pickPortugueseVoice(s.getVoices())
  if (!voice) return
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = 'pt-PT' // pin the locale so a dropped voice still falls back to Portuguese, never English
  u.rate = 0.9
  if (s.speaking || s.pending) {
    // Chrome can drop the assigned voice if cancel() and speak() run in the same tick.
    s.cancel()
    setTimeout(() => s.speak(u), 80)
  } else {
    s.speak(u)
  }
}

// Voices may load asynchronously; call this so callers can re-check
// isVoiceAvailable() after the list populates. Returns a cleanup function
// (call it on unmount) so it composes with React useEffect.
export function onVoicesReady(cb: () => void): () => void {
  const s = synth()
  if (!s) return () => {}
  if (s.getVoices().length > 0) cb()
  s.addEventListener('voiceschanged', cb)
  return () => s.removeEventListener('voiceschanged', cb)
}
