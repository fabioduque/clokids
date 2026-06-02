export type Screen = 'play' | 'quiz' | 'settings'

export interface NavBarProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  totalStars: number
}

const MAIN_TABS: Array<[Exclude<Screen, 'settings'>, string, string]> = [
  ['play', '🕐', 'Brincar'],
  ['quiz', '❓', 'Quiz'],
]

export function NavBar({ screen, onNavigate, totalStars }: NavBarProps) {
  return (
    <>
      {/* Top bar: single row, never wraps. */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-ring px-3 py-3 text-white shadow-md sm:px-4">
        <span className="shrink-0 text-lg font-extrabold tracking-tight">
          <span aria-hidden>🕐</span> Relógio
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {/* Brincar / Quiz pills — only on sm+ where there is room. */}
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Secções principais">
            {MAIN_TABS.map(([s, icon, label]) => {
              const active = screen === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onNavigate(s)}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 font-extrabold transition-colors ${
                    active ? 'bg-white text-ring shadow-sm' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <span aria-hidden>{icon}</span> {label}
                </button>
              )
            })}
          </nav>

          <span
            className="rounded-full bg-white/20 px-3 py-1.5 font-extrabold tabular-nums"
            aria-label={`${totalStars} estrelas`}
          >
            <span aria-hidden>⭐</span> {totalStars}
          </span>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-label="Definições"
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
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t-4 border-ink24/30 bg-white shadow-[0_-4px_16px_rgba(146,64,14,0.12)] sm:hidden"
        aria-label="Navegação principal"
      >
        {MAIN_TABS.map(([s, icon, label]) => {
          const active = screen === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onNavigate(s)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 font-extrabold transition-colors ${
                active ? 'text-ring' : 'text-ink/50'
              }`}
            >
              <span
                className={`grid h-9 w-16 place-items-center rounded-full text-2xl leading-none transition-colors ${
                  active ? 'bg-ring/15' : 'bg-transparent'
                }`}
                aria-hidden
              >
                {icon}
              </span>
              <span className="text-base leading-none">{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
