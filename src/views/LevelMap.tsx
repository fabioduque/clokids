import { Fragment } from 'react'
import { levelLabel, type Level } from '../lib/quiz'
import type { Progress } from '../lib/profileStore'

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export interface LevelMapProps {
  progress: Progress
  onPlay: (level: Level) => void
}

export function LevelMap({ progress, onPlay }: LevelMapProps) {
  return (
    <div className="flex flex-col gap-2">
      {LEVELS.map((lvl) => {
        const locked = lvl > progress.unlockedLevel
        const stars = progress.starsByLevel[lvl]
        return (
          <Fragment key={lvl}>
            {/* Subtle divider between the 12h block (1–5) and the 24h block (6–10). */}
            {lvl === 6 && (
              <div className="mt-2 flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wide text-ink/40">
                <span className="h-px flex-1 bg-ink/15" />
                Com 24 horas
                <span className="h-px flex-1 bg-ink/15" />
              </div>
            )}
            <button
              disabled={locked}
              onClick={() => onPlay(lvl)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-lg font-extrabold shadow-md ${
                locked ? 'bg-ink/10 text-ink/40' : 'bg-white text-ink active:scale-95'
              }`}
            >
              <span>
                {locked ? '🔒 ' : ''}Nível {lvl} — {levelLabel(lvl)}
              </span>
              <span className="text-ring">
                {'⭐'.repeat(stars)}
                {'☆'.repeat(5 - stars)}
              </span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
