import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameErrorBoundary } from './components/GameErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameErrorBoundary label="monk.run hit a snag">
      <App />
    </GameErrorBoundary>
  </StrictMode>,
)
