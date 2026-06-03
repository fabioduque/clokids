import { describe, it, expect } from 'vitest'
import { pickPortugueseVoice, pickVoice, setPreferredVoice, listVoices } from './speak'

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

describe('pickVoice quality ranking', () => {
  const nv = (name: string, lang = 'en-US', local = true): SpeechSynthesisVoice =>
    ({ lang, name, default: false, localService: local, voiceURI: name } as SpeechSynthesisVoice)

  it('never picks a novelty voice (Albert!) when a normal one exists', () => {
    // Alphabetical-first would pick Albert; quality ranking must not.
    expect(pickVoice('en', [nv('Albert'), nv('Samantha')])?.name).toBe('Samantha')
    expect(pickVoice('en', [nv('Zarvox'), nv('Fred'), nv('Aaron')])?.name).toBe('Aaron')
  })

  it('falls back to a novelty voice only when nothing else exists', () => {
    expect(pickVoice('en', [nv('Albert')])?.name).toBe('Albert')
  })

  it('prefers known-quality names over unknown ones', () => {
    expect(pickVoice('en', [nv('Aaron'), nv('Samantha')])?.name).toBe('Samantha')
    expect(pickVoice('pt', [nv('Amelie', 'pt-PT'), nv('Joana', 'pt-PT')])?.name).toBe('Joana')
  })

  it('honours the user-chosen voice when set', () => {
    setPreferredVoice('en', 'Aaron')
    expect(pickVoice('en', [nv('Aaron'), nv('Samantha')])?.name).toBe('Aaron')
    setPreferredVoice('en', undefined)
    expect(pickVoice('en', [nv('Aaron'), nv('Samantha')])?.name).toBe('Samantha')
  })

  it('lists voices best-first for the settings picker', () => {
    const names = listVoices('en', [nv('Albert'), nv('Aaron'), nv('Samantha')]).map((v) => v.name)
    expect(names).toEqual(['Samantha', 'Aaron', 'Albert'])
  })
})
