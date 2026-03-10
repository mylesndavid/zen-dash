const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getLinearTasks: (apiKey) => ipcRenderer.invoke('get-linear-tasks', apiKey),
  updateLinearTask: (apiKey, taskId, updates) => ipcRenderer.invoke('update-linear-task', apiKey, taskId, updates),
  getLinearMe: (apiKey) => ipcRenderer.invoke('get-linear-me', apiKey),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  runClaudeCode: (prompt) => ipcRenderer.invoke('run-claude-code', prompt),
  updateTray: (text) => ipcRenderer.send('update-tray', text),
  updateTrayData: (data) => ipcRenderer.send('update-tray-data', data),
})
