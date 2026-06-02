import { describe, it, expect } from 'vitest'
import { pickPortugueseVoice } from './speak'

const v = (lang: string, name = lang): SpeechSynthesisVoice =>
  ({ lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice)

describe('pickPortugueseVoice', () => {
  it('prefers pt-PT, then any pt, else null', () => {
    expect(pickPortugueseVoice([v('en-US'), v('pt-BR'), v('pt-PT')])?.lang).toBe('pt-PT')
    expect(pickPortugueseVoice([v('en-US'), v('pt-BR')])?.lang).toBe('pt-BR')
    expect(pickPortugueseVoice([v('en-US'), v('fr-FR')])).toBeNull()
    expect(pickPortugueseVoice([])).toBeNull()
  })
})
