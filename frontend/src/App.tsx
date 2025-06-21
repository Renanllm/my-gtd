import { useState } from 'react'
import './App.css'

function App() {
  const [response, setResponse] = useState<string>('')

  const fetchHealthStatus = async () => {
    const response = await fetch('http://localhost:3001/health')
    const data = await response.json()
    setResponse(JSON.stringify(data))
  }

  return (
    <>
      <h1>API Health Check</h1>
      <div className="card">
        <button onClick={fetchHealthStatus}>
          Check Health Status
        </button>
        <p>
          {response}
        </p>
      </div>
    </>
  )
}

export default App
