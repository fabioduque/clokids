import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { makeQuestion, type Level, type Question } from '../lib/quiz'
import { format24, format12 } from '../lib/timeModel'
import { playSuccess, playError } from '../lib/sound'

export interface QuizViewProps {
  level: Level
  onFinish: (correctCount: number) => void
}

const ROUND = 5

function buildRound(level: Level): Question[] {
  const rng = Math.random
  return Array.from({ length: ROUND }, () => makeQuestion(level, rng))
}

export function QuizView({ level, onFinish }: QuizViewProps) {
  const [round] = useState<Question[]>(() => buildRound(level))
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const q = round[idx]
  const done = idx >= ROUND
  const reduce = useReducedMotion()

  const results = useMemo(() => '⭐'.repeat(score) + '☆'.repeat(ROUND - score), [score, done])

  const gotItRight = picked !== null && picked === q?.correct

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <motion.h2
          className="text-3xl font-extrabold text-ink"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          Acertaste {score}/{ROUND}!
        </motion.h2>

        {/* Staggered reveal: each star pops in with a small delay for a satisfying tally. */}
        <p className="text-4xl" aria-label={`${score} de ${ROUND}`}>
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

        <motion.button
          className="rounded-full bg-ring px-6 py-3 text-xl font-extrabold text-white shadow-md active:scale-95"
          onClick={() => onFinish(score)}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.25 + ROUND * 0.18 + 0.1 }}
        >
          Continuar
        </motion.button>
      </div>
    )
  }

  function choose(option: number) {
    if (picked !== null) return
    setPicked(option)
    if (option === q.correct) {
      setScore((s) => s + 1)
      playSuccess()
    } else {
      playError()
    }
    setTimeout(() => {
      setPicked(null)
      setIdx((i) => i + 1)
    }, 1400)
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 pb-2 pt-3 sm:gap-4 sm:py-4">
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
          className="flex w-full min-h-0 flex-1 flex-col items-center gap-2 sm:gap-4"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {q.direction === 'analogToDigital' ? (
            <>
              <div className="relative shrink-0">
                <p className="text-lg font-bold text-ink sm:text-xl">Que horas são?</p>
                <CorrectStar show={gotItRight} reduce={!!reduce} />
              </div>
              {/* Prompt clock fills the leftover height above the options. */}
              <div className="flex w-full min-h-0 flex-1 items-center justify-center">
                <AnalogClock total={q.correct} size={300} />
              </div>
              <div className="grid w-full max-w-md shrink-0 grid-cols-2 gap-2 sm:gap-3">
                {q.options.map((opt) => (
                  <motion.button
                    key={opt}
                    onClick={() => choose(opt)}
                    className={feedbackClass(opt, picked, q.correct)}
                    animate={pop(opt, picked, q.correct, !!reduce)}
                  >
                    <span className="block text-xl leading-tight sm:text-2xl">{format24(opt)}</span>
                    <span className="block text-xs font-bold text-ink24 sm:text-sm">{format12(opt)}</span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="relative shrink-0">
                <p className="text-lg font-bold text-ink sm:text-xl">Qual relógio mostra esta hora?</p>
                <CorrectStar show={gotItRight} reduce={!!reduce} />
              </div>
              <p className="shrink-0 text-4xl font-extrabold tabular-nums text-ink sm:text-6xl">{format24(q.correct)}</p>
              {/* The 2×2 grid of square option clocks fills the leftover area,
                  centered, capped so it never gets gigantic on desktop. */}
              <div className="flex w-full min-h-0 flex-1 items-center justify-center">
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
                        <AnalogClock total={opt} size={320} show24={false} />
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

/** A gentle reward star that pops in over the question when the answer is right. */
function CorrectStar({ show, reduce }: { show: boolean; reduce: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="pointer-events-none absolute -right-8 -top-3 text-3xl"
          aria-hidden
          initial={reduce ? { opacity: 1 } : { scale: 0, rotate: -25, opacity: 0 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { scale: [0, 1.2, 1], rotate: [-25, 8, 0], opacity: 1 }
          }
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          ⭐
        </motion.span>
      )}
    </AnimatePresence>
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
