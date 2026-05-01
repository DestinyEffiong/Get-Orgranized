import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'theme-ui'
import theme from './styles/theme'
import App from './App'
import './styles/global.css'
import { useAuthStore } from './stores'
import ThemeSync from './components/ThemeSync.tsx'

// Initialize auth store
useAuthStore.getState().initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ThemeSync />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)