import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { makeQuestion, questionSkyTotal, type Level, type Question } from '../lib/quiz'
import { format24, format12, split, hour12Of } from '../lib/timeModel'
import { playSuccess, playError } from '../lib/sound'
import { loadQuizRound, saveQuizRound, clearQuizRound, fmtDuration } from '../lib/roundStore'
import { useT, type UIStrings } from '../lib/i18n'
import { HintBubble, RoundHud } from '../components/HelpOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'

// How long a child can stare at a question before the help button offers
// itself. Hints never cost stars — help is help.
const HELP_DELAY_MS = 15_000

export interface QuizViewProps {
  level: Level
  // Called once per correct answer so the App can award a star immediately
  // (persist + top-bar count + fly animation).
  onStar: () => void
  // Fired once when the round finishes so the App records best score + unlock.
  onComplete: (score: number) => void
  // Result-screen actions.
  onRepeat: () => void
  onNext: () => void
  onExit: () => void
  // Whether the next level is unlocked (controls the "Próximo nível" button).
  nextAvailable: boolean
  // Drive the living sky with the question's own time (null = back to ambient).
  onSkyTime?: (total: number | null) => void
}

const ROUND = 5

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Digital text matched to the level: 24h levels read "15:00"; 12h levels read
// the plain 12-hour form ("3:00", with hour 0 → "12:00") and never 13–24.
function digitalText(total: number, is24h: boolean): string {
  if (is24h) return format24(total)
  const { hour24, minute } = split(total)
  return `${hour12Of(hour24)}:${pad2(minute)}`
}

function buildRound(level: Level): Question[] {
  const rng = Math.random
  return Array.from({ length: ROUND }, () => makeQuestion(level, rng))
}

