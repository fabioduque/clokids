import { useT } from '../lib/i18n'

export interface DayNightToggleProps {
  pm: boolean // false = manhã, true = tarde/noite
  onChange: (pm: boolean) => void
}

export function DayNightToggle({ pm, onChange }: DayNightToggleProps) {
  const ui = useT()
  return (
    <button
      type="button"
      onClick={() => onChange(!pm)}
      aria-label={pm ? ui.dayNightToMorningAria : ui.dayNightToEveningAria}
      className="flex items-center gap-2 rounded-full border border-cardline bg-card px-4 py-2 font-display text-base font-bold text-ink shadow-soft transition-transform duration-100 active:translate-y-1 active:shadow-none sm:text-lg"
    >
      <span className={pm ? 'opacity-30' : ''}>{ui.morning}</span>
      <span className="text-ink/30">|</span>
      <span className={pm ? '' : 'opacity-30'}>{ui.evening}</span>
    </button>
  )
}
