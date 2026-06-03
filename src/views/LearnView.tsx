import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { ListenButton } from '../components/ListenButton'
import { speak } from '../lib/speak'
import { useLang, useT, type Lang } from '../lib/i18n'

export interface LearnViewProps {
  onGoToPlay: () => void
}

const t = (h: number, m: number) => h * 60 + m

interface Step {
  total: number
  show24: boolean
  title: string
  text: string
  spoken: string
  highlightRange?: { from: number; to: number }
}

// The lesson, in both languages. Clock states are identical; only words change.
const STEPS_BY_LANG: Record<Lang, Step[]> = {
  pt: [
    { total: t(3, 0), show24: false, title: 'O relógio', text: 'Tem números de 1 a 12 à volta.', spoken: 'O relógio tem os números de um a doze.' },
    { total: t(3, 10), show24: false, title: 'Dois ponteiros', text: 'Vermelho = horas. Azul = minutos.', spoken: 'Há dois ponteiros. O vermelho mostra as horas. O azul mostra os minutos.' },
    { total: t(3, 0), show24: false, title: 'A hora', text: 'O ponteiro pequeno aponta a hora. Aqui: 3 horas.', spoken: 'O ponteiro pequeno aponta para a hora. Aqui são três horas.' },
    { total: t(1, 10), show24: false, title: 'Entre as horas', text: 'O ponteiro pequeno mal saiu do 1. Ainda é 1 hora.', spoken: 'Olha para o ponteiro pequeno. Mal saiu do um. Ainda é uma hora.', highlightRange: { from: 1, to: 2 } },
    { total: t(1, 30), show24: false, title: 'Ainda é 1 hora', text: 'Já vai a meio caminho entre o 1 e o 2. E ainda é 1 hora!', spoken: 'Já vai a meio do caminho entre o um e o dois. E ainda é uma hora.', highlightRange: { from: 1, to: 2 } },
    { total: t(1, 50), show24: false, title: 'Ainda é 1 hora', text: 'Está quase a tocar no 2... e mesmo assim, ainda é 1 hora!', spoken: 'Está quase a tocar no dois. E mesmo assim, ainda é uma hora.', highlightRange: { from: 1, to: 2 } },
    { total: t(2, 0), show24: false, title: 'Agora sim — 2 horas!', text: 'Só agora o ponteiro chegou às 2 horas — e o dos minutos está no 12.', spoken: 'Só agora o ponteiro pequeno chegou às duas horas. E o ponteiro dos minutos está no doze.' },
    { total: t(3, 10), show24: false, title: 'Os minutos', text: 'Cada número vale 5 minutos. Conta de 5 em 5.', spoken: 'O ponteiro grande conta os minutos. Cada número vale cinco minutos.' },
    { total: t(3, 30), show24: false, title: 'E meia', text: 'Ponteiro grande no 6: três e meia (3:30).', spoken: 'No seis é e meia. Três e meia.' },
    { total: t(3, 15), show24: false, title: 'E um quarto', text: 'Ponteiro grande no 3: três e um quarto (3:15).', spoken: 'No três é e um quarto. Três e um quarto.' },
    { total: t(3, 45), show24: false, title: 'Um quarto para', text: 'Ponteiro grande no 9: um quarto para as 4 (3:45).', spoken: 'No nove é um quarto para. Um quarto para as quatro.' },
    { total: t(15, 0), show24: true, title: 'Manhã e tarde', text: 'De tarde soma-se 12: 3 da tarde = 15h.', spoken: 'De tarde somamos doze. Três da tarde são quinze horas.' },
  ],
  en: [
    { total: t(3, 0), show24: false, title: 'The clock', text: 'It has the numbers 1 to 12 all around.', spoken: 'The clock has the numbers one to twelve.' },
    { total: t(3, 10), show24: false, title: 'Two hands', text: 'Red = hours. Blue = minutes.', spoken: 'There are two hands. The red one shows the hours. The blue one shows the minutes.' },
    { total: t(3, 0), show24: false, title: 'The hour', text: "The small hand points to the hour. Here: 3 o'clock.", spoken: "The small hand points to the hour. Here it is three o'clock." },
    { total: t(1, 10), show24: false, title: 'Between hours', text: "The small hand just left the 1. It is still 1 o'clock.", spoken: "Look at the small hand. It just left the one. It is still one o'clock.", highlightRange: { from: 1, to: 2 } },
    { total: t(1, 30), show24: false, title: "Still 1 o'clock", text: "Halfway between the 1 and the 2 — and it is still 1 o'clock!", spoken: "It is halfway between the one and the two. And it is still one o'clock.", highlightRange: { from: 1, to: 2 } },
    { total: t(1, 50), show24: false, title: "Still 1 o'clock", text: "Almost touching the 2... and it is STILL 1 o'clock!", spoken: "It is almost touching the two. And it is still one o'clock.", highlightRange: { from: 1, to: 2 } },
    { total: t(2, 0), show24: false, title: "Now it's 2!", text: "Only now did the hand reach 2 o'clock — and the minute hand is on the 12.", spoken: "Only now did the small hand reach two o'clock. And the minute hand is on the twelve." },
    { total: t(3, 10), show24: false, title: 'The minutes', text: 'Each number is worth 5 minutes. Count by fives.', spoken: 'The big hand counts the minutes. Each number is worth five minutes.' },
    { total: t(3, 30), show24: false, title: 'Half past', text: 'Big hand on the 6: half past three (3:30).', spoken: 'On the six it is half past. Half past three.' },
    { total: t(3, 15), show24: false, title: 'Quarter past', text: 'Big hand on the 3: quarter past three (3:15).', spoken: 'On the three it is quarter past. Quarter past three.' },
    { total: t(3, 45), show24: false, title: 'Quarter to', text: 'Big hand on the 9: quarter to four (3:45).', spoken: 'On the nine it is quarter to. Quarter to four.' },
    { total: t(15, 0), show24: true, title: 'Morning & afternoon', text: 'In the afternoon, add 12: 3 PM = 15h.', spoken: 'In the afternoon we add twelve. Three in the afternoon is fifteen.' },
  ],
}

