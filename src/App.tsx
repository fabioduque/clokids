import { useState } from 'react'
import { FreePlayView } from './views/FreePlayView'
import { DEFAULT_PROFILE } from './lib/profileStore'

export default function App() {
  const [total, setTotal] = useState(945)
  return (
    <div className="min-h-screen bg-bg font-rounded">
      <FreePlayView total={total} onChange={setTotal} settings={DEFAULT_PROFILE.settings} />
    </div>
  )
}
