import { useState } from 'react'
import { AnalogClock } from './components/AnalogClock'
import { format24 } from './lib/timeModel'

export default function App() {
  const [t, setT] = useState(945)
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 font-rounded">
      <AnalogClock total={t} step={5} onChange={setT} />
      <p className="text-2xl font-extrabold text-ink">{format24(t)}</p>
    </div>
  )
}
