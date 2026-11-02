const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  const ventana = new BrowserWindow({
    width: 460,
    height: 400,
    alwaysOnTop: true,
  });
  ventana.loadFile("index.html");
});