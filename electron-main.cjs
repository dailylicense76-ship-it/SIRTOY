const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Loan Management System — Offline Desktop Edition',
    icon: path.join(__dirname, 'public', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: false,
    backgroundColor: '#0f172a',
    show: false,
  });

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

  // Allow F12 or Ctrl+Shift+I for DevTools inspection
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();

    // Check for updates automatically in background if connected to internet
    checkForAutoUpdates();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function checkForAutoUpdates() {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-downloaded', (info) => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'May Bagong Update!',
        message: `May bagong bersyon (${info.version}) ng Loan Management System na na-download na.`,
        detail: 'I-restart ang application ngayon para magamit ang pinakabagong update.',
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
    autoUpdater.checkForUpdatesAndNotify().catch(() => {
      // Offline or release not reachable - gracefully ignore
    });
  } catch (err) {
    // electron-updater optional in dev mode
  }
}

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
