import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App.jsx'
import ManageV2 from './ManageV2.jsx'
import '../style.css'
import './v2-bridge.css'
import './feedback-preview.css'
import './manage-v2.css'

function Entry(){
  const location=useLocation()
  if(/^\/app\/[^/]+\/?$/.test(location.pathname)) return <ManageV2 />
  return <App />
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Entry />
    </BrowserRouter>
  </React.StrictMode>,
)
