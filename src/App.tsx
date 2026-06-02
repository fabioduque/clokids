import { AnalogClock } from './components/AnalogClock'

export default function App() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center font-rounded">
      <AnalogClock total={945} />
    </div>
  )
}
