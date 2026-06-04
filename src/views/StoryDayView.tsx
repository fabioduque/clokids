import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { AnalogClock } from '../components/AnalogClock'
import { Cloki } from '../components/Cloki'
import { HintBubble } from '../components/HelpOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { storyStep, type StoryDay } from '../lib/park'
import { fmtHourLang } from '../lib/missions'
import { hour12Of, split, mod1440 } from '../lib/timeModel'
import { playSuccess, playError } from '../lib/sound'
import { useLang, useT } from '../lib/i18n'

// Casa do Cloki — the guided story day. NO scoring, no wrong-answer penalty:
// the child lives a whole day with Cloki by setting the clock for each moment,
// and the living sky sweeps from dawn to night as the story advances.

export interface StoryDayViewProps {
  day: StoryDay
  /** Settings opt-in: glow green the moment the dial is right (default off). */
  confirmGlow: boolean
  onSkyTime?: (total: number | null) => void
  onDone: (dayId: string) => void
  onExit: () => void
}

export function StoryDayView({ day, confirmGlow, onSkyTime, onDone, onExit }: StoryDayViewProps) {
  const lang = useLang()
  const ui = useT()
  const reduce = useReducedMotion()
  const [mIdx, setMIdx] = useState(0)
  const [solved, setSolved] = useState(false)
  const [total, setTotal] = useState(() => mod1440(day.moments[0].target - 90)) // start a bit before the story
  const [attempts, setAttempts] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)
  const [confirmExit, setConfirmExit] = useState(false)
  const ended = mIdx >= day.moments.length
  const moment = day.moments[Math.min(mIdx, day.moments.length - 1)]

  // The sky trails the story: before solving it sits at the previous moment.
  useEffect(() => {
    const prev = mIdx === 0 ? mod1440(day.moments[0].target - 90) : day.moments[mIdx - 1].target
    onSkyTime?.(ended ? day.moments[day.moments.length - 1].target : solved ? moment.target : prev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mIdx, solved, ended])
  useEffect(() => () => onSkyTime?.(null), [onSkyTime])

  useEffect(() => {
    if (ended) onDone(day.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended])

  function confirm() {
    if (solved || ended) return
    // 12h dial: compare appearance (mod 720) — "9 o'clock" satisfies 21h00.
    if (total % 720 === moment.target % 720) {
      playSuccess()
      setSolved(true)
      setTimeout(() => {
        setSolved(false)
        setAttempts(0)
        setMIdx((i) => i + 1)
      }, 1700)
    } else {
      playError()
      setAttempts((a) => a + 1)
      setShakeKey((k) => k + 1)
    }
  }

  if (ended) {
    return (
      <div className="mx-auto flex w-full max-w-sm min-h-full flex-col items-center justify-center gap-4 py-8 text-center">
        <Cloki pose="sleep" size={104} />
        <h2 className="rounded-2xl bg-card/85 px-6 py-2 font-display text-3xl font-extrabold text-ink shadow-panel backdrop-blur-md">
          {ui.storyEndTitle}
        </h2>
        <p className="font-bold text-ink/80">{ui.storyEndText}</p>
        {/* The whole day, recapped as a timeline. */}
        <div className="panel flex w-full flex-col gap-1.5 p-4 text-left">
          {day.moments.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-bold text-ink">
              <span aria-hidden>{m.emoji}</span>
              <span className="font-display tabular-nums text-ink/70">{fmtHourLang(m.target, lang)}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onExit} className="btn-sun py-3 text-lg">
          {ui.backToPark}
        </button>
      </div>
    )
  }

  const { hour24, minute } = split(moment.target)
  const hint = ui.setHint(hour12Of(hour24), minute === 0 ? 12 : minute / 5)

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 pb-2 pt-3 sm:gap-4 sm:py-5">
      {/* Story HUD: moment counter + exit. */}
      <div className="relative flex w-full max-w-md shrink-0 items-center justify-center lg:max-w-[52rem]">
        <p className="rounded-full bg-card/85 px-4 py-1 font-display text-sm font-extrabold text-ink/70 shadow-soft backdrop-blur-md">
          {day.emoji} {mIdx + 1}/{day.moments.length}
        </p>
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          aria-label={ui.storyExitQ}
          className="absolute right-0 grid h-9 w-9 place-items-center rounded-full border border-cardline bg-card/80 font-display text-base font-extrabold text-ink/70 shadow-soft backdrop-blur-md"
        >
          ✕
        </button>
      </div>
      <ConfirmDialog
        open={confirmExit}
        text={ui.storyExitQ}
        confirmLabel={ui.confirmExit}
        cancelLabel={ui.keepPlaying}
        onConfirm={() => {
          setConfirmExit(false)
          onExit()
        }}
        onCancel={() => setConfirmExit(false)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={mIdx}
          className="flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-2 sm:gap-4 lg:flex-none lg:flex-row lg:items-center lg:justify-center lg:gap-12"
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <motion.div
            key={`shake-${shakeKey}`}
            animate={shakeKey > 0 && !solved ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative flex aspect-square w-[min(76vw,34vh,20rem)] shrink-0 items-center justify-center lg:w-[min(48vh,25rem)]"
            style={{ filter: confirmGlow && total % 720 === moment.target % 720 && !solved ? 'drop-shadow(0 0 14px rgba(74,222,128,0.85))' : undefined }}
          >
            <AnalogClock
              total={total}
              step={solved ? undefined : storyStep(moment.target)}
              onChange={solved ? undefined : setTotal}
              size={440}
              show24={false}
            />
            <HintBubble text={hint} visible={attempts >= 2 && !solved} onDismiss={() => setAttempts(1)} />
          </motion.div>

          <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-2 sm:gap-3 lg:max-w-sm">
            {/* Cloki acts the moment out beside the story card. */}
            <div className="flex items-center gap-2">
              <Cloki pose={solved && moment.pose !== 'sleep' ? 'cheer' : moment.pose} size={72} />
              <div className="panel flex items-center gap-2 p-3 text-left sm:p-4">
                <span className="text-3xl" aria-hidden>
                  {moment.emoji}
                </span>
                <p className="text-pretty text-sm font-bold leading-snug text-ink sm:text-base">{moment.text}</p>
              </div>
            </div>
            {attempts > 0 && !solved && (
              <p className="text-balance text-center text-sm font-bold text-ink/70">{ui.almostTryAgain}</p>
            )}
            <button type="button" onClick={confirm} disabled={solved} className="btn-sun w-full max-w-xs py-3 text-xl">
              {ui.pronto}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
