import { useEffect } from 'react'
import { useColorMode } from 'theme-ui'
import { useSettingsStore } from '../stores'
import { useAuthStore } from '../stores'

const ThemeSync = () => {
  const [, setColorMode] = useColorMode()
  const { currentUser } = useAuthStore()
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    if (currentUser) loadSettings(currentUser.id)
  }, [currentUser])

  useEffect(() => {
    if (!settings) return
    if (settings.theme === 'auto') {
      setColorMode('default')
    } else {
      setColorMode(settings.theme) // 'light' or 'dark'
    }
  }, [settings?.theme])

  return null
}

export default ThemeSync