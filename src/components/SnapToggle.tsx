import type { Settings } from '../lib/profileStore'
import { useT } from '../lib/i18n'

export interface SnapToggleProps {
  snap: Settings['snap']
  onChange: (snap: Settings['snap']) => void
}

const OPTS: Array<Settings['snap']> = [15, 5, 1]

export function SnapToggle({ snap, onChange }: SnapToggleProps) {
  const ui = useT()
  return (
    <div
      className="flex flex-col overflow-hidden rounded-full border-2 border-ring/50 bg-card font-display shadow-soft"
      role="group"
      aria-label={ui.snapAria}
    >
      {OPTS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-pressed={snap === s}
          aria-label={ui.snapStepAria(s)}
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
