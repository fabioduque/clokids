// Gentle screen-time awareness: the session "starts" on every page load (a
// browser refresh resets it on purpose — this is a nudge, not surveillance).
// After BREAK_AFTER_MIN minutes of play we suggest a pause; if the child
// dismisses it, we ask again every REMIND_EVERY_MIN minutes. Never blocking —
// the kid can always keep playing; the goal is awareness, with parents in mind.

export const BREAK_AFTER_MIN = 30
export const REMIND_EVERY_MIN = 15

/** Minutes from when play started (startMs) to `nowMs`, floored, never negative. */
export function playMinutes(startMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startMs) / 60_000))
}

/**
 * Whether the "take a break" suggestion should be visible.
 * dismissedAtMin = the playMinutes value when the child last dismissed it
 * (null = never dismissed this session).
 */
export function shouldSuggestBreak(minutes: number, dismissedAtMin: number | null): boolean {
  if (minutes < BREAK_AFTER_MIN) return false
  if (dismissedAtMin === null) return true
  return minutes - dismissedAtMin >= REMIND_EVERY_MIN
}
