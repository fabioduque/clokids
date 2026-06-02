export function pickPortugueseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return (
    voices.find((x) => x.lang?.toLowerCase() === 'pt-pt') ??
    voices.find((x) => x.lang?.toLowerCase().startsWith('pt')) ??
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
  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = 0.9
  s.speak(u)
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
