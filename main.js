const { app, BrowserWindow } = require('electron')
const { exec } = require("node:child_process")
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080
    });
    // const cmd = `java -jar lib/Java4UI.jar`;
    const cmd = `java -cp ./lib/Java4UI.jar src/Main.java`;
    const child = exec(cmd);
    child.on("exit", (code, signal) => {
        console.log(`Exited child process with code: ${code}, signal: ${signal}`);
    });
    child.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    })
    win.maximize();
    win.loadFile("./user-interface/pages/index.html");
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(() => {
    createWindow();
});