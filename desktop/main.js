const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f1016',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Hide the default application menu
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Load the Vite React development server URL
  const devUrl = 'http://localhost:5182';
  mainWindow.loadURL(devUrl);

  // Show window when page is fully rendered
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open DevTools if desired (optional)
    // mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
