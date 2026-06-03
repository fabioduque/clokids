import { AnalogClock } from '../components/AnalogClock'
import { DigitalClock } from '../components/DigitalClock'
import { DayNightToggle } from '../components/DayNightToggle'
import { HandLegend } from '../components/HandLegend'
import { ListenButton } from '../components/ListenButton'
import { SnapToggle } from '../components/SnapToggle'
import { isPM, split, toTotal, toSpokenWords, hour12Of } from '../lib/timeModel'
import { toSpokenWordsEn } from '../lib/timeWordsEn'
import { useLang, useT } from '../lib/i18n'
import type { Settings } from '../lib/profileStore'

export interface FreePlayViewProps {
  total: number
  onChange: (total: number) => void
  settings: Settings
  onSnapChange: (snap: Settings['snap']) => void
  seconds: number | null
  onNow: () => void
}

export function FreePlayView({ total, onChange, settings, onSnapChange, seconds, onNow }: FreePlayViewProps) {
  const lang = useLang()
  const ui = useT()
  const { hour24, minute } = split(total)
  const pm = isPM(hour24)
  const spoken =
    lang === 'pt'
      ? toSpokenWords(hour24, minute, settings.show24h)
      : toSpokenWordsEn(hour24, minute, settings.show24h)

  function setPm(nextPm: boolean) {
    onChange(toTotal(hour12Of(hour24), minute, nextPm))
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 py-2 sm:gap-5 sm:py-5 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-6">
      {/* Clock stage — sized to fit BOTH width and height (min(vw, vh)) so it
          shrinks on short viewports instead of forcing the panel off-screen.
          The 10:11 ratio reserves a strip under the dial where the two actions
          sit tucked UNDER the lower arc (≈7h and ≈5h, flanking the 6) like
          little feet: near the clock, always reachable, never on the hands. */}
      <div className="relative aspect-[10/11] w-[min(86vw,39vh,24rem)] shrink-0 lg:w-[min(42vw,58vh,28rem)]">
        {/* The dial itself: a square pinned to the top of the stage. */}
        <div className="absolute inset-x-0 top-0 aspect-square">
          {/* Corner snap pill: only below lg. On lg the toggle lives in the panel. */}
          <div className="absolute right-[1%] top-[1%] z-20 lg:hidden">
            <SnapToggle snap={settings.snap} onChange={onSnapChange} />
          </div>
          {/* Day/night flip (24h mode): a round ☀️/🌙 button in the top-LEFT
              corner on phones — it belongs to the sky, mirrors the snap pill,
              and keeps the panel short. On lg the labelled toggle is in the
              panel instead. */}
          {settings.show24h && (
            <button
              type="button"
              onClick={() => setPm(!pm)}
              aria-label={pm ? ui.dayNightToMorningAria : ui.dayNightToEveningAria}
              className="absolute left-[1%] top-[1%] z-20 grid h-11 w-11 place-items-center rounded-full border border-cardline bg-card text-2xl shadow-soft transition-transform duration-100 active:translate-y-0.5 active:shadow-none lg:hidden"
            >
              <span aria-hidden>{pm ? '🌙' : '☀️'}</span>
            </button>
          )}
          <AnalogClock total={total} step={settings.snap} onChange={onChange} size={560} seconds={seconds} show24={settings.show24h} showMinuteHelp={settings.showMinuteHelp} />
        </div>

        {/* Actions hugging the lower arc. Agora resets to the live time; Ouvir
            speaks the displayed hour. */}
        <div className="absolute left-[22%] top-[94%] z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={onNow}
            aria-label={ui.nowAria}
            className="orbit-btn orbit-soft"
          >
            {ui.now}
          </button>
        </div>
        <div className="absolute left-[78%] top-[94%] z-10 -translate-x-1/2 -translate-y-1/2">
          <ListenButton text={spoken} enabled={settings.voice} className="orbit-btn orbit-sun" />
        </div>
      </div>

      {/* Compact panel — just the readout, the words, the how-to hint, and (on
          lg) the snap control. A frosted card at every breakpoint so it stays
          legible over any sky. With the actions orbiting the clock, this stays
          short and never pushes content off a small screen. */}
      <div className="panel flex w-full max-w-md shrink-0 flex-col items-center gap-2 p-3 sm:gap-4 sm:p-5 lg:w-[22rem] lg:max-w-none lg:items-stretch lg:gap-[clamp(0.5rem,2.4vh,1.25rem)] lg:p-[clamp(0.8rem,3vh,2rem)]">
        <div className="flex flex-col items-center gap-1.5 sm:gap-3 lg:gap-3">
          {settings.showHandLegend && <HandLegend />}
          <DigitalClock total={total} showWords={settings.showWords} seconds={seconds} show24h={settings.show24h} />
        </div>

        {/* Day/night toggle (24h mode), desktop only — phones use the ☀️/🌙
            orbit button on the clock instead. */}
        {settings.show24h && (
          <div className="hidden lg:block lg:border-t lg:border-cardline lg:pt-[clamp(0.6rem,2.2vh,1.25rem)]">
            <DayNightToggle pm={pm} onChange={setPm} />
          </div>
        )}

        {/* How to use the clock — kids/parents need to know it's interactive. */}
        <p className="text-balance text-center text-sm font-bold leading-snug text-ink/60 lg:border-t lg:border-cardline lg:pt-[clamp(0.6rem,2.2vh,1.25rem)]">
          {ui.instruction}
        </p>

        {/* Snap control: labeled group, only on lg (replaces the corner pill). */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2 lg:border-t lg:border-cardline lg:pt-[clamp(0.6rem,2.2vh,1.25rem)]">
          <span className="text-sm font-bold uppercase tracking-wide text-ink/60">{ui.snapTitle}</span>
          <SnapToggleRow snap={settings.snap} onChange={onSnapChange} />
        </div>
      </div>
    </div>
  )
}

/** Horizontal 15 · 5 · 1 snap control for the desktop panel: same options as
 * the corner SnapToggle but laid out as a roomy labeled row, not a cramped pill. */
function SnapToggleRow({ snap, onChange }: { snap: Settings['snap']; onChange: (snap: Settings['snap']) => void }) {
  const ui = useT()
  const OPTS: Array<Settings['snap']> = [15, 5, 1]
  return (
    <div
      className="flex items-center gap-1 rounded-full border-2 border-ring/50 bg-card p-1 font-display shadow-soft"
      role="group"
      aria-label={ui.snapAria}
    >
      {OPTS.map((s, i) => (
        <div key={s} className="flex items-center">
          {i > 0 && <span className="px-0.5 text-ink/25" aria-hidden>·</span>}
          <button
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={snap === s}
            aria-label={ui.snapStepAria(s)}
            className={`min-w-[3rem] rounded-full px-4 py-2 text-base font-extrabold leading-none transition-colors ${
              snap === s ? 'bg-ring text-white shadow' : 'text-ink hover:bg-ring/10'
            }`}
          >
            {s}
          </button>
        </div>
      ))}
    </div>
  )
}