export function LearnView({ onGoToPlay }: LearnViewProps) {
  const reduce = useReducedMotion()
  const lang = useLang()
  const ui = useT()
  const STEPS = STEPS_BY_LANG[lang]
  // step ranges 0..STEPS.length; the last index (=== STEPS.length) is the final CTA.
  const [step, setStep] = useState(0)
  const onFinal = step >= STEPS.length

  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => setStep((s) => Math.min(STEPS.length, s + 1))

  // Auto-play the step's spoken phrase when the user advances or goes back.
  // Skip the initial mount (step 1: the child presses Ouvir) and the final
  // celebration screen (no spoken phrase). speak() cancels any ongoing
  // utterance and no-ops when no matching voice exists, so this is safe.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (step < STEPS.length) speak(STEPS[step].spoken, lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  return (
    <div className="flex min-h-full flex-col items-center gap-2 py-2 sm:gap-4 sm:py-5 lg:justify-center lg:gap-5">
      {/* Progress lives at the very top on phones/tablets (a frosted chip that
          reads over the sky); on lg it moves INSIDE the lesson card (below) so
          the right column is one cohesive panel, not a floating island. */}
      {onFinal ? (
        <div className="shrink-0 rounded-full border border-cardline/80 bg-card/80 px-5 py-2 font-display text-sm font-bold text-ink/60 shadow-soft backdrop-blur-md">
          {ui.doneChip}
        </div>
      ) : (
        <div className="shrink-0 rounded-full border border-cardline/80 bg-card/80 px-3 py-1 shadow-soft backdrop-blur-md lg:hidden">
          <LessonProgress step={step} total={STEPS.length} />
        </div>
      )}

      {onFinal ? (
        <FinalScreen onGoToPlay={onGoToPlay} reduce={!!reduce} />
      ) : (
        <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-2 sm:gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:flex-none">
          {/* Lesson clock — a responsive square that fits BOTH width and height
              (min(vw, vh)), never flex-1: a width-filled square would shove the
              lesson card below the fold on phones. Larger fixed square on lg. */}
          <div className="flex aspect-square w-[min(80vw,29vh,22rem)] shrink-0 items-center justify-center lg:w-[min(50vh,28rem)]">
            <AnalogClock
              total={STEPS[step].total}
              show24={STEPS[step].show24}
              size={460}
              highlightRange={STEPS[step].highlightRange ?? null}
            />
          </div>

          {/* Lesson card: progress (desktop only), the step, then the nav. */}
          <div className="panel flex w-full max-w-md shrink-0 flex-col gap-2.5 p-3 sm:gap-4 sm:p-6 lg:w-[25rem] lg:max-w-none lg:gap-5 lg:p-8">
            <div className="hidden border-b border-cardline pb-4 lg:block">
              <LessonProgress step={step} total={STEPS.length} align="start" />
            </div>

            {/* Title + one short line + listen button. Cross-fades per step. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${lang}-${step}`}
                className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{STEPS[step].title}</h2>
                <p className="text-pretty text-base font-bold text-ink/70 sm:text-lg">{STEPS[step].text}</p>
                {/* Centred even on lg, where the title/text are left-aligned.
                    Compact on phones so the card cedes height to the clock. */}
                <div className="self-center">
                  <ListenButton
                    text={STEPS[step].spoken}
                    className="btn-sun inline-flex items-center gap-2 px-5 py-2 text-base lg:px-6 lg:py-3 lg:text-lg"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation. Compact on phones (the clock deserves the space);
                on the first step Seguinte centres alone on mobile and spans the
                desktop card as an inviting "start". */}
            <div className="flex items-center gap-3 border-t border-cardline pt-3 lg:pt-5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={back}
                  aria-label={ui.back}
                  className="btn-soft px-4 py-2 text-sm lg:px-5 lg:py-2.5 lg:text-base"
                >
                  {ui.back}
                </button>
              )}
              <button
                type="button"
                onClick={next}
                aria-label={ui.next}
                className={`btn-sun px-5 py-2.5 text-base lg:py-3 lg:text-lg ${
                  step === 0 ? 'mx-auto lg:mx-0 lg:w-full' : 'ml-auto'
                }`}
              >
                {ui.next}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Lesson progress: dots + "Passo X de N". Centred in the mobile top chip,
 * left-aligned when it sits inside the desktop lesson card header. */
function LessonProgress({ step, total, align = 'center' }: { step: number; total: number; align?: 'center' | 'start' }) {
  const ui = useT()
  return (
    <div className={`flex flex-col gap-1 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors lg:h-2.5 lg:w-2.5 ${
              i === step ? 'bg-ring' : i < step ? 'bg-ring/50' : 'bg-ink/15'
            }`}
          />
        ))}
      </div>
      <p className="font-display text-xs font-bold text-ink/60 lg:text-sm">{ui.stepOf(step + 1, total)}</p>
    </div>
  )
}

function FinalScreen({ onGoToPlay, reduce }: { onGoToPlay: () => void; reduce: boolean }) {
  const ui = useT()
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
        <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{ui.finalTitle}</h2>
        <p className="max-w-xs rounded-2xl bg-card/80 px-4 py-2 text-lg font-bold text-ink/70 shadow-soft backdrop-blur-md">{ui.finalText}</p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onGoToPlay}
        className="btn-sun px-8 py-4 text-2xl"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.2 }}
      >
        {ui.finalCta}
      </motion.button>
    </div>
  )
}
