import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  clipboard,
  Menu,
  globalShortcut
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { loadIPCCameraPTZ } from './Cam'
import { loadIPCImageCache } from './ImageCache'

function createWindow() {
  const width = 400
  const mainWindow = new BrowserWindow({
    width,
    minWidth: width,
    minHeight: screen.getPrimaryDisplay().workAreaSize.height,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    x: screen.getPrimaryDisplay().workAreaSize.width - width,
    y: 0,
    show: false,
    autoHideMenuBar: false,
    darkTheme: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools({ mode: 'right' })
      }
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.platform !== 'win32' && process.platform !== 'linux') {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Arquivo',
        submenu: [{ role: 'quit', label: 'Fechar' }]
      },
      {
        label: 'Visualizar',
        submenu: [{ role: 'toggleDevTools', accelerator: 'CommandOrControl+Shift+I' }]
      }
    ])
    Menu.setApplicationMenu(menu)
  } else {
    mainWindow.removeMenu()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.setName('Transmission Control App')
app.disableHardwareAcceleration()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.gabrielrosas.transmission-control-app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  ipcMain.handle('clipboard:writeText', async (_, text: string) => {
    return clipboard.writeText(text)
  })

  loadIPCCameraPTZ(ipcMain)

  loadIPCImageCache(ipcMain, app)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
