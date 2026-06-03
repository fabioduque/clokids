import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// A kid-friendly confirmation card (used by the round ✕): nothing destructive
// happens on a stray tap — the action only runs after an explicit "yes".

export interface ConfirmDialogProps {
  open: boolean
  text: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, text, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label={text}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="panel flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center"
            initial={reduce ? false : { scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-pretty font-display text-xl font-extrabold text-ink">{text}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={onCancel} className="btn-soft">
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} className="btn-sun">
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
