const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveModelData: (data) => ipcRenderer.invoke('save-model-data', data),
    loadModelData: () => ipcRenderer.invoke('load-model-data')
}); 