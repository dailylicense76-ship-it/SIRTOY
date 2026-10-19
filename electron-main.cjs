const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');

// Completely disable top application menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Loan Management System — Offline Desktop Edition',
    icon: path.join(__dirname, 'public', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: false // Completely disabled to protect application source code
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    show: false,
  });

  // Explicitly remove menu visibility
  mainWindow.setMenuBarVisibility(false);

  // Load the compiled Vite single-page application
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('Failed to load application index:', err);
    dialog.showErrorBox(
      'System Load Error',
      'Hindi ma-load ang Loan Management System assets. Siguraduhing kumpleto ang pagkakagawa ng dist folder.'
    );
  });

  // Handle load failure event gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Load failed:', errorCode, errorDescription, validatedURL);
  });

  // Strictly block F12, DevTools, View Source, and Inspect shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = (input.key || '').toLowerCase();
    if (
      input.key === 'F12' ||
      (input.control && input.shift && (key === 'i' || key === 'j' || key === 'c')) ||
      (input.control && (key === 'u' || key === 'r'))
    ) {
      event.preventDefault();
    }
  });

  // Block right-click context menu (prevents Inspect Element menu)
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();

    // Check for updates automatically in background if connected to internet
    checkForAutoUpdates(false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkForAutoUpdates(manual = false) {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.removeAllListeners();

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      if (manual && mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'May Bagong Update!',
          message: `May nakitang bagong bersyon (${info.version}).`,
          detail: 'Sisimulan na ang pag-download sa background...',
          buttons: ['OK']
        });
      }
    });

    autoUpdater.on('update-not-available', () => {
      if (manual && mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Pinakabagong Bersyon',
          message: 'Nasa pinakabagong bersyon ka na ng Loan Management System.',
          buttons: ['OK']
        });
      }
    });

    autoUpdater.on('error', (err) => {
      console.warn('AutoUpdater notice:', err && err.message ? err.message : err);
      if (manual && mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Update Check',
          message: 'Hindi ma-check ang update sa ngayon. Pakisuri ang iyong koneksyon sa internet.',
          buttons: ['OK']
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'May Bagong Update!',
        message: `May bagong bersyon (${info.version}) ng Loan Management System na na-download na.`,
        detail: 'I-restart ang application ngayon para magamit ang pinakabagong update. Walang mabuburang data o records.',
        buttons: ['I-restart Ngayon', 'Mamaya'],
        defaultId: 0,
        cancelId: 1
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    // Silently check without showing errors if offline
    autoUpdater.checkForUpdates().catch(() => {});
  } catch {
    // electron-updater optional in dev mode
  }
}

// IPC listener for manual check from Settings or Developer page
ipcMain.handle('app:check-for-updates', async () => {
  checkForAutoUpdates(true);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
