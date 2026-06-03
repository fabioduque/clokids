import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
  // Each entry is one in-flight star flying from screen-center to the top-bar
  // counter. Keyed by an incrementing id so rapid stars animate independently
  // and each removes itself when its flight ends.
  const [flyingStars, setFlyingStars] = useState<Array<{ id: number; tx: number; ty: number }>>([])
  const reduce = useReducedMotion()

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

  // Award one star the instant an answer is correct: bump the cumulative count
  // (persisted immediately so a star is never lost) and, unless reduced-motion,
  // spawn a star that flies from screen-center into the top-bar counter.
  function awardStar() {
    setProfile((p) => ({
      ...p,
      progress: { ...p.progress, totalStars: p.progress.totalStars + 1 },
    }))
    if (reduce) return
    const target = document.getElementById('topbar-star')?.getBoundingClientRect()
    const tx = target ? target.left + target.width / 2 : window.innerWidth - 24
    const ty = target ? target.top + target.height / 2 : 24
    setFlyingStars((list) => [...list, { id: Date.now() + Math.random(), tx, ty }])
  }

  function finishQuiz(correct: number) {
    // Stars are awarded per-correct (see awardStar); here we only record the
    // best score for the level and unlock the next one — no totalStars add, or
    // the round would double-count.
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
        {screen === 'quiz' && <QuizView key={roundId} level={quizLevel} onFinish={finishQuiz} onStar={awardStar} />}
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

      {/* Flying-star overlay: fixed above everything and non-interactive. Each
          star is born large at the viewport center, then sails up to the
          top-bar counter while shrinking and fading, popping the count on
          arrival. Skipped entirely under prefers-reduced-motion. */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <AnimatePresence>
          {flyingStars.map((s) => (
            <motion.span
              key={s.id}
              className="absolute left-1/2 top-1/2 -ml-6 -mt-6 text-5xl drop-shadow"
              aria-hidden
              initial={{ x: 0, y: 0, scale: 1.4, opacity: 0 }}
              animate={{
                x: s.tx - window.innerWidth / 2,
                y: s.ty - window.innerHeight / 2,
                scale: 0.3,
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 0.7, ease: 'easeInOut', opacity: { times: [0, 0.15, 0.8, 1] } }}
              onAnimationComplete={() =>
                setFlyingStars((list) => list.filter((f) => f.id !== s.id))
              }
            >
              ⭐
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
