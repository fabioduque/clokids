import type { Settings } from '../lib/profileStore'
import { useT, type Lang } from '../lib/i18n'

export interface SettingsViewProps {
  settings: Settings
  onSettings: (s: Settings) => void
  onReset: () => void
}

const SNAPS: Array<Settings['snap']> = [15, 5, 1]
const LANGS: Array<[Lang, string, string]> = [
  ['pt', '🇵🇹', 'Português'],
  ['en', '🇺🇸', 'English'],
]

export function SettingsView({ settings, onSettings, onReset }: SettingsViewProps) {
  const ui = useT()
  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    onSettings({ ...settings, [key]: value })
  }
  const toggles: Array<[keyof Settings, string]> = [
    ['showWords', ui.toggleWords],
    ['voice', ui.toggleVoice],
    ['showHandLegend', ui.toggleLegend],
    ['showSeconds', ui.toggleSeconds],
    ['show24h', ui.toggle24h],
  ]
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-6">
      {/* Language: flags, Portuguese first (the default). */}
      <section className="panel flex flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.languageTitle}</h3>
        <div className="flex gap-2">
          {LANGS.map(([code, flag, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => set('lang', code)}
              aria-pressed={settings.lang === code}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-display text-base font-bold transition-colors ${
                settings.lang === code
                  ? 'border-transparent bg-ring text-white shadow-sm'
                  : 'border-cardline bg-card text-ink'
              }`}
            >
              <span className="text-xl" aria-hidden>
                {flag}
              </span>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel flex flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.snapSettingTitle}</h3>
        <div className="flex gap-2">
          {SNAPS.map((s) => (
            <button key={s} onClick={() => set('snap', s)}
              className={`flex-1 rounded-xl border px-3 py-2.5 font-display text-sm font-bold transition-colors ${
                settings.snap === s
                  ? 'border-transparent bg-ring text-white shadow-sm'
                  : 'border-cardline bg-card text-ink'
              }`}>
              {ui.snapLabels[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel flex flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.helpersTitle}</h3>
        {toggles.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-cardline bg-card px-4 py-3 font-bold text-ink shadow-soft">
            {label}
            <input type="checkbox" className="h-6 w-6 accent-ring"
              checked={settings[key] as boolean}
              onChange={(e) => set(key, e.target.checked as never)} />
          </label>
        ))}
      </section>

      <section className="panel flex flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.resetTitle}</h3>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(ui.resetConfirm)) onReset()
          }}
          className="rounded-xl border border-red-300 bg-card px-4 py-3 font-display font-bold text-red-500 shadow-soft transition-transform duration-100 active:translate-y-1 active:shadow-none"
        >
          {ui.resetButton}
        </button>
      </section>
    </div>
  )
}
