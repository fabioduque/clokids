import { QuizView } from './views/QuizView'

export default function App() {
  return (
    <div className="min-h-screen bg-bg font-rounded">
      <QuizView level={1} onFinish={(s) => alert(`Score: ${s}`)} />
    </div>
  )
}
