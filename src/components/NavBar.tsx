export type Screen = 'play' | 'quiz' | 'settings'

export interface NavBarProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  totalStars: number
}

const TABS: Array<[Screen, string]> = [
  ['play', '🕐 Brincar'],
  ['quiz', '❓ Quiz'],
  ['settings', '⚙️ Definições'],
]

export function NavBar({ screen, onNavigate, totalStars }: NavBarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-ring px-4 py-3 text-white shadow-md">
      <nav className="flex gap-2">
        {TABS.map(([s, label]) => (
          <button key={s} onClick={() => onNavigate(s)}
            className={`rounded-full px-4 py-2 font-extrabold ${
              screen === s ? 'bg-white text-ring' : 'bg-white/20'
            }`}>
            {label}
          </button>
        ))}
      </nav>
      <span className="font-extrabold">⭐ {totalStars}</span>
    </header>
  )
}
