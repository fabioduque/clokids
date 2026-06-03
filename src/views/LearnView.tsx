import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { ListenButton } from '../components/ListenButton'
import { speak } from '../lib/speak'

export interface LearnViewProps {
  onGoToPlay: () => void
}

const t = (h: number, m: number) => h * 60 + m

const STEPS = [
  { total: t(3, 0), show24: false, title: 'O relógio', text: 'Tem números de 1 a 12 à volta.', spoken: 'O relógio tem os números de um a doze.' },
  { total: t(3, 10), show24: false, title: 'Dois ponteiros', text: 'Vermelho = horas. Azul = minutos.', spoken: 'Há dois ponteiros. O vermelho mostra as horas. O azul mostra os minutos.' },
  { total: t(3, 0), show24: false, title: 'A hora', text: 'O ponteiro pequeno aponta a hora. Aqui: 3 horas.', spoken: 'O ponteiro pequeno aponta para a hora. Aqui são três horas.' },
  { total: t(3, 10), show24: false, title: 'Os minutos', text: 'Cada número vale 5 minutos. Conta de 5 em 5.', spoken: 'O ponteiro grande conta os minutos. Cada número vale cinco minutos.' },
  { total: t(3, 30), show24: false, title: 'E meia', text: 'Ponteiro grande no 6: três e meia (3:30).', spoken: 'No seis é e meia. Três e meia.' },
  { total: t(3, 15), show24: false, title: 'E um quarto', text: 'Ponteiro grande no 3: três e um quarto (3:15).', spoken: 'No três é e um quarto. Três e um quarto.' },
  { total: t(3, 45), show24: false, title: 'Um quarto para', text: 'Ponteiro grande no 9: um quarto para as 4 (3:45).', spoken: 'No nove é um quarto para. Um quarto para as quatro.' },
  { total: t(15, 0), show24: true, title: 'Manhã e tarde', text: 'De tarde soma-se 12: 3 da tarde = 15h.', spoken: 'De tarde somamos doze. Três da tarde são quinze horas.' },
] as const

export function LearnView({ onGoToPlay }: LearnViewProps) {
  const reduce = useReducedMotion()
  // step ranges 0..STEPS.length; the last index (=== STEPS.length) is the final CTA.
  const [step, setStep] = useState(0)
  const onFinal = step >= STEPS.length
  const last = STEPS.length // index of the CTA "page"

  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => setStep((s) => Math.min(last, s + 1))

  // Auto-play the step's spoken phrase when the user advances or goes back.
  // Skip the initial mount (step 1: the child presses Ouvir) and the final
  // celebration screen (no spoken phrase). speak() cancels any ongoing
  // utterance and no-ops when no Portuguese voice exists, so this is safe.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (step < STEPS.length) speak(STEPS[step].spoken)
  }, [step])

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 py-2 sm:gap-3 sm:py-4">
      {/* TOP: progress — dots + "Passo X de N" */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === step ? 'bg-ring' : i < step ? 'bg-ring/50' : 'bg-ink/15'
              }`}
            />
          ))}
        </div>
        <p className="text-sm font-bold text-ink/60">
          {onFinal ? 'Concluído!' : `Passo ${step + 1} de ${STEPS.length}`}
        </p>
      </div>

      {onFinal ? (
        <FinalScreen onGoToPlay={onGoToPlay} reduce={!!reduce} />
      ) : (
        <>
          {/* MIDDLE: the clock owns the leftover vertical space so it stays LARGE.
              It animates (eases) between steps as `total` changes. */}
          <div className="flex w-full min-h-0 flex-1 items-center justify-center">
            <AnalogClock total={STEPS[step].total} show24={STEPS[step].show24} size={380} />
          </div>

          {/* Title + ONE short line + listen button. Cross-fades per step. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="flex shrink-0 flex-col items-center gap-2 text-center"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{STEPS[step].title}</h2>
              <p className="max-w-xs text-base font-bold text-ink/70 sm:text-lg">{STEPS[step].text}</p>
              <ListenButton text={STEPS[step].spoken} />
            </motion.div>
          </AnimatePresence>

          {/* BOTTOM: navigation */}
          <div className="flex w-full max-w-md shrink-0 items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              aria-label="Voltar"
              className="rounded-full bg-white px-5 py-3 text-lg font-extrabold text-ink shadow-md transition-transform active:scale-95 disabled:invisible"
            >
              ◀ Voltar
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Seguinte"
              className="rounded-full bg-ring px-6 py-3 text-lg font-extrabold text-white shadow-md transition-transform active:scale-95"
            >
              Seguinte ▶
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FinalScreen({ onGoToPlay, reduce }: { onGoToPlay: () => void; reduce: boolean }) {
  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-5 text-center">
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <span className="text-6xl" aria-hidden>
          🎉
        </span>
        <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">Já sabes o básico!</h2>
        <p className="max-w-xs text-lg font-bold text-ink/70">Agora é a tua vez de mexer no relógio.</p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onGoToPlay}
        className="rounded-full bg-ring px-8 py-4 text-2xl font-extrabold text-white shadow-md transition-transform active:scale-95"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.2 }}
      >
        Vamos brincar! 🕐
      </motion.button>
    </div>
  )
}
