import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { NavBar, type Screen } from './components/NavBar'
import { SkyBackground } from './components/SkyBackground'
import { FreePlayView } from './views/FreePlayView'
import { LearnView } from './views/LearnView'
import { QuizView } from './views/QuizView'
import { LevelMap } from './views/LevelMap'
import { MissionsLocked, MissionsView } from './views/MissionsView'
import { SettingsView } from './views/SettingsView'
import { DEFAULT_PROFILE, loadProfile, saveProfile, type Profile, type Settings } from './lib/profileStore'
import { playMinutes, shouldSuggestBreak } from './lib/playTimer'
import { MISSIONS_UNLOCK_COST } from './lib/missions'
import { LangContext, STR } from './lib/i18n'
import { loadQuizRound } from './lib/roundStore'
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
  // null = show the level map (pick a level); a Level = a round is in progress.
  const [quizLevel, setQuizLevel] = useState<Level | null>(null)
  const [roundId, setRoundId] = useState(0)
  const reduce = useReducedMotion()

  // Gentle screen-time nudge: the session starts on every page load (refresh =
  // fresh start, by design). startTime is mirrored to localStorage so parents
  // can inspect it; the ticking clock below recomputes elapsed minutes.
  const [sessionStart] = useState(() => {
    const t = Date.now()
    try {
      localStorage.setItem('relogio.sessionStart', String(t))
    } catch {
      /* storage unavailable — the nudge still works from memory */
    }
    return t
  })
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [breakDismissedAt, setBreakDismissedAt] = useState<number | null>(null)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const playedMin = playMinutes(sessionStart, nowMs)
  const suggestBreak = shouldSuggestBreak(playedMin, breakDismissedAt)

  // Touch-first app: a tap/click must never leave a lingering focus ring on a
  // button (some browsers keep keyboard modality and show :focus-visible after
  // pointer input). Keyboard (Tab) focus is untouched — the amber ring stays
  // for real keyboard users.
  useEffect(() => {
    const drop = () => {
      const el = document.activeElement
      if (el instanceof HTMLElement && el.tagName === 'BUTTON') {
        setTimeout(() => el.blur(), 0) // after the click handler has run
      }
    }
    window.addEventListener('pointerup', drop)
    return () => window.removeEventListener('pointerup', drop)
  }, [])

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
  // The sky portrays the clock the child is looking at: on Brincar it follows
  // the (draggable) displayed time; on Quiz/Missões the active question sets it
  // (skyOverride); elsewhere it sits at the real current time as ambient.
  const [skyOverride, setSkyOverride] = useState<number | null>(null)
  const ambientTotal = screen === 'play' ? displayTotal : (skyOverride ?? now.total)

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

  // One-time unlock of Missões do Tempo: spends stars (never below zero) and
  // never needs paying again — an achievement, not a pay-per-play loop.
  function unlockMissions() {
    setProfile((p) => {
      if (p.progress.missionsUnlocked || p.progress.totalStars < MISSIONS_UNLOCK_COST) return p
      return {
        ...p,
        progress: {
          ...p.progress,
          totalStars: p.progress.totalStars - MISSIONS_UNLOCK_COST,
          missionsUnlocked: true,
        },
      }
    })
  }

  function navigate(next: Screen) {
    if (next === 'quiz') {
      // Resume an unfinished stored round (the kid may have hopped to Brincar
      // mid-round to think); otherwise land on the level map.
      const stored = loadQuizRound()
      setQuizLevel(stored ? stored.level : null)
    }
    // Leaving a question screen returns the sky to the ambient time.
    setSkyOverride(null)
    setScreen(next)
  }

  // Start a fresh round of the chosen level (from the level map).
  function startLevel(level: Level) {
    setQuizLevel(level)
    setRoundId((n) => n + 1)
  }

  // Replay the same level for another shot at more stars.
  function repeatLevel() {
    setRoundId((n) => n + 1)
  }

  // Jump straight into the next level (only offered when it's unlocked).
  function nextLevel() {
    if (quizLevel && quizLevel < 10) {
      setQuizLevel((quizLevel + 1) as Level)
      setRoundId((n) => n + 1)
    }
  }

  // Back to the level map.
  function exitToLevels() {
    setQuizLevel(null)
  }

  // Award one star the instant an answer is correct: bump the cumulative count
  // (persisted immediately so a star is never lost). The top-bar star itself
  // pulses — it's keyed on the count inside NavBar.
  function awardStar() {
    setProfile((p) => ({
      ...p,
      progress: { ...p.progress, totalStars: p.progress.totalStars + 1 },
    }))
  }

  function recordResult(score: number) {
    // Stars are awarded per-correct (see awardStar); here we only record the
    // best score for the level and unlock the next one — no totalStars add, or
    // the round would double-count. Stays on the quiz tab (the result screen
    // handles where to go next).
    setProfile((p) => {
      const best = Math.max(p.progress.starsByLevel[quizLevel!], score)
      const unlock = score >= 4 && quizLevel! < 10
        ? (Math.max(p.progress.unlockedLevel, (quizLevel! + 1) as Level) as Level)
        : p.progress.unlockedLevel
      return {
        ...p,
        progress: {
          ...p.progress,
          unlockedLevel: unlock,
          starsByLevel: { ...p.progress.starsByLevel, [quizLevel!]: best },
        },
      }
    })
  }

  // App renders the LangContext.Provider itself, so it reads strings directly
  // from the table (useContext here would see the default, not our value).
  const ui = STR[profile.settings.lang]

  return (
    // Exactly one viewport tall (h-dvh): the header takes its natural height and
    // `main` flexes to the REST — no hardcoded header height, so the page itself
    // never grows a scrollbar.
    <LangContext.Provider value={profile.settings.lang}>
    <div className="relative flex h-dvh flex-col font-rounded text-ink">
      <SkyBackground total={ambientTotal} />
      <NavBar
        screen={screen}
        onNavigate={navigate}
        totalStars={profile.progress.totalStars}
        playMinutes={playedMin}
      />
      {/* The scroll container under the top bar (pb clears the fixed 78px
          bottom nav, mobile only). Its CONTENT is a plain block: each view root
          is `min-h-full`, so when content fits it fills the viewport and
          centres, and when content is taller the view simply grows and `main`
          scrolls from the top. (Centering an over-tall child with flex would
          push its top above the scroll origin — the original clipping bug.)
          min-h-0 lets main actually shrink inside the flex column; max-w is
          kept snug on desktop so the composition reads as a group on the sky. */}
      <main className="mx-auto w-full min-h-0 max-w-xl flex-1 overflow-y-auto px-4 pb-[78px] sm:pb-4 lg:max-w-5xl lg:px-8">
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
        {screen === 'quiz' &&
          (quizLevel == null ? (
            <LevelMap progress={profile.progress} onPlay={startLevel} />
          ) : (
            <QuizView
              key={roundId}
              level={quizLevel}
              onStar={awardStar}
              onComplete={recordResult}
              onRepeat={repeatLevel}
              onNext={nextLevel}
              onExit={exitToLevels}
              nextAvailable={quizLevel < 10 && (quizLevel + 1) <= profile.progress.unlockedLevel}
              onSkyTime={setSkyOverride}
            />
          ))}
        {screen === 'missions' &&
          (profile.progress.missionsUnlocked ? (
            <MissionsView onStar={awardStar} onSkyTime={setSkyOverride} />
          ) : (
            <MissionsLocked totalStars={profile.progress.totalStars} onUnlock={unlockMissions} />
          ))}
        {screen === 'settings' && (
          <SettingsView
            settings={profile.settings}
            onSettings={updateSettings}
            onReset={resetProfile}
          />
        )}
      </main>

      {/* Gentle break suggestion after 30 min of play: NON-blocking — one
          friendly card the child can dismiss (it returns 15 min later). The
          point is awareness, never a lock-out. */}
      <AnimatePresence>
        {suggestBreak && (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
            role="dialog"
            aria-label={ui.breakAria}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
          >
            <motion.div
              className="panel flex max-w-sm flex-col items-center gap-3 p-6 text-center"
              initial={reduce ? false : { scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span className="text-5xl" aria-hidden>
                🌳
              </span>
              <h2 className="font-display text-2xl font-extrabold text-ink">
                {ui.breakTitle(playedMin)}
              </h2>
              <p className="font-bold text-ink/70">{ui.breakText}</p>
              <button
                type="button"
                onClick={() => setBreakDismissedAt(playedMin)}
                className="btn-sun mt-1"
              >
                {ui.breakOk}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </LangContext.Provider>
  )
}
