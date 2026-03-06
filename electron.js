import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getLinearTasks, updateLinearTask, getLinearMe } from './src/main/linear.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow

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

  // In dev, load from Vite. In production, load built files.
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174')
  } else {
    mainWindow.loadFile(join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
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
  new Notification({ title, body }).show()
  return { success: true }
})

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url)
  return { success: true }
})
