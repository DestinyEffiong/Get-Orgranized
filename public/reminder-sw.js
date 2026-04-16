// Service Worker — schedules and fires reminder notifications.
// Uses event.waitUntil on every SCHEDULE so Chrome cannot kill the SW
// before the timer fires — no dependency on the page tab staying alive.

const pending = new Map() // taskId -> { timerId, resolve }
const fired   = new Set()

self.addEventListener('message', (event) => {
  const msg = event.data
  if (!msg) return

  // ── PING — extra keepalive from the tab (belt-and-suspenders) ─────────────
  if (msg.type === 'PING') {
    event.waitUntil(new Promise(resolve => setTimeout(resolve, 25_000)))
    return
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────────
  if (msg.type === 'SCHEDULE') {
    const { taskId, title, body, reminderTime } = msg

    // User explicitly set a new reminder — clear previous fired state so it
    // can fire again (fired only prevents duplicate fires within one session)
    fired.delete(taskId)

    // Cancel any existing timer for this task
    if (pending.has(taskId)) {
      const { timerId, resolve } = pending.get(taskId)
      clearTimeout(timerId)
      resolve()
      pending.delete(taskId)
    }

    const ms = reminderTime - Date.now()

    const doFire = (resolve) => {
      pending.delete(taskId)
      fired.add(taskId)
      self.registration.showNotification(title, {
        body,
        icon: '/bullseye.svg',
        badge: '/bullseye.svg',
        tag: `reminder-${taskId}`,
        data: { taskId },
        actions: [
          { action: 'open',    title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss'  },
        ],
      })
      broadcast({ type: 'CLEAR', taskId })
      resolve()
    }

    if (ms <= 0) {
      // Already past due — fire immediately via a short-lived waitUntil
      event.waitUntil(new Promise(resolve => doFire(resolve)))
    } else {
      // Hold waitUntil open until the timer fires.
      // Chrome keeps the SW alive for the duration of this promise.
      event.waitUntil(new Promise(resolve => {
        const timerId = setTimeout(() => doFire(resolve), ms)
        pending.set(taskId, { timerId, resolve })
      }))
    }
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────
  if (msg.type === 'CANCEL') {
    if (pending.has(msg.taskId)) {
      const { timerId, resolve } = pending.get(msg.taskId)
      clearTimeout(timerId)
      pending.delete(msg.taskId)
      resolve() // let Chrome know the waitUntil is done
    }
    fired.delete(msg.taskId)
  }
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const taskId = event.notification.data?.taskId
  event.notification.close()
  // Whenever the user interacts with the notification, clear fired so the
  // same task can be reminded again after editing
  if (taskId) fired.delete(taskId)
  if (event.action === 'dismiss') return
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if ('focus' in c) return c.focus()
        }
        return self.clients.openWindow('/')
      })
  )
})

// ── Notification close (X button / auto-dismiss / swipe away) ─────────────────
self.addEventListener('notificationclose', (event) => {
  const taskId = event.notification.data?.taskId
  if (taskId) fired.delete(taskId)
})

function broadcast(msg) {
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) =>
    clients.forEach((c) => c.postMessage(msg))
  )
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
