import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { boot } from './api'
import './index.css'

boot().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
