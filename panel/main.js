const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  const ventana = new BrowserWindow({
    width: 360,
    height: 240,
    alwaysOnTop: true,
  });
  ventana.loadFile("index.html");
});