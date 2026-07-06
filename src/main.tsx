import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import './styles/global.css'
import App from './App.tsx'

posthog.init('phc_z0xU9FFE7keUpesMpuXAZszgeMqAS4ZpRMqLB5zXB25', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: 'history_change',
  session_recording: { maskAllInputs: true },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
