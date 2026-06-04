import { useEffect, useState } from 'react'
import { Cloki } from '../components/Cloki'
import { ParkRoundView } from './ParkRoundView'
import { StoryDayView } from './StoryDayView'
import { STORY_DAYS, ZONE_EMOJI, type ParkLevel, type ZoneId } from '../lib/park'
import { loadParkRound } from '../lib/roundStore'
import { useLang, useT } from '../lib/i18n'
import type { Progress } from '../lib/profileStore'

// O Parque do Cloki — the hybrid map: an illustrated header scene (hills, the
// park gate, Cloki waving, the living sky behind) and the zones as "ticket"
// cards beneath. Each game zone offers its 3 difficulty levels; the Casa zone
// lists its story days instead.

export interface ParkViewProps {
  progress: Progress
  /** Settings opt-in: glow green the moment a set-clock dial is right. */
  confirmGlow: boolean
  onStar: () => void
  onSkyTime?: (total: number | null) => void
  onParkResult: (zone: ZoneId, level: ParkLevel, score: number) => void
  onStoryDone: (dayId: string) => void
}

type ParkScreen =
  | { type: 'map' }
  | { type: 'round'; zone: Exclude<ZoneId, 'casa'>; level: ParkLevel }
  | { type: 'story'; dayId: string }

const GAME_ZONES: Array<Exclude<ZoneId, 'casa'>> = ['estacao', 'zoo', 'cinema', 'oficina']
const LEVELS: ParkLevel[] = [1, 2, 3]

export function ParkView({ progress, confirmGlow, onStar, onSkyTime, onParkResult, onStoryDone }: ParkViewProps) {
  const lang = useLang()
  const ui = useT()
  // Resume an unfinished park round (the kid may have hopped away mid-round).
  const [screen, setScreen] = useState<ParkScreen>(() => {
    const stored = loadParkRound()
    return stored && stored.zone !== 'casa'
      ? { type: 'round', zone: stored.zone as Exclude<ZoneId, 'casa'>, level: stored.level }
      : { type: 'map' }
  })

  // Map screen sits at ambient time.
  useEffect(() => {
    if (screen.type === 'map') onSkyTime?.(null)
  }, [screen, onSkyTime])

  if (screen.type === 'round') {
    return (
      <ParkRoundView
        zone={screen.zone}
        level={screen.level}
        confirmGlow={confirmGlow}
        onStar={onStar}
        onSkyTime={onSkyTime}
        onComplete={onParkResult}
        onExit={() => setScreen({ type: 'map' })}
      />
    )
  }

  if (screen.type === 'story') {
    const day = STORY_DAYS[lang].find((d) => d.id === screen.dayId) ?? STORY_DAYS[lang][0]
    return (
      <StoryDayView
        day={day}
        confirmGlow={confirmGlow}
        onSkyTime={onSkyTime}
        onDone={onStoryDone}
        onExit={() => setScreen({ type: 'map' })}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 py-2.5 sm:gap-3 sm:py-5 lg:max-w-2xl">
      {/* The park entrance scene: hills + gate over the living sky, Cloki waving. */}
      <div className="relative h-28 shrink-0 overflow-hidden rounded-3xl border border-cardline/60 sm:h-36">
        <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <ellipse cx="80" cy="170" rx="190" ry="70" fill="#9ED48A" />
          <ellipse cx="330" cy="180" rx="220" ry="80" fill="#B7E0A4" />
          <path d="M 150 140 L 150 70 Q 200 30 250 70 L 250 140" fill="#F59E0B" opacity="0.92" />
          <path d="M 165 140 L 165 78 Q 200 48 235 78 L 235 140" fill="#FFFDF7" />
          <circle cx="200" cy="62" r="10" fill="#FFFDF7" stroke="#D97706" strokeWidth="3" />
          <line x1="200" y1="62" x2="200" y2="56" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="200" y1="62" x2="205" y2="62" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="absolute bottom-1 left-[8%]">
          <Cloki pose="wave" size={64} />
        </div>
        <span className="absolute right-[10%] top-3 text-2xl" aria-hidden>
          🎈
        </span>
        <span className="absolute right-[20%] top-8 text-xl" aria-hidden>
          🎈
        </span>
        <h2 className="absolute bottom-2 right-3 rounded-full bg-card/85 px-4 py-1.5 font-display text-lg font-extrabold text-ink shadow-soft backdrop-blur-md">
          {ui.parkTitle}
        </h2>
      </div>

      {/* Zone tickets. */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {GAME_ZONES.map((zone) => (
          <div key={zone} className="panel flex flex-col gap-2 p-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl" aria-hidden>
                {ZONE_EMOJI[zone]}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-extrabold leading-tight text-ink">{ui.zoneName(zone)}</h3>
                <p className="text-xs font-bold leading-tight text-ink/60">{ui.zoneTagline(zone)}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {LEVELS.map((level) => {
                const best = progress.parkStars[`${zone}:${level}`] ?? 0
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setScreen({ type: 'round', zone, level })}
                    aria-label={ui.zoneLevelAria(ui.zoneName(zone), level)}
                    className="flex flex-1 flex-col items-center rounded-xl border border-cardline bg-card py-1.5 font-display font-extrabold text-ink shadow-soft transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
                  >
                    <span className="text-base leading-none">{level}</span>
                    <span className="text-[10px] leading-tight text-ring" aria-label={`${best}/5 ⭐`}>
                      {best > 0 ? `⭐${best}` : '·'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Casa do Cloki: story days instead of levels. */}
        <div className="panel col-span-2 flex flex-col gap-2 p-3.5">
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden>
              {ZONE_EMOJI.casa}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-extrabold leading-tight text-ink">{ui.zoneName('casa')}</h3>
              <p className="text-xs font-bold leading-tight text-ink/60">{ui.casaPick}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            {STORY_DAYS[lang].map((day) => {
              const done = progress.casaDays.includes(day.id)
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setScreen({ type: 'story', dayId: day.id })}
                  className="flex flex-1 items-center justify-between rounded-xl border border-cardline bg-card px-3 py-2.5 font-display text-sm font-extrabold text-ink shadow-soft transition-transform duration-100 active:translate-y-0.5 active:shadow-none"
                >
                  <span>
                    {day.emoji} {day.title}
                  </span>
                  {done && <span aria-label="✓">✅</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
