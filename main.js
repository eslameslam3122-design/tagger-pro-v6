const { app, BrowserWindow, shell, session, protocol } = require('electron');
const path = require('path');

// Fix for "Network service crashed" in Electron 28+
app.commandLine.appendSwitch('disable-features', 'NetworkService');
app.commandLine.appendSwitch('enable-features', 'NetworkServiceInProcess');

let mainWindow;

// تسجيل بروتوكول custom لخدمة الملفات المحلية
app.whenReady().then(() => {
    protocol.registerFileProtocol('app', (request, callback) => {
        const filePath = path.join(__dirname, request.url.slice('app://'.length));
        callback({ path: filePath });
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'TAGGER PRO V6',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            sandbox: true
        },
        backgroundColor: '#060911',
        show: false
    });

    // السماح بالطلبات الخارجية (Supabase, APIs)
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: details.requestHeaders });
    });

    // فتح صفحة تسجيل الدخول
    mainWindow.loadFile('index.html');

    // ظهور تدريجي
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // فتح الروابط الخارجية في المتصفح
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // منع فتح DevTools للمستخدم العادي
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
        }
        if (input.key === 'F12') {
            event.preventDefault();
        }
    });

    // debugging: سجل أخطاء الشبكة
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('❌ Page load failed:', errorCode, errorDescription, validatedURL);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
