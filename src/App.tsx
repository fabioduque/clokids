import { useEffect, useState } from 'react'
import { NavBar, type Screen } from './components/NavBar'
import { FreePlayView } from './views/FreePlayView'
import { QuizView } from './views/QuizView'
import { SettingsView } from './views/SettingsView'
import { DEFAULT_PROFILE, loadProfile, saveProfile, type Profile, type Settings } from './lib/profileStore'
import { type Level } from './lib/quiz'

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [screen, setScreen] = useState<Screen>('play')
  const [total, setTotal] = useState(945)
  const [quizLevel, setQuizLevel] = useState<Level>(1)
  const [roundId, setRoundId] = useState(0)

  useEffect(() => saveProfile(profile), [profile])

  const totalStars =
    profile.progress.starsByLevel[1] +
    profile.progress.starsByLevel[2] +
    profile.progress.starsByLevel[3]

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
      const stars = Math.max(p.progress.starsByLevel[quizLevel], correct)
      const unlock = correct >= 4 && quizLevel < 3
        ? (Math.max(p.progress.unlockedLevel, (quizLevel + 1) as Level) as Level)
        : p.progress.unlockedLevel
      return {
        ...p,
        progress: {
          unlockedLevel: unlock,
          starsByLevel: { ...p.progress.starsByLevel, [quizLevel]: stars },
        },
      }
    })
    setScreen('settings')
  }

  return (
    <div className="min-h-screen bg-bg font-rounded text-ink">
      <NavBar screen={screen} onNavigate={navigate} totalStars={totalStars} />
      {/* The view fills the viewport between the sticky 64px top bar and the
          fixed 78px bottom nav (mobile only), so screens can flex to fill the
          available height instead of leaving empty space. dvh keeps mobile
          browser chrome from cropping the layout. */}
      <main className="mx-auto flex h-[calc(100dvh-64px)] max-w-xl flex-col overflow-y-auto px-4 pb-[78px] sm:pb-4">
        {screen === 'play' && (
          <FreePlayView
            total={total}
            onChange={setTotal}
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
