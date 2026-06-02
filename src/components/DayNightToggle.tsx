export interface DayNightToggleProps {
  pm: boolean // false = manhã, true = tarde/noite
  onChange: (pm: boolean) => void
}

export function DayNightToggle({ pm, onChange }: DayNightToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!pm)}
      aria-label={pm ? 'Tarde/noite — tocar para manhã' : 'Manhã — tocar para tarde/noite'}
      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-base font-bold shadow-md active:scale-95 transition-transform sm:py-2 sm:text-lg"
    >
      <span className={pm ? 'opacity-30' : ''}>☀️ Manhã</span>
      <span className="text-ink/30">|</span>
      <span className={pm ? '' : 'opacity-30'}>🌙 Tarde/Noite</span>
    </button>
  )
}
