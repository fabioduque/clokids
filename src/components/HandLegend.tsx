export function HandLegend() {
  return (
    <div className="flex gap-4 text-sm font-bold text-ink">
      <span className="flex items-center gap-1">
        <span className="inline-block h-1.5 w-6 rounded-full bg-hourHand" /> horas
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-1 w-8 rounded-full bg-minHand" /> minutos
      </span>
    </div>
  )
}
