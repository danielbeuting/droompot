import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ManageV2 from './ManageV2.jsx'
import '../style.css'
import './theme-fixes.css'
import './v2-bridge.css'
import './feedback-preview.css'
import './feedback-preview.js'
import './manage-v2.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}))
}

const isManageRoute = /^\/app\/[^/]+\/?$/.test(window.location.pathname)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {isManageRoute ? <ManageV2 /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
)
