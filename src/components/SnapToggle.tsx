import type { Settings } from '../lib/profileStore'

export interface SnapToggleProps {
  snap: Settings['snap']
  onChange: (snap: Settings['snap']) => void
}

const OPTS: Array<Settings['snap']> = [15, 5, 1]

export function SnapToggle({ snap, onChange }: SnapToggleProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-full border-2 border-ring/50 bg-white shadow-sm"
      role="group"
      aria-label="Precisão dos minutos"
    >
      {OPTS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-pressed={snap === s}
          aria-label={`Saltos de ${s} minuto${s === 1 ? '' : 's'}`}
          className={`px-2.5 py-1.5 text-sm font-extrabold leading-none transition-colors ${
            snap === s ? 'bg-ring text-white' : 'text-ink hover:bg-ring/10'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
