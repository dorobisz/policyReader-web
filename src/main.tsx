import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-md">
        <h1 className="font-headline-md text-headline-md text-on-surface">
          BrokerEngine
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Policy Intelligence — Scaffold Ready
        </p>
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '48px' }}>
          check_circle
        </span>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
