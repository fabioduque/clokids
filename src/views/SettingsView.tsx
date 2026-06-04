import { useEffect, useState } from 'react'
import type { Settings } from '../lib/profileStore'
import { useLang, useT, type Lang } from '../lib/i18n'
import { listVoices, onVoicesReady, speak } from '../lib/speak'

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
    ['showMinuteHelp', ui.toggleMinuteHelp],
    ['confirmGlow', ui.toggleConfirmGlow],
  ]
  // Whole areas a parent/teacher can hide; Aprender and Brincar are always on.
  const areas: Array<[keyof Settings, string]> = [
    ['showQuiz', `❓ ${ui.navQuiz}`],
    ['showMissions', `🎒 ${ui.navMissions}`],
    ['showPark', `🎪 ${ui.navPark}`],
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

      {/* Theme: the living sky, or the plain super-simple canvas. */}
      <section className="panel flex flex-col gap-3 p-5">
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.themeTitle}</h3>
        <div className="flex gap-2">
          {(
            [
              ['sky', ui.themeSky],
              ['simple', ui.themeSimple],
            ] as Array<[Settings['theme'], string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set('theme', value)}
              aria-pressed={settings.theme === value}
              className={`flex-1 rounded-xl border px-3 py-2.5 font-display text-base font-bold transition-colors ${
                settings.theme === value
                  ? 'border-transparent bg-ring text-white shadow-sm'
                  : 'border-cardline bg-card text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <VoiceSection settings={settings} onSet={set} />

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
        <h3 className="font-display text-xl font-extrabold text-ink">{ui.areasTitle}</h3>
        <p className="text-sm font-bold text-ink/60">{ui.areasHint}</p>
        {areas.map(([key, label]) => (
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

/** Voice + reading-speed picker. Lists the voices the BROWSER exposes for the
 * current app language (they come from the OS — see macOS Accessibility →
 * Read & Speak → System Voice to install better ones), best-quality first. */
function VoiceSection({
  settings,
  onSet,
}: {
  settings: Settings
  onSet: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}) {
  const lang = useLang()
  const ui = useT()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    const refresh = () => setVoices(listVoices(lang))
    refresh()
    return onVoicesReady(refresh)
  }, [lang])
  const key = lang === 'pt' ? 'voicePt' : 'voiceEn'
  const rate = settings.speechRate ?? 0.9
  const RATES: Array<[number, string]> = [
    [0.6, ui.speedSlow],
    [0.9, ui.speedNormal],
    [1.1, ui.speedFast],
  ]
  return (
    <section className="panel flex flex-col gap-3 p-5">
      <h3 className="font-display text-xl font-extrabold text-ink">{ui.voiceTitle}</h3>
      <div className="flex items-stretch gap-2">
        <select
          value={settings[key] ?? ''}
          onChange={(e) => onSet(key, (e.target.value || undefined) as Settings[typeof key])}
          className="min-w-0 flex-1 rounded-xl border border-cardline bg-card px-3 py-2.5 font-bold text-ink"
        >
          <option value="">{ui.voiceAuto}</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => speak(ui.voiceSample, lang)}
          aria-label={ui.voiceTestAria}
          className="btn-soft px-4 py-2"
        >
          ▶
        </button>
      </div>
      <div className="flex gap-2">
        {RATES.map(([r, label]) => (
          <button
            key={r}
            type="button"
            onClick={() => onSet('speechRate', r)}
            aria-pressed={Math.abs(rate - r) < 0.01}
            className={`flex-1 rounded-xl border px-3 py-2.5 font-display text-sm font-bold transition-colors ${
              Math.abs(rate - r) < 0.01
                ? 'border-transparent bg-ring text-white shadow-sm'
                : 'border-cardline bg-card text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
