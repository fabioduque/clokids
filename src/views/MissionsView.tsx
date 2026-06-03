import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { fmtHourLang, makeMissionRound, MISSION_ROUND, MISSIONS_UNLOCK_COST, type Mission } from '../lib/missions'
import { useLang, useT, type UIStrings, type Lang } from '../lib/i18n'
import { playSuccess, playError } from '../lib/sound'
import { loadMissionRound, saveMissionRound, clearMissionRound, fmtDuration } from '../lib/roundStore'
import { HintBubble, RoundHud } from '../components/HelpOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MissionScene, type MissionOutcome } from '../components/MissionScene'

// Help offers itself after a long think; hints never cost stars.
const HELP_DELAY_MS = 15_000

// ─── Locked state ────────────────────────────────────────────────────────────
// One-time unlock paid with quiz stars: feels like an achievement, then it is
// free forever (deliberately NOT pay-per-play — no grind loops in this app).

export interface MissionsLockedProps {
  totalStars: number
  onUnlock: () => void
}

export function MissionsLocked({ totalStars, onUnlock }: MissionsLockedProps) {
  const ui = useT()
  const missing = MISSIONS_UNLOCK_COST - totalStars
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6">
      <div className="panel flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
        <span className="text-6xl" aria-hidden>
          🎒
        </span>
        <h2 className="font-display text-3xl font-extrabold text-ink">{ui.missionsTitle}</h2>
        <p className="text-pretty font-bold text-ink/70">{ui.missionsPitch}</p>
        {missing > 0 ? (
          <>
            <p className="rounded-full bg-ring/10 px-4 py-2 font-display font-extrabold text-ink">
              {ui.missionsMissing(missing)}
            </p>
            <p className="text-sm font-bold text-ink/60">{ui.missionsEarnHint}</p>
          </>
        ) : (
          <button type="button" onClick={onUnlock} className="btn-sun">
            {ui.missionsUnlock(MISSIONS_UNLOCK_COST)}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── The game ────────────────────────────────────────────────────────────────

export interface MissionsViewProps {
  // Award one star per correct answer (persist + topbar star pulse).
  onStar: () => void
  // Drive the living sky with the mission's story time (null = back to ambient).
  onSkyTime?: (total: number | null) => void
}

export function MissionsView({ onStar, onSkyTime }: MissionsViewProps) {
  const lang = useLang()
  const ui = useT()
  // The round is decided up-front and persisted — hop to Brincar mid-round and
  // come back to the same mission. Resumes any unfinished stored round.
  const [init] = useState(() => {
    const stored = loadMissionRound()
    if (stored) return stored
    const fresh = { missions: makeMissionRound(Math.random, lang), idx: 0, score: 0, startedAt: Date.now(), elapsedMs: 0 }
    saveMissionRound(fresh)
    return fresh
  })
  // ACTIVE time only (see QuizView): pauses while the child is elsewhere.
  const elapsedRef = useRef(init.elapsedMs)
  const resumeRef = useRef(Date.now())
  function bumpElapsed() {
    const now = Date.now()
    elapsedRef.current += now - resumeRef.current
    resumeRef.current = now
  }
  const [round, setRound] = useState<Mission[]>(init.missions)
  const [idx, setIdx] = useState(init.idx)
  const [score, setScore] = useState(init.score)
  const [startedAt, setStartedAt] = useState(init.startedAt)
  const [picked, setPicked] = useState<number | null>(null)
  const [finishedInMs, setFinishedInMs] = useState<number | null>(null)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const reduce = useReducedMotion()
  const m = round[idx]
  const done = idx >= MISSION_ROUND
  // Drives the scene: the kid walks on a correct pick, head-shakes on a wrong one.
  const outcome: MissionOutcome = picked === null ? 'idle' : picked === m?.correct ? 'correct' : 'wrong'

  // Persist progress; retire the stored round + capture the time on finish.
  useEffect(() => {
    if (!done) {
      saveMissionRound({ missions: round, idx, score, startedAt, elapsedMs: elapsedRef.current })
    } else {
      setFinishedInMs(elapsedRef.current)
      clearMissionRound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, score, done])

  // Staged help: 1 = reveal the wedge (count the slice!), 2 = also fade 2 options.
  const [helpReady, setHelpReady] = useState(false)
  const [helpStage, setHelpStage] = useState(0)
  const [hintHidden, setHintHidden] = useState(false)
  const [eliminated, setEliminated] = useState<number[]>([])
  useEffect(() => {
    setHelpReady(false)
    setHelpStage(0)
    setHintHidden(false)
    setEliminated([])
    if (done) return
    const id = setTimeout(() => setHelpReady(true), HELP_DELAY_MS)
    return () => clearTimeout(id)
  }, [idx, done])

  function giveHelp() {
    if (hintHidden) {
      setHintHidden(false)
      return
    }
    if (helpStage === 0) setHelpStage(1)
    else if (helpStage === 1) {
      setHelpStage(2)
      setEliminated(m.options.filter((o) => o !== m.correct).slice(0, 2))
    }
  }

  // The sky lives the mission's moment ("o zoo abre às 9h00" under a morning
  // sky). Reverts to ambient when the round ends or the view unmounts.
  useEffect(() => {
    onSkyTime?.(done ? null : m.clockTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])
  useEffect(() => () => onSkyTime?.(null), [onSkyTime])

  function repeat() {
    clearMissionRound()
    const fresh = { missions: makeMissionRound(Math.random, lang), idx: 0, score: 0, startedAt: Date.now(), elapsedMs: 0 }
    saveMissionRound(fresh)
    elapsedRef.current = 0
    resumeRef.current = Date.now()
    setRound(fresh.missions)
    setStartedAt(fresh.startedAt)
    setIdx(0)
    setScore(0)
    setPicked(null)
    setFinishedInMs(null)
  }

  function choose(option: number) {
    if (picked !== null) return
    setPicked(option)
    if (option === m.correct) {
      setScore((s) => s + 1)
      playSuccess()
      onStar()
    } else {
      playError()
    }
    // A touch longer than the quiz: the wedge appears as feedback and the child
    // should have time to SEE the interval on the dial.
    setTimeout(() => {
      bumpElapsed()
      setPicked(null)
      setIdx((i) => i + 1)
    }, 2000)
  }

  if (done) {
    const tally = '⭐'.repeat(score) + '☆'.repeat(MISSION_ROUND - score)
    return (
      <div className="mx-auto flex w-full max-w-sm min-h-full flex-col items-center justify-center gap-6 py-10 text-center">
        <motion.h2
          className="rounded-2xl bg-card/85 px-6 py-2 font-display text-3xl font-extrabold text-ink shadow-panel backdrop-blur-md"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          {ui.youGot(score, MISSION_ROUND)}
        </motion.h2>
        {finishedInMs !== null && (
          <p className="rounded-full bg-card/85 px-4 py-1.5 font-display text-base font-bold text-ink/70 shadow-soft backdrop-blur-md">
            ⏱ {fmtDuration(finishedInMs)}
          </p>
        )}
        <p className="text-5xl" aria-label={ui.scoreAria(score, MISSION_ROUND)}>
          {Array.from(tally).map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 14, delay: reduce ? 0 : 0.25 + i * 0.18 }}
            >
              {ch}
            </motion.span>
          ))}
        </p>
        <motion.div
          className="flex w-full flex-col gap-3"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.25 + MISSION_ROUND * 0.18 + 0.15 }}
        >
          <button type="button" onClick={repeat} className="btn-sun py-4 text-xl">
            {ui.anotherRound}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 pb-2 pt-3 sm:gap-4 sm:py-5">
      {/* Game-style HUD: hint trigger · "Missão 1/5" · abandon (deals a fresh
          round). */}
      <RoundHud
        counter={ui.missionCounter(idx + 1, MISSION_ROUND)}
        helpVisible={helpReady && picked === null && (helpStage < 2 || hintHidden)}
        onHelp={giveHelp}
        onAbandon={() => setConfirmRestart(true)}
        abandonAria={ui.abandonMissionsAria}
      />

      {/* Nothing resets on a stray tap: the ✕ only deals a new round after an
          explicit yes. */}
      <ConfirmDialog
        open={confirmRestart}
        text={ui.restartRoundQ}
        confirmLabel={ui.confirmRestart}
        cancelLabel={ui.keepPlaying}
        onConfirm={() => {
          setConfirmRestart(false)
          repeat()
        }}
        onCancel={() => setConfirmRestart(false)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="flex w-full flex-col items-center gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-12"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* The clock: "agora" for until/wait, the TARGET for leave. After an
              answer, the red wedge appears showing the interval — the minutes
              become a visible slice of the dial. */}
          <div className="relative flex aspect-square w-[min(72vw,24vh,18rem)] shrink-0 items-center justify-center lg:w-[min(44vh,24rem)]">
            <AnalogClock
              total={m.clockTotal}
              size={420}
              show24={false}
              highlightRange={
                // The wedge is the explanation — shown as feedback after an
                // answer, or earlier as the first HINT (count the slice!).
                picked !== null || helpStage >= 1
                  ? { from: m.wedgeFromMin / 5, to: m.wedgeToMin / 5 }
                  : null
              }
            />
            <HintBubble text={missionHint(m, ui, lang)} visible={helpStage >= 1 && picked === null && !hintHidden} onDismiss={() => setHintHidden(true)} onMore={helpStage === 1 ? giveHelp : undefined} />
          </div>

          <div className="flex w-full max-w-md shrink-0 flex-col gap-2 sm:gap-3 lg:max-w-sm">
            {/* The animated stage: the kid sets off toward the destination on a
                correct answer. */}
            <MissionScene mission={m} outcome={outcome} />

            {/* The story. */}
            <div className="panel p-3 text-left sm:p-4">
              <p className="text-pretty text-sm font-bold leading-snug text-ink sm:text-base">
                {m.text}{' '}
                {m.kind !== 'leave' && (
                  <span className="text-ink/60">{ui.clockShowsNow}</span>
                )}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
              {m.options.map((opt) => (
                <motion.button
                  key={opt}
                  onClick={() => choose(opt)}
                  disabled={eliminated.includes(opt)}
                  className={`${missionFeedbackClass(opt, picked, m.correct)} ${eliminated.includes(opt) ? 'pointer-events-none opacity-25' : ''}`}
                  animate={missionPop(opt, picked, m.correct, !!reduce)}
                >
                  <span className="block font-display text-xl leading-tight tabular-nums sm:text-2xl">
                    {m.answerIsTime ? fmtHourLang(opt, lang) : `${opt}${ui.minSuffix}`}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** First hint: read the wedge now drawn on the dial. */
function missionHint(m: Mission, ui: UIStrings, lang: Lang): string {
  return m.kind === 'leave' ? ui.hintLeave(fmtHourLang(m.clockTotal, lang)) : ui.hintWedge
}

/** Gentle pop (1 → 1.06 → 1) on the correct card once it's revealed. */
function missionPop(opt: number, picked: number | null, correct: number, reduce: boolean) {
  if (reduce || picked === null || opt !== correct) return { scale: 1 }
  return { scale: [1, 1.06, 1], transition: { duration: 0.45, ease: 'easeInOut' as const } }
}

function missionFeedbackClass(opt: number, picked: number | null, correct: number): string {
  const base = 'rounded-2xl border-2 px-3 py-3 text-center font-extrabold shadow-sm transition-colors sm:px-4'
  if (picked === null) return `${base} border-ring/40 bg-card text-ink active:scale-95`
  if (opt === correct) return `${base} border-green-500 bg-green-100 text-green-800`
  if (opt === picked) return `${base} border-red-300 bg-red-50 text-red-400`
  return `${base} border-ink/10 bg-card text-ink/40`
}
