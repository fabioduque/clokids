import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { Cloki } from '../components/Cloki'
import { HintBubble, RoundHud } from '../components/HelpOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  makeParkRound,
  PARK_ROUND,
  ZONE_EMOJI,
  type ParkLevel,
  type ParkTask,
  type SetClockTask,
  type ChoiceTask,
  type ZoneId,
} from '../lib/park'
import { fmtHourLang } from '../lib/missions'
import { hour12Of, split } from '../lib/timeModel'
import { playSuccess, playError } from '../lib/sound'
import { loadParkRound, saveParkRound, clearParkRound, fmtDuration } from '../lib/roundStore'
import { useLang, useT } from '../lib/i18n'

const HELP_DELAY_MS = 15_000

export interface ParkRoundViewProps {
  zone: Exclude<ZoneId, 'casa'>
  level: ParkLevel
  /** Settings opt-in: glow green the moment the dial is right (default off —
   * otherwise the glow answers BEFORE the child presses Pronto). */
  confirmGlow: boolean
  onStar: () => void
  onSkyTime?: (total: number | null) => void
  // Round finished: record the best score for this zone+level.
  onComplete: (zone: ZoneId, level: ParkLevel, score: number) => void
  onExit: () => void
}

export function ParkRoundView({ zone, level, confirmGlow, onStar, onSkyTime, onComplete, onExit }: ParkRoundViewProps) {
  const lang = useLang()
  const ui = useT()
  const reduce = useReducedMotion()

  // Whole round decided up-front + persisted (same resumable contract as the
  // quiz: hop to Brincar to think, come back to the same task).
  const [init] = useState(() => {
    const stored = loadParkRound()
    if (stored && stored.zone === zone && stored.level === level) return stored
    const fresh = {
      zone,
      level,
      tasks: makeParkRound(zone, level, Math.random, lang),
      idx: 0,
      score: 0,
      startedAt: Date.now(),
      elapsedMs: 0,
    }
    saveParkRound(fresh)
    return fresh
  })
  const [tasks, setTasks] = useState<ParkTask[]>(init.tasks)
  const [idx, setIdx] = useState(init.idx)
  const [score, setScore] = useState(init.score)
  const [solved, setSolved] = useState(false) // set-tasks: celebrating before advance
  const [picked, setPicked] = useState<number | null>(null) // choice-tasks
  const [finishedInMs, setFinishedInMs] = useState<number | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const elapsedRef = useRef(init.elapsedMs)
  const resumeRef = useRef(Date.now())
  const task = tasks[idx]
  const done = idx >= PARK_ROUND

  function bumpElapsed() {
    const now = Date.now()
    elapsedRef.current += now - resumeRef.current
    resumeRef.current = now
  }

  useEffect(() => {
    if (!done) {
      saveParkRound({ zone, level, tasks, idx, score, startedAt: init.startedAt, elapsedMs: elapsedRef.current })
    } else {
      setFinishedInMs(elapsedRef.current)
      clearParkRound()
      onComplete(zone, level, score)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, score, done])

  // Sky lives the task's moment.
  useEffect(() => {
    if (done || !task) return
    onSkyTime?.(task.kind === 'set' ? task.target : task.clockTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])
  useEffect(() => () => onSkyTime?.(null), [onSkyTime])

  // Staged hints for choice tasks (set tasks hint via attempts inside the panel).
  const [helpReady, setHelpReady] = useState(false)
  const [helpStage, setHelpStage] = useState(0)
  const [hintHidden, setHintHidden] = useState(false)
  const [eliminated, setEliminated] = useState<number[]>([])
  useEffect(() => {
    setHelpReady(false)
    setHelpStage(0)
    setHintHidden(false)
    setEliminated([])
    setSolved(false)
    setPicked(null)
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
    else if (helpStage === 1 && task?.kind === 'choice') {
      setHelpStage(2)
      setEliminated(task.options.filter((o) => o !== task.correct).slice(0, 2))
    }
  }

  function advance() {
    bumpElapsed()
    setIdx((i) => i + 1)
  }

  // ── set-task solved (first-try earns the star) ──
  function onSetSolved(firstTry: boolean) {
    setSolved(true)
    playSuccess()
    if (firstTry) {
      setScore((s) => s + 1)
      onStar()
    }
    setTimeout(advance, 1600)
  }

  // ── choice-task pick ──
  function choose(option: number) {
    if (picked !== null || task?.kind !== 'choice') return
    setPicked(option)
    if (option === task.correct) {
      setScore((s) => s + 1)
      playSuccess()
      onStar()
    } else {
      playError()
    }
    setTimeout(advance, 2000)
  }

  if (done) {
    const tally = '⭐'.repeat(score) + '☆'.repeat(PARK_ROUND - score)
    return (
      <div className="mx-auto flex w-full max-w-sm min-h-full flex-col items-center justify-center gap-5 py-10 text-center">
        <Cloki pose={score >= 3 ? 'cheer' : 'wave'} size={104} />
        <motion.h2
          className="rounded-2xl bg-card/85 px-6 py-2 font-display text-3xl font-extrabold text-ink shadow-panel backdrop-blur-md"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >
          {ui.youGot(score, PARK_ROUND)}
        </motion.h2>
        {finishedInMs !== null && (
          <p className="rounded-full bg-card/85 px-4 py-1.5 font-display text-base font-bold text-ink/70 shadow-soft backdrop-blur-md">
            ⏱ {fmtDuration(finishedInMs)}
          </p>
        )}
        <p className="text-4xl" aria-label={ui.scoreAria(score, PARK_ROUND)}>
          {tally}
        </p>
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              clearParkRound()
              const fresh = {
                zone,
                level,
                tasks: makeParkRound(zone, level, Math.random, lang),
                idx: 0,
                score: 0,
                startedAt: Date.now(),
                elapsedMs: 0,
              }
              saveParkRound(fresh)
              elapsedRef.current = 0
              resumeRef.current = Date.now()
              setTasks(fresh.tasks)
              setIdx(0)
              setScore(0)
              setFinishedInMs(null)
            }}
            className="btn-sun py-4 text-xl"
          >
            {ui.anotherRound}
          </button>
          <button type="button" onClick={onExit} className="btn-soft py-3 text-lg">
            {ui.backToPark}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 pb-2 pt-3 sm:gap-4 sm:py-5">
      <RoundHud
        counter={`${ZONE_EMOJI[zone]} ${idx + 1}/${PARK_ROUND}`}
        helpVisible={helpReady && task.kind === 'choice' && picked === null && (helpStage < 2 || hintHidden)}
        onHelp={giveHelp}
        onAbandon={() => setConfirmExit(true)}
        abandonAria={ui.abandonQuizAria}
      />
      <ConfirmDialog
        open={confirmExit}
        text={ui.exitRoundQ}
        confirmLabel={ui.confirmExit}
        cancelLabel={ui.keepPlaying}
        onConfirm={() => {
          setConfirmExit(false)
          clearParkRound()
          onExit()
        }}
        onCancel={() => setConfirmExit(false)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-2 sm:gap-4 lg:flex-none"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {task.kind === 'set' ? (
            <SetClockPanel key={`set-${idx}`} task={task} solved={solved} confirmGlow={confirmGlow} onSolved={onSetSolved} />
          ) : (
            <ChoicePanel
              task={task}
              picked={picked}
              eliminated={eliminated}
              hintVisible={helpStage >= 1 && picked === null && !hintHidden}
              onHintDismiss={() => setHintHidden(true)}
              onHintMore={helpStage === 1 ? giveHelp : undefined}
              onChoose={choose}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Set-the-clock panel: drag the hands, press Pronto to find out ──────────

function SetClockPanel({
  task,
  solved,
  confirmGlow,
  onSolved,
}: {
  task: SetClockTask
  solved: boolean
  confirmGlow: boolean
  onSolved: (firstTry: boolean) => void
}) {
  const lang = useLang()
  const ui = useT()
  const [total, setTotal] = useState(task.startAt)
  const [attempts, setAttempts] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)
  // The dial is 12h: setting "3 o'clock" must satisfy a 15h00 target, so
  // correctness compares dial APPEARANCE (mod 720), like the quiz options do.
  const correctNow = total % 720 === task.target % 720

  function confirm() {
    if (solved) return
    if (correctNow) {
      onSolved(attempts === 0)
    } else {
      playError()
      setAttempts((a) => a + 1)
      setShakeKey((k) => k + 1)
    }
  }

  const { hour24, minute } = split(task.target)
  const hint = ui.setHint(hour12Of(hour24), minute === 0 ? 12 : minute / 5)

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      {/* Clock stage: the answer IS the clock. With confirmGlow on it glows
          softly the moment it's right (a help — off by default, or it answers
          before the child commits with Pronto). */}
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 && !solved ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex aspect-square w-[min(80vw,38vh,22rem)] shrink-0 items-center justify-center lg:w-[min(50vh,26rem)]"
        style={{
          filter: confirmGlow && correctNow && !solved ? 'drop-shadow(0 0 14px rgba(74,222,128,0.85))' : undefined,
        }}
      >
        <AnalogClock
          total={total}
          step={solved ? undefined : task.step}
          onChange={solved ? undefined : setTotal}
          size={460}
          show24={false}
        />
        <HintBubble text={hint} visible={attempts >= 2 && !solved} onDismiss={() => setAttempts(1)} />
        {solved && (
          <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2">
            <Cloki pose="cheer" size={64} />
          </div>
        )}
      </motion.div>

      <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-2 sm:gap-3 lg:max-w-sm">
        <div className="panel flex items-center gap-3 p-3 text-left sm:p-4">
          <span className="text-3xl sm:text-4xl" aria-hidden>
            {ZONE_EMOJI[task.zone]}
          </span>
          <p className="text-pretty text-sm font-bold leading-snug text-ink sm:text-base">{task.text}</p>
        </div>
        {task.showDigital && (
          <p className="rounded-2xl bg-card/85 px-5 py-1.5 font-display text-3xl font-extrabold tabular-nums text-ink shadow-soft backdrop-blur-md">
            {fmtHourLang(task.target, lang)}
          </p>
        )}
        {attempts > 0 && !solved && (
          <p className="text-balance text-center text-sm font-bold text-ink/70">{ui.almostTryAgain}</p>
        )}
        <button type="button" onClick={confirm} disabled={solved} className="btn-sun w-full max-w-xs py-3 text-xl">
          {ui.pronto}
        </button>
      </div>
    </div>
  )
}

// ─── Choice panel (Zoo waits) ────────────────────────────────────────────────

function ChoicePanel({
  task,
  picked,
  eliminated,
  hintVisible,
  onHintDismiss,
  onHintMore,
  onChoose,
}: {
  task: ChoiceTask
  picked: number | null
  eliminated: number[]
  hintVisible: boolean
  onHintDismiss: () => void
  onHintMore?: () => void
  onChoose: (option: number) => void
}) {
  const ui = useT()
  const reduce = useReducedMotion()
  return (
    <div className="flex w-full flex-col items-center gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      <div className="relative flex aspect-square w-[min(72vw,30vh,18rem)] shrink-0 items-center justify-center lg:w-[min(44vh,24rem)]">
        <AnalogClock
          total={task.clockTotal}
          size={420}
          show24={false}
          highlightRange={picked !== null || hintVisible ? { from: task.wedgeFromMin / 5, to: task.wedgeToMin / 5 } : null}
        />
        <HintBubble text={ui.hintWedge} visible={hintVisible} onDismiss={onHintDismiss} onMore={onHintMore} />
      </div>

      <div className="flex w-full max-w-md shrink-0 flex-col gap-2 sm:gap-3 lg:max-w-sm">
        <div className="panel flex items-center gap-3 p-3 text-left sm:p-4">
          <span className="text-3xl sm:text-4xl" aria-hidden>
            🦁
          </span>
          <p className="text-pretty text-sm font-bold leading-snug text-ink sm:text-base">
            {task.text} <span className="text-ink/60">{ui.clockShowsNow}</span>
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
          {task.options.map((opt) => (
            <motion.button
              key={opt}
              onClick={() => onChoose(opt)}
              disabled={eliminated.includes(opt)}
              className={`${choiceClass(opt, picked, task.correct)} ${eliminated.includes(opt) ? 'pointer-events-none opacity-25' : ''}`}
              animate={
                reduce || picked === null || opt !== task.correct
                  ? { scale: 1 }
                  : { scale: [1, 1.06, 1], transition: { duration: 0.45, ease: 'easeInOut' } }
              }
            >
              <span className="block font-display text-xl leading-tight tabular-nums sm:text-2xl">
                {opt}
                {ui.minSuffix}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function choiceClass(opt: number, picked: number | null, correct: number): string {
  const base = 'rounded-2xl border-2 px-3 py-3 text-center font-extrabold shadow-sm transition-colors sm:px-4'
  if (picked === null) return `${base} border-ring/40 bg-card text-ink active:scale-95`
  if (opt === correct) return `${base} border-green-500 bg-green-100 text-green-800`
  if (opt === picked) return `${base} border-red-300 bg-red-50 text-red-400`
  return `${base} border-ink/10 bg-card text-ink/40`
}
