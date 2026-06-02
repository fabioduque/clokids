import { useEffect, useState } from 'react'
import { isVoiceAvailable, onVoicesReady, speak } from '../lib/speak'

export interface ListenButtonProps {
  text: string
  enabled?: boolean
}

export function ListenButton({ text, enabled = true }: ListenButtonProps) {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    const check = () => setAvailable(isVoiceAvailable())
    check()
    return onVoicesReady(check) // onVoicesReady returns a cleanup fn
  }, [])
  if (!enabled || !available) return null
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={`Ouvir: ${text}`}
      className="rounded-full bg-ring px-5 py-3 text-lg font-extrabold text-white shadow-md active:scale-95 transition-transform"
    >
      🔊 Ouvir
    </button>
  )
}
