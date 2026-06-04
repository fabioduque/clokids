import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../lib/i18n'

export type Screen = 'learn' | 'play' | 'quiz' | 'missions' | 'park' | 'settings'

export interface NavBarProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  totalStars: number
  /** Minutes played this session — shown as a small chip once it's meaningful. */
  playMinutes?: number
}

const MAIN_TABS: Array<[Exclude<Screen, 'settings'>, string]> = [
  ['learn', '💡'],
  ['play', '🕐'],
  ['quiz', '❓'],
  ['missions', '🎒'],
  ['park', '🎪'],
]

export function NavBar({ screen, onNavigate, totalStars, playMinutes = 0 }: NavBarProps) {
  const reduce = useReducedMotion()
  const ui = useT()
  const tabLabel: Record<Exclude<Screen, 'settings'>, string> = {
    learn: ui.navLearn,
    play: ui.navPlay,
    quiz: ui.navQuiz,
    missions: ui.navMissions,
    park: ui.navPark,
  }
  // Quiet on initial mount: the star only pulses for stars earned NOW, not for
  // the count restored from storage on page load.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  return (
    <>
      {/* Top bar: single row, never wraps. Frosted warm glass so the living sky
          shows through faintly while white text stays legible day or night. */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/25 bg-gradient-to-b from-ring/95 to-ring/80 px-3 py-3 text-white shadow-md backdrop-blur-md sm:px-4">
        <button
          type="button"
          onClick={() => onNavigate('play')}
          aria-label={ui.brandAria}
          className="shrink-0 cursor-pointer font-display text-xl font-extrabold tracking-tight drop-shadow-sm"
        >
          <span aria-hidden>🕐</span> Clokids
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {/* Brincar / Quiz pills — only on sm+ where there is room. */}
          <nav className="hidden items-center gap-2 sm:flex" aria-label={ui.mainNavAria}>
            {MAIN_TABS.map(([s, icon]) => {
              const label = tabLabel[s]
              const active = screen === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onNavigate(s)}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 font-display font-extrabold transition-colors ${
                    active ? 'bg-white text-ring shadow-sm' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <span aria-hidden>{icon}</span> {label}
                </button>
              )
            })}
          </nav>

          {/* Session time chip: appears after 5 min of play — awareness, not
              pressure. Turns "warm" past the 30-min break threshold. */}
          {playMinutes >= 5 && (
            <span
              className={`rounded-full px-2.5 py-1.5 font-display text-sm font-extrabold tabular-nums ${
                playMinutes >= 30 ? 'bg-white text-ring' : 'bg-white/20'
              }`}
              aria-label={ui.playingAria(playMinutes)}
            >
              ⏱ {playMinutes}m
            </span>
          )}

          <span
            className="rounded-full bg-white/20 px-3 py-1.5 font-display font-extrabold tabular-nums"
            aria-label={ui.starsAria(totalStars)}
          >
            {/* The star itself celebrates each award: grows for ~1s then eases
                back (1.5s total). Keyed on the count so every star retriggers. */}
            <motion.span
              key={`star-${totalStars}`}
              aria-hidden
              className="inline-block"
              animate={
                reduce || !mounted.current ? { scale: 1 } : { scale: [1, 1.9, 1] }
              }
              transition={{ duration: 1.5, times: [0, 2 / 3, 1], ease: 'easeInOut' }}
            >
              ⭐
            </motion.span>{' '}
            {/* The count pops (1 → 1.3 → 1) whenever a star is awarded, keyed on
                the value so each increment retriggers the spring. */}
            <motion.span
              key={totalStars}
              className="inline-block"
              initial={reduce || !mounted.current ? false : { scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            >
              {totalStars}
            </motion.span>
          </span>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-label={ui.navSettingsAria}
            aria-current={screen === 'settings' ? 'page' : undefined}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl transition-colors ${
              screen === 'settings'
                ? 'bg-white text-ring shadow-sm'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <span aria-hidden>⚙️</span>
          </button>
        </div>
      </header>

      {/* Bottom nav: mobile only, big thumb-friendly targets. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-cardline bg-card/90 shadow-[0_-6px_20px_rgba(91,52,21,0.16)] backdrop-blur-md sm:hidden"
        aria-label={ui.mainNavAria}
      >
        {MAIN_TABS.map(([s, icon]) => {
          const label = tabLabel[s]
          const active = screen === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onNavigate(s)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2.5 font-display font-extrabold transition-colors ${
                active ? 'text-ring' : 'text-ink/50'
              }`}
            >
              <span
                className={`grid h-9 w-12 place-items-center rounded-full text-2xl leading-none transition-colors ${
                  active ? 'bg-ring/15' : 'bg-transparent'
                }`}
                aria-hidden
              >
                {icon}
              </span>
              <span className="text-xs leading-none">{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
