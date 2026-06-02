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
      <main className="mx-auto max-w-xl px-4 pb-24 sm:pb-6">
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
