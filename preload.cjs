const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getLinearTasks: (apiKey) => ipcRenderer.invoke('get-linear-tasks', apiKey),
  updateLinearTask: (apiKey, taskId, updates) => ipcRenderer.invoke('update-linear-task', apiKey, taskId, updates),
  getLinearMe: (apiKey) => ipcRenderer.invoke('get-linear-me', apiKey),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
