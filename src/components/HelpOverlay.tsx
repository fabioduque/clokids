import { useT } from '../lib/i18n'

// Round chrome shared by Quiz and Missões.
//
// RoundHud — a game-style header row: [?] hint trigger · "Missão 1/5" · [✕]
// abandon. The trigger only shows once the child has thought for a while
// (helpVisible) and disappears after the last hint stage.
//
// HintBubble — the hint TEXT as an overlay hugging an edge of its relative
// parent (the clock stage). Absolutely positioned, so opening help never
// displaces the layout (answers stay above the fold).

export interface RoundHudProps {
  counter: string
  helpVisible: boolean
  onHelp: () => void
  onAbandon: () => void
  abandonAria: string
}

export function RoundHud({ counter, helpVisible, onHelp, onAbandon, abandonAria }: RoundHudProps) {
  const ui = useT()
  const side =
    'grid h-9 w-9 place-items-center rounded-full border border-cardline bg-card/80 font-display text-base font-extrabold text-ink/70 shadow-soft backdrop-blur-md transition-transform duration-100 active:translate-y-0.5 active:shadow-none'
  return (
    <div className="flex w-full max-w-md shrink-0 items-center justify-between gap-2 lg:max-w-[52rem]">
      {helpVisible ? (
        <button type="button" onClick={onHelp} aria-label={ui.helpAria} className={side}>
          ?
        </button>
      ) : (
        <span className="h-9 w-9" aria-hidden />
      )}
      <p className="rounded-full bg-card/85 px-4 py-1 font-display text-sm font-extrabold text-ink/70 shadow-soft backdrop-blur-md">
        {counter}
      </p>
      <button type="button" onClick={onAbandon} aria-label={abandonAria} title={abandonAria} className={side}>
        ✕
      </button>
    </div>
  )
}

export interface HintBubbleProps {
  text: string
  visible: boolean
  edge?: 'bottom' | 'top'
  /** Tap-to-dismiss — the bubble overlays the dial, so the child must be able
   * to clear it to read the clock again (the HUD ? brings it back). */
  onDismiss: () => void
  /** When there's a deeper hint available (the 50:50 that fades two wrong
   * options), offer it right on the bubble — millionaire style. */
  onMore?: () => void
}

export function HintBubble({ text, visible, edge = 'bottom', onDismiss, onMore }: HintBubbleProps) {
  const ui = useT()
  if (!visible) return null
  const anchor = edge === 'bottom' ? 'bottom-0' : 'top-0'
  return (
    <div className={`pointer-events-none absolute ${anchor} inset-x-0 z-10 flex flex-col items-center gap-1`}>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={ui.hintDismissAria}
        className="pointer-events-auto max-w-full text-balance rounded-2xl bg-card/95 px-3 py-1.5 text-center text-xs font-bold text-ink/80 shadow-soft backdrop-blur-md transition-transform duration-100 active:translate-y-0.5 sm:text-sm"
      >
        💡 {text} <span aria-hidden className="ml-1 inline-block rounded-full bg-ink/10 px-1.5 text-ink/60">✕</span>
      </button>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="orbit-btn orbit-soft pointer-events-auto px-3 py-1 text-xs"
        >
          {ui.nextHint}
        </button>
      )}
    </div>
  )
}
