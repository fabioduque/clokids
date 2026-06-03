import type { Settings, Progress } from '../lib/profileStore'
import type { Level } from '../lib/quiz'
import { LevelMap } from './LevelMap'

export interface SettingsViewProps {
  settings: Settings
  progress: Progress
  onSettings: (s: Settings) => void
  onPlay: (level: Level) => void
  onReset: () => void
}

const SNAPS: Array<Settings['snap']> = [15, 5, 1]
const SNAP_LABEL: Record<Settings['snap'], string> = {
  15: 'Quartos (15 min)',
  5: 'Cinco em cinco',
  1: 'Minuto a minuto',
}

export function SettingsView({ settings, progress, onSettings, onPlay, onReset }: SettingsViewProps) {
  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    onSettings({ ...settings, [key]: value })
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-xl font-extrabold text-ink">Precisão dos minutos</h3>
        <div className="flex gap-2">
          {SNAPS.map((s) => (
            <button key={s} onClick={() => set('snap', s)}
              className={`flex-1 rounded-xl px-3 py-2 font-bold shadow-sm ${
                settings.snap === s ? 'bg-ring text-white' : 'bg-white text-ink'
              }`}>
              {SNAP_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xl font-extrabold text-ink">Ajudas</h3>
        {([
          ['showWords', 'Mostrar horas por palavras'],
          ['voice', 'Botão de voz'],
          ['showHandLegend', 'Legenda dos ponteiros'],
          ['showSeconds', 'Mostrar segundos'],
          ['show24h', 'Mostrar números 24h'],
        ] as Array<[keyof Settings, string]>).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 font-bold text-ink shadow-sm">
            {label}
            <input type="checkbox" className="h-6 w-6 accent-ring"
              checked={settings[key] as boolean}
              onChange={(e) => set(key, e.target.checked as never)} />
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl font-extrabold text-ink">Níveis</h3>
        <LevelMap progress={progress} onPlay={onPlay} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xl font-extrabold text-ink">Recomeçar</h3>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Apagar todas as estrelas e recomeçar do início?')) onReset()
          }}
          className="rounded-xl border-2 border-red-300 bg-white px-4 py-3 font-bold text-red-500 shadow-sm active:scale-95"
        >
          🗑️ Apagar estrelas e recomeçar
        </button>
      </section>
    </div>
  )
}
