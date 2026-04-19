import { useEffect, useRef } from 'react'
import { useTaskStore, useSettingsStore, useAuthStore } from '../stores'

export const useReminderPoller = () => {
  const { currentUser } = useAuthStore()
  const { tasks, updateTask } = useTaskStore()
  const { settings } = useSettingsStore()

  // Exact-time timeouts (primary)
  const scheduled = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Always-fresh refs — closures inside setTimeout/setInterval never go stale
  const updateTaskRef  = useRef(updateTask)
  const tasksRef       = useRef(tasks)
  const settingsRef    = useRef(settings)
  const currentUserRef = useRef(currentUser)

  updateTaskRef.current  = updateTask
  tasksRef.current       = tasks
  settingsRef.current    = settings
  currentUserRef.current = currentUser

  // ── Service Worker setup ────────────────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/reminder-sw.js').catch(() => {})
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Keep SW alive — ping every 20 s so Chrome doesn't kill it ──────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const ping = () => {
      navigator.serviceWorker.ready
        .then(reg => { reg.active?.postMessage({ type: 'PING' }) })
        .catch(() => {})
    }
    const id = setInterval(ping, 20_000)
    ping() // ping immediately on mount
    return () => clearInterval(id)
  }, [])

  // ── Listen for CLEAR from SW (SW fired the notification, clear from DB) ─────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'CLEAR') {
        const { taskId } = event.data
        // Cancel main-thread timer (SW already handled it)
        if (scheduled.current.has(taskId)) {
          clearTimeout(scheduled.current.get(taskId)!)
          scheduled.current.delete(taskId)
        }
        updateTaskRef.current(taskId, { reminder: undefined })
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  // ── Fire a notification via SW showNotification (works even when Chrome is
  //    not the focused OS window — unlike new Notification() which doesn't). ──
  const notify = (taskId: string, title: string, body: string) => {
    if (Notification.permission !== 'granted') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(reg => reg.showNotification(title, {
          body,
          icon: '/bullseye.svg',
          badge: '/bullseye.svg',
          tag: `reminder-${taskId}`,   // same tag as SW — deduplicates if both fire
          data: { taskId },
          // actions is a SW-only property not in the TS lib types
          ...({ actions: [
            { action: 'open',    title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss'  },
          ] } as object),
        } as NotificationOptions))
        .catch(() => {
          try { new Notification(title, { body, icon: '/bullseye.svg' }) } catch {}
        })
    } else {
      try { new Notification(title, { body, icon: '/bullseye.svg' }) } catch {}
    }
  }

  // ── Schedule / reschedule exact-time timeouts + mirror to SW ───────────────
  useEffect(() => {
    if (!currentUser || !settings?.notifications) {
      scheduled.current.forEach(clearTimeout)
      scheduled.current.clear()
      return
    }

    const activeIds = new Set<string>()

    for (const task of tasks) {
      if (!task.reminder || task.status === 'done' || task.deletedAt) {
        if (scheduled.current.has(task.id)) {
          clearTimeout(scheduled.current.get(task.id)!)
          scheduled.current.delete(task.id)
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then(reg => { reg.active?.postMessage({ type: 'CANCEL', taskId: task.id }) })
            .catch(() => {})
        }
        continue
      }

      activeIds.add(task.id)

      if (scheduled.current.has(task.id)) {
        clearTimeout(scheduled.current.get(task.id)!)
        scheduled.current.delete(task.id)
      }

      const taskId    = task.id
      const taskTitle = task.title
      const taskDue   = task.dueDate
      const fireAt    = task.reminder
      const body      = taskDue
        ? 'Due: ' + new Date(taskDue).toLocaleString()
        : 'Reminder for your task'

      // Mirror to SW — SW fires if tab is frozen before main-thread timer fires
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(reg => {
            reg.active?.postMessage({ type: 'SCHEDULE', taskId, title: taskTitle, body, reminderTime: fireAt })
          })
          .catch(() => {})
      }

      const fire = () => {
        scheduled.current.delete(taskId)
        if (!settingsRef.current?.notifications) return

        // Cancel SW schedule — main thread won this race
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then(reg => { reg.active?.postMessage({ type: 'CANCEL', taskId }) })
            .catch(() => {})
        }

        notify(taskId, taskTitle, body)
        updateTaskRef.current(taskId, { reminder: undefined })
      }

      const ms = fireAt - Date.now()
      const id  = setTimeout(fire, Math.max(0, ms))
      scheduled.current.set(taskId, id)
    }

    // Cancel timers whose tasks no longer need them
    for (const [id, timerId] of scheduled.current.entries()) {
      if (!activeIds.has(id)) {
        clearTimeout(timerId)
        scheduled.current.delete(id)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then(reg => { reg.active?.postMessage({ type: 'CANCEL', taskId: id }) })
            .catch(() => {})
        }
      }
    }
  }, [tasks, settings?.notifications, currentUser])

  // ── Backup sweep every 15 seconds — catches throttled/frozen timers ─────────
  useEffect(() => {
    const sweep = () => {
      if (!currentUserRef.current || !settingsRef.current?.notifications) return
      if (Notification.permission !== 'granted') return

      const now = Date.now()
      for (const task of tasksRef.current) {
        if (
          task.reminder &&
          task.reminder <= now &&
          task.status !== 'done' &&
          !task.deletedAt &&
          !scheduled.current.has(task.id)
        ) {
          const body = task.dueDate
            ? 'Due: ' + new Date(task.dueDate).toLocaleString()
            : 'Reminder for your task'
          notify(task.id, task.title, body)
          updateTaskRef.current(task.id, { reminder: undefined })
        }
      }
    }

    const interval = setInterval(sweep, 15_000)
    return () => clearInterval(interval)
  }, [])

  // ── Immediate catch-up when the user switches back to this tab ──────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (!currentUser || !settings?.notifications) return
      if (Notification.permission !== 'granted') return

      const now = Date.now()
      for (const task of tasks) {
        if (
          task.reminder &&
          task.reminder <= now &&
          task.status !== 'done' &&
          !task.deletedAt &&
          !scheduled.current.has(task.id)
        ) {
          const body = task.dueDate
            ? 'Due: ' + new Date(task.dueDate).toLocaleString()
            : 'Reminder for your task'
          notify(task.id, task.title, body)
          updateTask(task.id, { reminder: undefined })
        }
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [tasks, settings?.notifications, currentUser, updateTask])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      scheduled.current.forEach(clearTimeout)
      scheduled.current.clear()
    }
  }, [])
}
