import type { Level } from '../lib/quiz'
import type { Progress } from '../lib/profileStore'

const LABELS: Record<Level, string> = {
  1: 'Quartos de hora',
  2: 'Cinco em cinco',
  3: 'Minuto a minuto',
}

export interface LevelMapProps {
  progress: Progress
  onPlay: (level: Level) => void
}

export function LevelMap({ progress, onPlay }: LevelMapProps) {
  return (
    <div className="flex flex-col gap-3">
      {([1, 2, 3] as Level[]).map((lvl) => {
        const locked = lvl > progress.unlockedLevel
        const stars = progress.starsByLevel[lvl]
        return (
          <button key={lvl} disabled={locked} onClick={() => onPlay(lvl)}
            className={`flex items-center justify-between rounded-2xl px-5 py-4 text-left text-xl font-extrabold shadow-md ${
              locked ? 'bg-ink/10 text-ink/40' : 'bg-white text-ink active:scale-95'
            }`}>
            <span>{locked ? '🔒 ' : ''}Nível {lvl} — {LABELS[lvl]}</span>
            <span className="text-ring">{'⭐'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
          </button>
        )
      })}
    </div>
  )
}
