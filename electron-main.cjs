const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'SIRTOY LENDING PLUS — Offline Desktop System',
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
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

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
        message: `May bagong bersyon (${info.version}) ng SIRTOY Lending Plus na na-download na.`,
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
