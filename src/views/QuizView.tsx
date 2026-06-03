import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { makeQuestion, type Level, type Question } from '../lib/quiz'
import { format24, format12, split, hour12Of } from '../lib/timeModel'
import { playSuccess, playError } from '../lib/sound'

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

export function QuizView({ level, onStar, onComplete, onRepeat, onNext, onExit, nextAvailable }: QuizViewProps) {
  const [round] = useState<Question[]>(() => buildRound(level))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const q = round[idx]
  const done = idx >= ROUND
  const reduce = useReducedMotion()

  const results = useMemo(() => '⭐'.repeat(score) + '☆'.repeat(ROUND - score), [score, done])

  // Record the result exactly once when the round finishes (best score + unlock
  // live in the App). Stars themselves were already awarded per-correct.
  useEffect(() => {
    if (done) onComplete(score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  if (done) {
    // Stagger so the buttons land after the star tally has fully revealed.
    const buttonsDelay = reduce ? 0 : 0.25 + ROUND * 0.18 + 0.15
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <motion.h2
          className="text-3xl font-extrabold text-ink"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          Acertaste {score}/{ROUND}!
        </motion.h2>

        {/* Staggered reveal: each star pops in with a small delay for a satisfying tally. */}
        <p className="text-5xl" aria-label={`${score} de ${ROUND}`}>
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

        <motion.div
          className="flex w-full flex-col gap-3"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: buttonsDelay }}
        >
          <button
            type="button"
            onClick={onRepeat}
            className="rounded-full bg-ring px-6 py-4 text-xl font-extrabold text-white shadow-md transition-transform active:scale-95"
          >
            🔁 Repetir
          </button>

          {nextAvailable && (
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-green-500 px-6 py-4 text-xl font-extrabold text-white shadow-md transition-transform active:scale-95"
            >
              Próximo nível →
            </button>
          )}

          <button
            type="button"
            onClick={onExit}
            className="rounded-full border-2 border-ring/40 bg-white px-6 py-3 text-lg font-extrabold text-ink shadow-sm transition-transform active:scale-95"
          >
            Níveis
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
    <div className="flex h-full min-h-0 flex-col items-center gap-2 pb-2 pt-3 sm:gap-4 sm:py-4 lg:justify-center lg:gap-4">
      <div className="flex shrink-0 gap-2">
        {Array.from({ length: ROUND }, (_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full sm:h-3 sm:w-3 ${i < idx ? 'bg-ring' : 'bg-ink/20'}`} />
        ))}
      </div>

      {/* Subtle cross-fade between successive questions (keyed on idx). The
          question fills the available height so the clock / option grid grow
          to use the space and only shrink on a short viewport. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="flex w-full min-h-0 flex-1 flex-col items-center gap-2 sm:gap-4 lg:flex-none lg:gap-4"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {q.direction === 'analogToDigital' ? (
            <>
              <p className="shrink-0 text-lg font-bold text-ink sm:text-xl">Que horas são?</p>
              {/* Prompt clock fills the leftover height above the options below
                  lg; on lg it takes a fixed comfortable size so the prompt +
                  options read as one centred compact group. */}
              <div className="flex w-full min-h-0 flex-1 items-center justify-center lg:h-[300px] lg:flex-none">
                <AnalogClock total={q.correct} size={300} show24={q.is24h} />
              </div>
              <div className="grid w-full max-w-md shrink-0 grid-cols-2 gap-2 sm:gap-3">
                {q.options.map((opt) => (
                  <motion.button
                    key={opt}
                    onClick={() => choose(opt)}
                    className={feedbackClass(opt, picked, q.correct)}
                    animate={pop(opt, picked, q.correct, !!reduce)}
                  >
                    <span className="block text-xl leading-tight sm:text-2xl">{digitalText(opt, q.is24h)}</span>
                    {q.is24h && (
                      <span className="block text-xs font-bold text-ink24 sm:text-sm">{format12(opt)}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="shrink-0 text-lg font-bold text-ink sm:text-xl">Qual relógio mostra esta hora?</p>
              <p className="shrink-0 text-4xl font-extrabold tabular-nums text-ink sm:text-6xl">{digitalText(q.correct, q.is24h)}</p>
              {/* The 2×2 grid of square option clocks fills the leftover area,
                  centered, capped so it never gets gigantic on desktop. On lg it
                  takes a fixed size so the prompt + grid form one compact group. */}
              <div className="flex w-full min-h-0 flex-1 items-center justify-center lg:h-[360px] lg:flex-none">
                <div className="grid aspect-square h-full max-w-full grid-cols-2 grid-rows-2 gap-2 sm:gap-3" style={{ maxHeight: 'min(30rem, 100%)', maxWidth: 'min(30rem, 100%)' }}>
                  {q.options.map((opt, i) => (
                    <motion.button
                      key={opt}
                      onClick={() => choose(opt)}
                      aria-label={`Opção ${i + 1}`}
                      className={`flex aspect-square min-h-0 items-center justify-center overflow-hidden rounded-2xl border-2 p-2 shadow-sm transition-colors sm:p-3 ${optionFrameClass(opt, picked, q.correct)}`}
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
  if (picked === null) return 'border-ring/40 bg-white active:scale-95'
  if (opt === correct) return 'border-green-500 bg-green-100'
  if (opt === picked) return 'border-red-300 bg-red-50'
  return 'border-ink/10 bg-white opacity-50'
}

function feedbackClass(opt: number, picked: number | null, correct: number): string {
  const base = 'rounded-2xl border-2 px-3 py-2 text-center font-extrabold shadow-sm transition-colors sm:px-4 sm:py-3'
  if (picked === null) return `${base} border-ring/40 bg-white text-ink active:scale-95`
  if (opt === correct) return `${base} border-green-500 bg-green-100 text-green-800`
  if (opt === picked) return `${base} border-red-300 bg-red-50 text-red-400`
  return `${base} border-ink/10 bg-white text-ink/40`
}