export function QuizView({ level, onStar, onComplete, onRepeat, onNext, onExit, nextAvailable, onSkyTime }: QuizViewProps) {
  // The WHOLE round is decided up-front and persisted: the child can hop over
  // to Brincar mid-round (to poke the clock and think!) and come back to the
  // exact same question. Resumes any unfinished stored round for this level.
  const [init] = useState(() => {
    const stored = loadQuizRound()
    if (stored && stored.level === level) return stored
    const fresh = { level, questions: buildRound(level), idx: 0, score: 0, startedAt: Date.now() }
    saveQuizRound(fresh)
    return fresh
  })
  const round = init.questions
  const [idx, setIdx] = useState(init.idx)
  const [score, setScore] = useState(init.score)
  const [picked, setPicked] = useState<number | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  // Time-taken for this phase, captured once on completion.
  const [finishedInMs, setFinishedInMs] = useState<number | null>(null)
  const q = round[idx]
  const done = idx >= ROUND
  const reduce = useReducedMotion()
  const ui = useT()

  // Persist progress after every advance; the finished round is cleared inside
  // the completion effect below.
  useEffect(() => {
    if (!done) saveQuizRound({ level, questions: round, idx, score, startedAt: init.startedAt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, score, done])

  // Staged help: appears after a long think, never costs stars.
  const [helpReady, setHelpReady] = useState(false)
  const [helpStage, setHelpStage] = useState(0) // 0 hidden · 1 text hint · 2 also eliminated 2 options
  const [eliminated, setEliminated] = useState<number[]>([])
  useEffect(() => {
    setHelpReady(false)
    setHelpStage(0)
    setEliminated([])
    if (done) return
    const id = setTimeout(() => setHelpReady(true), HELP_DELAY_MS)
    return () => clearTimeout(id)
  }, [idx, done])

  function giveHelp() {
    if (helpStage === 0) setHelpStage(1)
    else if (helpStage === 1) {
      setHelpStage(2)
      setEliminated(q.options.filter((o) => o !== q.correct).slice(0, 2))
    }
  }

  // The sky portrays the time being asked about — for 24h levels seeing 22:00
  // under stars IS the lesson. Reverts to ambient on finish/unmount.
  useEffect(() => {
    onSkyTime?.(done ? null : questionSkyTotal(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])
  useEffect(() => () => onSkyTime?.(null), [onSkyTime])

  const results = useMemo(() => '⭐'.repeat(score) + '☆'.repeat(ROUND - score), [score, done])

  // Record the result exactly once when the round finishes (best score + unlock
  // live in the App). Stars themselves were already awarded per-correct. Also
  // capture how long the phase took and retire the stored round.
  useEffect(() => {
    if (done) {
      setFinishedInMs(Date.now() - init.startedAt)
      clearQuizRound()
      onComplete(score)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  if (done) {
    // Stagger so the buttons land after the star tally has fully revealed.
    const buttonsDelay = reduce ? 0 : 0.25 + ROUND * 0.18 + 0.15
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <motion.h2
          className="rounded-2xl bg-card/85 px-6 py-2 font-display text-3xl font-extrabold text-ink shadow-panel backdrop-blur-md"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          {ui.youGot(score, ROUND)}
        </motion.h2>

        {/* Staggered reveal: each star pops in with a small delay for a satisfying tally. */}
        <p className="text-5xl" aria-label={ui.scoreAria(score, ROUND)}>
          {Array.from(results).map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 14,
                delay: reduce ? 0 : 0.25 + i * 0.18,
              }}
            >
              {ch}
            </motion.span>
          ))}
        </p>

        {/* Time taken for this phase — useful tracking for parents, satisfying
            for the kid. */}
        {finishedInMs !== null && (
          <p className="rounded-full bg-card/85 px-4 py-1.5 font-display text-base font-bold text-ink/70 shadow-soft backdrop-blur-md">
            ⏱ {fmtDuration(finishedInMs)}
          </p>
        )}

        <motion.div
          className="flex w-full flex-col gap-3"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: buttonsDelay }}
        >
          <button
            type="button"
            onClick={onRepeat}
            className="btn-sun py-4 text-xl"
          >
            {ui.repeat}
          </button>

          {nextAvailable && (
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-gradient-to-b from-green-400 to-green-600 px-6 py-4 font-display text-xl font-extrabold text-white shadow-[0_8px_0_0_#15803d,0_14px_22px_-6px_rgba(21,128,61,0.5)] transition-transform duration-100 active:translate-y-1 active:shadow-none"
            >
              {ui.nextLevel}
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className="btn-soft py-3 text-lg"
          >
            {ui.levels}
          </button>
        </motion.div>
      </div>
    )
  }

  function choose(option: number) {
    if (picked !== null) return
    setPicked(option)
    if (option === q.correct) {
      setScore((s) => s + 1)
      playSuccess()
      onStar()
    } else {
      playError()
    }
    setTimeout(() => {
      setPicked(null)
      setIdx((i) => i + 1)
    }, 1400)
  }

  return (
    <div className="flex min-h-full flex-col items-center gap-3 pb-3 pt-4 sm:gap-4 sm:py-5 lg:justify-center lg:gap-5">
      {/* Game-style HUD: hint trigger · "Pergunta 1/5" · abandon (clears the
          stored round so the level map opens fresh). */}
      <RoundHud
        counter={ui.questionCounter(idx + 1, ROUND)}
        helpVisible={helpReady && picked === null && helpStage < 2}
        onHelp={giveHelp}
        onAbandon={() => setConfirmExit(true)}
        abandonAria={ui.abandonQuizAria}
      />

      {/* The ✕ never throws a round away on a stray tap. */}
      <ConfirmDialog
        open={confirmExit}
        text={ui.exitRoundQ}
        confirmLabel={ui.confirmExit}
        cancelLabel={ui.keepPlaying}
        onConfirm={() => {
          setConfirmExit(false)
          clearQuizRound()
          onExit()
        }}
        onCancel={() => setConfirmExit(false)}
      />

      {/* Subtle cross-fade between successive questions (keyed on idx). The
          question fills the available height so the clock / option grid grow
          to use the space and only shrink on a short viewport. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-2 sm:gap-4 lg:flex-none lg:gap-4"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {q.direction === 'analogToDigital' ? (
            <>
              {/* Below lg: question / clock / options stacked and filling height.
                  On lg: two columns — the prompt clock on the left, the question
                  + 4 answer options on the right — so it uses the full width. */}
              <p className="shrink-0 rounded-full bg-card/85 px-5 py-1.5 font-display text-lg font-bold text-ink shadow-soft backdrop-blur-md sm:text-xl lg:hidden">{ui.whatTime}</p>
              <div className="flex w-full flex-col items-center gap-2 sm:gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
                {/* Prompt clock: a responsive square that fits BOTH width and
                    height (min(vw, vh)) so the answer options below never get
                    pushed off a small phone screen. Larger fixed square on lg. */}
                <div className="relative flex aspect-square w-[min(86vw,42vh,24rem)] shrink-0 items-center justify-center lg:w-[min(50vh,28rem)]">
                  <AnalogClock total={q.correct} size={460} show24={q.is24h} />
                  <HintBubble text={hintText(q, ui)} visible={helpStage >= 1 && picked === null} />
                </div>
                <div className="flex w-full max-w-md shrink-0 flex-col gap-2 sm:gap-3 lg:max-w-sm">
                  <p className="hidden shrink-0 rounded-full bg-card/85 px-5 py-2 text-center font-display text-2xl font-bold text-ink shadow-soft backdrop-blur-md lg:block">{ui.whatTime}</p>
                  <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
                    {q.options.map((opt) => (
                      <motion.button
                        key={opt}
                        onClick={() => choose(opt)}
                        disabled={eliminated.includes(opt)}
                        className={`${feedbackClass(opt, picked, q.correct)} ${eliminated.includes(opt) ? 'pointer-events-none opacity-25' : ''}`}
                        animate={pop(opt, picked, q.correct, !!reduce)}
                      >
                        <span className="block font-display text-xl leading-tight tabular-nums sm:text-2xl">{digitalText(opt, q.is24h)}</span>
                        {q.is24h && (
                          <span className="block text-xs font-bold text-ink24 sm:text-sm">{format12(opt)}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="shrink-0 rounded-full bg-card/85 px-5 py-1.5 font-display text-lg font-bold text-ink shadow-soft backdrop-blur-md sm:text-xl">{ui.whichClock}</p>
              <p className="shrink-0 rounded-2xl bg-card/85 px-6 py-2 font-display text-4xl font-extrabold tabular-nums text-ink shadow-panel backdrop-blur-md sm:text-6xl lg:text-7xl">{digitalText(q.correct, q.is24h)}</p>
              {/* The 2×2 grid of square option clocks fills the leftover area,
                  centered, capped so it never gets gigantic on desktop. On lg it
                  takes a larger fixed size so it uses the width while the prompt
                  + grid still read as one centred group. */}
              <div className="relative flex w-full min-h-0 flex-1 items-center justify-center lg:h-[min(46vh,30rem)] lg:flex-none">
                <HintBubble text={hintText(q, ui)} visible={helpStage >= 1 && picked === null} edge="top" />
                <div className="grid aspect-square h-full max-w-full grid-cols-2 grid-rows-2 gap-2 sm:gap-3 lg:gap-5" style={{ maxHeight: 'min(34rem, 100%)', maxWidth: 'min(34rem, 100%)' }}>
                  {q.options.map((opt, i) => (
                    <motion.button
                      key={opt}
                      onClick={() => choose(opt)}
                      disabled={eliminated.includes(opt)}
                      aria-label={ui.optionAria(i + 1)}
                      className={`flex aspect-square min-h-0 items-center justify-center overflow-hidden rounded-2xl border-2 p-2 shadow-sm transition-colors sm:p-3 ${optionFrameClass(opt, picked, q.correct)} ${eliminated.includes(opt) ? 'pointer-events-none opacity-25' : ''}`}
                      animate={pop(opt, picked, q.correct, !!reduce)}
                    >
                      {/* Square box that fills the card's padding-box so all four
                          clocks are the same size and centered with equal margins. */}
                      <div className="flex aspect-square h-full w-full items-center justify-center">
                        <AnalogClock total={opt} size={320} show24={q.is24h} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Staged hint for a question: first a strategy, then narrowing the options. */
function hintText(q: Question, ui: UIStrings): string {
  const h = hour12Of(split(q.correct).hour24)
  return q.direction === 'analogToDigital' ? ui.hintAnalog : ui.hintDigital(h)
}

/** Gentle pop (1 -> 1.06 -> 1) on the correct card once it's revealed. */
function pop(opt: number, picked: number | null, correct: number, reduce: boolean) {
  if (reduce || picked === null || opt !== correct) return { scale: 1 }
  return { scale: [1, 1.06, 1], transition: { duration: 0.45, ease: 'easeInOut' as const } }
}

/**
 * Border + background only, for the digital→analog option cards. The card itself
 * owns its size (aspect-square) and padding so the four clocks stay uniform and
 * centered; this just colours the frame for the answer feedback.
 */
function optionFrameClass(opt: number, picked: number | null, correct: number): string {
  if (picked === null) return 'border-ring/40 bg-card active:scale-95'
  if (opt === correct) return 'border-green-500 bg-green-100'
  if (opt === picked) return 'border-red-300 bg-red-50'
  return 'border-ink/10 bg-card opacity-50'
}

function feedbackClass(opt: number, picked: number | null, correct: number): string {
  const base = 'rounded-2xl border-2 px-3 py-2 text-center font-extrabold shadow-sm transition-colors sm:px-4 sm:py-3'
  if (picked === null) return `${base} border-ring/40 bg-card text-ink active:scale-95`
  if (opt === correct) return `${base} border-green-500 bg-green-100 text-green-800`
  if (opt === picked) return `${base} border-red-300 bg-red-50 text-red-400`
  return `${base} border-ink/10 bg-card text-ink/40`
}
