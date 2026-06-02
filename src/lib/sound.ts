// Tiny Web Audio helper for gentle, friendly quiz feedback sounds.
// No asset files: everything is synthesized from soft sine tones at low gain
// so it feels kind to small children (a happy chime, never a harsh buzzer).

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = ctx ?? new AC()
    return ctx
  } catch {
    return null
  }
}

// One soft sine note with a quick fade-in and smooth fade-out.
function tone(freq: number, start: number, dur: number, gain = 0.1) {
  const ac = audio()
  if (!ac) return
  try {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t0 = ac.currentTime + start
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  } catch {
    // ignore: audio is a nice-to-have, never block the UI
  }
}

// Pleasant two-note ascending chime — happy but soft.
export function playSuccess(): void {
  tone(660, 0, 0.16, 0.1)
  tone(880, 0.12, 0.2, 0.1)
}

// Gentle two-note descending "try again" — kind, not punishing.
export function playError(): void {
  tone(400, 0, 0.18, 0.08)
  tone(320, 0.14, 0.24, 0.08)
}
