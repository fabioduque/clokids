import { useEffect, useState } from 'react'
import { isVoiceAvailable, onVoicesReady, speak } from '../lib/speak'
import { useLang, useT } from '../lib/i18n'

export interface ListenButtonProps {
  text: string
  enabled?: boolean
  /** Override the button styling (e.g. a compact orbit pill). */
  className?: string
}

export function ListenButton({ text, enabled = true, className }: ListenButtonProps) {
  const lang = useLang()
  const ui = useT()
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    const check = () => setAvailable(isVoiceAvailable(lang))
    check()
    return onVoicesReady(check) // onVoicesReady returns a cleanup fn
  }, [lang])
  if (!enabled || !available) return null
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      aria-label={ui.listenAria(text)}
      className={className ?? 'btn-sun inline-flex items-center gap-2'}
    >
      {ui.listen}
    </button>
  )
}
