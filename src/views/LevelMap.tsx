import { Fragment } from 'react'
import { type Level } from '../lib/quiz'
import { useT } from '../lib/i18n'
import type { Progress } from '../lib/profileStore'

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export interface LevelMapProps {
  progress: Progress
  onPlay: (level: Level) => void
}

export function LevelMap({ progress, onPlay }: LevelMapProps) {
  const ui = useT()
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2 py-6">
      <h2 className="mx-auto mb-2 rounded-full bg-card/85 px-6 py-2 text-center font-display text-2xl font-extrabold text-ink shadow-soft backdrop-blur-md">{ui.pickLevel}</h2>
      {LEVELS.map((lvl) => {
        const locked = lvl > progress.unlockedLevel
        const stars = progress.starsByLevel[lvl]
        return (
          <Fragment key={lvl}>
            {/* Subtle divider between the 12h block (1–5) and the 24h block (6–10). */}
            {lvl === 6 && (
              <div className="mt-2 flex items-center gap-2 px-1 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
                <span className="h-px flex-1 bg-ink/15" />
                {ui.with24h}
                <span className="h-px flex-1 bg-ink/15" />
              </div>
            )}
            <button
              disabled={locked}
              onClick={() => onPlay(lvl)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-display text-lg font-extrabold backdrop-blur-md transition-transform duration-100 ${
                locked
                  ? 'border-cardline/50 bg-card/55 text-ink/45'
                  : 'border-cardline bg-card text-ink shadow-soft active:translate-y-1 active:shadow-none'
              }`}
            >
              <span>
                {locked ? '🔒 ' : ''}
                {ui.levelWord} {lvl} — {ui.levelLabel(lvl)}
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
