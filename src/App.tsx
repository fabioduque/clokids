import { useEffect, useState } from 'react'
import { NavBar, type Screen } from './components/NavBar'
import { FreePlayView } from './views/FreePlayView'
import { LearnView } from './views/LearnView'
import { QuizView } from './views/QuizView'
import { SettingsView } from './views/SettingsView'
import { DEFAULT_PROFILE, loadProfile, saveProfile, type Profile, type Settings } from './lib/profileStore'
import { type Level } from './lib/quiz'

function nowParts() {
  const d = new Date()
  return { total: d.getHours() * 60 + d.getMinutes(), seconds: d.getSeconds() }
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [screen, setScreen] = useState<Screen>('play')
  // Brincar opens at the real current time and keeps ticking ("live") until the
  // user drags a hand / taps a number, which switches to a manually-set time.
  const [manualTotal, setManualTotal] = useState<number>(() => nowParts().total)
  const [live, setLive] = useState(true)
  const [now, setNow] = useState(nowParts)
  const [quizLevel, setQuizLevel] = useState<Level>(1)
  const [roundId, setRoundId] = useState(0)

  useEffect(() => saveProfile(profile), [profile])

  // While live, refresh the displayed time every second so the clock (and the
  // sweeping seconds hand, when shown) stays current. Stops as soon as we leave
  // live mode.
  useEffect(() => {
    if (!live) return
    setNow(nowParts())
    const id = setInterval(() => setNow(nowParts()), 1000)
    return () => clearInterval(id)
  }, [live])

  const displayTotal = live ? now.total : manualTotal
  const displaySeconds = live && profile.settings.showSeconds ? now.seconds : null

  function onFreePlayChange(t: number) {
    setLive(false)
    setManualTotal(t)
  }

  function onNow() {
    const p = nowParts()
    setManualTotal(p.total)
    setNow(p)
    setLive(true)
  }

  function updateSettings(settings: Settings) {
    setProfile((p) => ({ ...p, settings }))
  }

  function resetProfile() {
    setProfile(structuredClone(DEFAULT_PROFILE))
  }

  function navigate(next: Screen) {
    if (next === 'quiz') setRoundId((n) => n + 1)
    setScreen(next)
  }

  function startQuiz(level: Level) {
    setQuizLevel(level)
    setRoundId((n) => n + 1)
    setScreen('quiz')
  }

  function finishQuiz(correct: number) {
    setProfile((p) => {
      const best = Math.max(p.progress.starsByLevel[quizLevel], correct)
      const unlock = correct >= 4 && quizLevel < 10
        ? (Math.max(p.progress.unlockedLevel, (quizLevel + 1) as Level) as Level)
        : p.progress.unlockedLevel
      return {
        ...p,
        progress: {
          ...p.progress,
          unlockedLevel: unlock,
          totalStars: p.progress.totalStars + correct, // cumulative (a later task moves this to per-correct)
          starsByLevel: { ...p.progress.starsByLevel, [quizLevel]: best },
        },
      }
    })
    setScreen('settings')
  }

  return (
    <div className="min-h-screen bg-bg font-rounded text-ink">
      <NavBar screen={screen} onNavigate={navigate} totalStars={profile.progress.totalStars} />
      {/* The view fills the viewport between the sticky 64px top bar and the
          fixed 78px bottom nav (mobile only), so screens can flex to fill the
          available height instead of leaving empty space. dvh keeps mobile
          browser chrome from cropping the layout. */}
      <main className="mx-auto flex h-[calc(100dvh-64px)] max-w-xl flex-col overflow-y-auto px-4 pb-[78px] sm:pb-4">
        {screen === 'learn' && <LearnView onGoToPlay={() => navigate('play')} />}
        {screen === 'play' && (
          <FreePlayView
            total={displayTotal}
            seconds={displaySeconds}
            onChange={onFreePlayChange}
            onNow={onNow}
            settings={profile.settings}
            onSnapChange={(snap) => updateSettings({ ...profile.settings, snap })}
          />
        )}
        {screen === 'quiz' && <QuizView key={roundId} level={quizLevel} onFinish={finishQuiz} />}
        {screen === 'settings' && (
          <SettingsView
            settings={profile.settings}
            progress={profile.progress}
            onSettings={updateSettings}
            onPlay={startQuiz}
            onReset={resetProfile}
          />
        )}
      </main>
    </div>
  )
}
