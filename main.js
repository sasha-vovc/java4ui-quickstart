const { app, BrowserWindow } = require('electron');
const { spawn ,exec } = require("node:child_process");

let java;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080
    });
    // const cmd = `java -jar lib/Java4UI.jar`;
    const cmd = `java -cp "lib/Java4UI.jar;*output dir here/jar*" src/Main.java`;
    java = exec(cmd);
    java.on("exit", (code, signal) => {
        console.log(`Exited child process with code: ${code}, signal: ${signal}`);
    });
    java.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    })
    java.on("error", (error) => {
        console.log(`error caused by: ${error.cause}, message: ${error.message}`)
    })
    win.maximize();
    win.loadFile("./user-interface/pages/index.html");
}

app.on('window-all-closed', () => {
    exec("taskkill /f /im jqs.exe");
    exec("taskkill /f /im javaw.exe");
    exec("taskkill /f /im java.exe");
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(() => {
    createWindow();
});