import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState('checking…')

  useEffect(() => {
    fetch('/actuator/health')
      .then(r => r.json())
      .then(d => setHealth(d.status))
      .catch(() => setHealth('DOWN'))
  }, [])

  return <h1>Backend: {health}</h1>
}

export default App
