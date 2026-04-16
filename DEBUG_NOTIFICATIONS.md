# Debug Notification System

Open your GO app and press **F12** to open Chrome DevTools Console.

## Step 1: Check Notification Permission

Run this in the console:
```javascript
console.log('Notification permission:', Notification.permission)
```

**Expected:** `"granted"`
**If you see:** `"denied"` or `"default"` → Notifications are blocked!

**Fix:**
- Click the lock icon 🔒 in the address bar
- Find "Notifications" → Set to "Allow"
- Refresh the page


## Step 2: Check Service Worker

Run this:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs)
  if (regs.length === 0) console.error('❌ No service worker registered!')
  else console.log('✅ Service worker registered')
})
```

**Expected:** Should show at least 1 registration
**If empty:** Service worker failed to register


## Step 3: Check Settings Store

Run this:
```javascript
// Get settings from IndexedDB
(async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('go-db', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const tx = db.transaction('settings', 'readonly')
  const store = tx.objectStore('settings')
  const allSettings = await new Promise(resolve => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
  })

  console.log('Settings in DB:', allSettings)

  if (allSettings.length > 0) {
    const userSettings = allSettings[0]
    console.log('Notifications enabled:', userSettings.notifications)
    console.log('Re-ring minutes:', userSettings.reRingMinutes)
  }
})()
```

**Expected:** `notifications: true`
**If false:** Go to Settings page and toggle "Enable Notifications" ON


## Step 4: Check Tasks with Reminders

Run this:
```javascript
(async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('go-db', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  const tx = db.transaction('tasks', 'readonly')
  const store = tx.objectStore('tasks')
  const allTasks = await new Promise(resolve => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
  })

  const tasksWithReminders = allTasks.filter(t => t.reminder && t.status !== 'done' && !t.deletedAt)

  console.log('Tasks with active reminders:', tasksWithReminders.length)

  tasksWithReminders.forEach(task => {
    const reminderDate = new Date(task.reminder)
    const isPast = task.reminder < Date.now()
    console.log(`
Task: ${task.title}
Reminder: ${reminderDate.toLocaleString()}
Is Past: ${isPast ? '✅ YES (should fire)' : '❌ NO (future)'}
Status: ${task.status}
    `)
  })
})()
```

This will show if you have any tasks with reminders set, and if they're in the past (should fire) or future.


## Step 5: Force a Notification Test

Run this to manually trigger a notification:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test Notification', {
    body: 'If you see this, notifications are working!',
    icon: '/bullseye.svg',
    tag: 'test-notification',
    actions: [
      { action: 'ok', title: 'OK' }
    ]
  })
})
```

**Expected:** A notification popup should appear in the bottom-right corner
**If nothing appears:** Notification permission is still blocked


## Common Issues:

1. **Permission denied** → Click lock icon, set Notifications to "Allow", refresh
2. **Settings toggle OFF** → Go to Settings page, turn on "Enable Notifications"
3. **No tasks with reminders** → Create a task, click the clock icon, set a reminder for 1 minute from now
4. **Reminder time is in the future** → Wait until the reminder time passes

---

After running all steps, paste the console output here so I can see what's wrong!
