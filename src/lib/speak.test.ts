import { describe, it, expect } from 'vitest'
import { pickPortugueseVoice } from './speak'

const v = (lang: string, local = true, name = lang): SpeechSynthesisVoice =>
  ({ lang, name, default: false, localService: local, voiceURI: name } as SpeechSynthesisVoice)

describe('pickPortugueseVoice', () => {
  it('prefers pt-PT, then any pt, else null', () => {
    expect(pickPortugueseVoice([v('en-US'), v('pt-BR'), v('pt-PT')])?.lang).toBe('pt-PT')
    expect(pickPortugueseVoice([v('en-US'), v('pt-BR')])?.lang).toBe('pt-BR')
    expect(pickPortugueseVoice([v('en-US'), v('fr-FR')])).toBeNull()
    expect(pickPortugueseVoice([])).toBeNull()
  })

  it('prefers on-device (localService) pt-PT over a remote pt-PT voice', () => {
    const picked = pickPortugueseVoice([v('pt-PT', false), v('pt-PT', true)])
    expect(picked?.localService).toBe(true)
  })
})
