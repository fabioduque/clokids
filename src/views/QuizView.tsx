import { useMemo, useState } from 'react'
import { AnalogClock } from '../components/AnalogClock'
import { makeQuestion, type Level, type Question } from '../lib/quiz'
import { format24, format12, split, toWords, periodWord } from '../lib/timeModel'

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

  const results = useMemo(() => '⭐'.repeat(score) + '☆'.repeat(ROUND - score), [score, done])

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <h2 className="text-3xl font-extrabold text-ink">Acertaste {score}/{ROUND}!</h2>
        <p className="text-4xl">{results}</p>
        <button className="rounded-full bg-ring px-6 py-3 text-xl font-extrabold text-white shadow-md active:scale-95"
          onClick={() => onFinish(score)}>
          Continuar
        </button>
      </div>
    )
  }

  function choose(option: number) {
    if (picked !== null) return
    setPicked(option)
    if (option === q.correct) setScore((s) => s + 1)
    setTimeout(() => {
      setPicked(null)
      setIdx((i) => i + 1)
    }, 1400)
  }

  function digitalLabel(total: number) {
    const { hour24, minute } = split(total)
    return `${format24(total)} · ${toWords(hour24, minute)} ${periodWord(hour24)}`
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex gap-2">
        {Array.from({ length: ROUND }, (_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full ${i < idx ? 'bg-ring' : 'bg-ink/20'}`} />
        ))}
      </div>

      {q.direction === 'analogToDigital' ? (
        <>
          <p className="text-xl font-bold text-ink">Que horas são?</p>
          <AnalogClock total={q.correct} size={240} />
          <div className="grid w-full max-w-md grid-cols-1 gap-3">
            {q.options.map((opt) => (
              <button key={opt} onClick={() => choose(opt)}
                className={feedbackClass(opt, picked, q.correct)}>
                {format24(opt)} <span className="text-ink24">({format12(opt)})</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-xl font-bold text-ink">Qual relógio mostra esta hora?</p>
          <p className="text-4xl font-extrabold text-ink">{digitalLabel(q.correct)}</p>
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {q.options.map((opt) => (
              <button key={opt} onClick={() => choose(opt)}
                className={`flex items-center justify-center rounded-2xl p-2 ${feedbackClass(opt, picked, q.correct)}`}>
                <AnalogClock total={opt} size={130} show24={false} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function feedbackClass(opt: number, picked: number | null, correct: number): string {
  const base = 'rounded-2xl border-2 px-4 py-3 text-xl font-extrabold shadow-sm transition-colors'
  if (picked === null) return `${base} border-ring/40 bg-white text-ink active:scale-95`
  if (opt === correct) return `${base} border-green-500 bg-green-100 text-green-800`
  if (opt === picked) return `${base} border-red-300 bg-red-50 text-red-400`
  return `${base} border-ink/10 bg-white text-ink/40`
}
