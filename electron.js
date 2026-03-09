import { app, BrowserWindow, ipcMain, Notification, shell, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getLinearTasks, updateLinearTask, getLinearMe } from './src/main/linear.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let tray = null
let trayData = { timer: '', task: '', tasks: [] }

function updateTrayMenu() {
  if (!tray) return
  const items = []

  if (trayData.timer) {
    items.push({ label: `${trayData.timer}`, enabled: false })
  }
  if (trayData.task) {
    items.push({ label: trayData.task, enabled: false })
  }
  if (trayData.tasks.length > 0) {
    items.push({ type: 'separator' })
    items.push({ label: 'Open Tasks', enabled: false })
    trayData.tasks.forEach(t => {
      items.push({ label: `  ${t}`, enabled: false })
    })
  }
  items.push({ type: 'separator' })
  items.push({ label: 'Show Zen Dash', click: () => { mainWindow?.show(); mainWindow?.focus() } })
  items.push({ label: 'Quit', click: () => app.quit() })

  tray.setContextMenu(Menu.buildFromTemplate(items))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0E0E0C',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174')
  } else {
    mainWindow.loadFile(join(__dirname, 'dist', 'index.html'))
  }
}

// Required for notifications on macOS
if (process.platform === 'darwin') {
  app.setAppUserModelId('com.zendash.app')
}

app.whenReady().then(() => {
  createWindow()

  const icon = nativeImage.createFromPath(join(__dirname, 'trayTemplate@2x.png'))
  icon.setTemplateImage(true)
  tray = new Tray(icon)
  tray.setTitle('')
  updateTrayMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('get-linear-tasks', async (event, apiKey) => {
  try {
    return await getLinearTasks(apiKey)
  } catch (error) {
    console.error('Error fetching Linear tasks:', error)
    throw error
  }
})

ipcMain.handle('update-linear-task', async (event, apiKey, taskId, updates) => {
  try {
    return await updateLinearTask(apiKey, taskId, updates)
  } catch (error) {
    console.error('Error updating Linear task:', error)
    throw error
  }
})

ipcMain.handle('get-linear-me', async (event, apiKey) => {
  try {
    return await getLinearMe(apiKey)
  } catch (error) {
    console.error('Error fetching Linear user:', error)
    throw error
  }
})

ipcMain.handle('show-notification', async (event, title, body) => {
  const notif = new Notification({ title, body })
  notif.show()
  return { success: true }
})

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url)
  return { success: true }
})

ipcMain.on('update-tray', (event, text) => {
  if (tray) {
    console.log('[TRAY]', JSON.stringify(text))
    tray.setTitle(text || '', { fontType: 'monospacedDigit' })
  }
})

ipcMain.on('update-tray-data', (event, data) => {
  trayData = { ...trayData, ...data }
  updateTrayMenu()
})
