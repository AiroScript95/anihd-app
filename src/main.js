const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Notification,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");

// ─── Estado global ────────────────────────────────────────────────────────────
let mainWindow;
let janelaPedidos;
let janelaInfoJson;
let serverProcess;
let tray;
let forcarFecho = false;
let fechoIntesional = false;
let appConfigPath;
const gotTheLock = app.requestSingleInstanceLock();
// ─── Caminhos ─────────────────────────────────────────────────────────────────
const isDev = !app.isPackaged;
const serverPath = isDev
  ? path.join(__dirname, "../server")
  : path.join(process.resourcesPath, "app.asar.unpacked", "server");
const configPath = path.join(serverPath, "config.json");
const pedidosPath = path.join(serverPath, "/database/database.json");
const bannersPath = path.join(serverPath, "banners");
// ─── Utilitários ──────────────────────────────────────────────────────────────
function lerAppConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(appConfigPath, "utf-8"));
  } catch {
    return {};
  }
}
function guardarAppConfig(data) {
  fsSync.writeFileSync(appConfigPath, JSON.stringify(data, null, 2));
}
function lerConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}
function guardarConfig(config) {
  fsSync.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
function lerDatabaseJson() {
  try {
    return JSON.parse(fsSync.readFileSync(pedidosPath, "utf-8"));
  } catch {
    return null;
  }
}
function guardarDatabaseJson(config) {
  fsSync.writeFileSync(pedidosPath, JSON.stringify(config, null, 2));
}
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}
function validarConfig() {
  const config = lerConfig();
  if (config?.path && !fsSync.existsSync(config.path)) {
    console.log("Pasta configurada não existe mais, a limpar config...");
    guardarConfig({ titulo: "AniHD", path: null });
  }
}
async function apagarThumbs() {
  try {
    const thumbsPath = path.join(serverPath, "thumbs");
    await fs.rm(thumbsPath, { recursive: true, force: true });
    await fs.mkdir(thumbsPath, { recursive: true });
  } catch (erro) {
    console.error("Erro ao limpar thumbs:", erro);
  }
}
function pararServidor() {
  if (serverProcess) {
    fechoIntesional = true;
    serverProcess.kill();
    serverProcess = null;
  }
}
function getTamanhoPasta(dirPath) {
  let totalBytes = 0;
  const items = fsSync.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) totalBytes += getTamanhoPasta(fullPath);
    else totalBytes += fsSync.statSync(fullPath).size;
  }
  return totalBytes;
}
function contarItens(dirPath) {
  // Nível Raiz (ex: "videos/")
  const items = fsSync.readdirSync(dirPath, { withFileTypes: true });
  let pastas = 0,
    arquivos = 0;

  for (const item of items) {
    if (!item.isDirectory()) continue;

    // Se é diretório na raiz, é uma Pasta de Anime (Nível 1)
    pastas++;
    const nivel1Path = path.join(dirPath, item.name);
    const nivel1Items = fsSync.readdirSync(nivel1Path, { withFileTypes: true });

    for (const subItem of nivel1Items) {
      if (subItem.isDirectory()) {
        // Se achou outra pasta aqui dentro, é uma Season (Nível 2)
        pastas++;
        const nivel2Path = path.join(nivel1Path, subItem.name);
        const nivel2Files = fsSync.readdirSync(nivel2Path, {
          withFileTypes: true,
        });

        // Conta apenas os arquivos de vídeo válidos dentro da Season
        for (const file of nivel2Files) {
          if (
            file.isFile() &&
            (file.name.endsWith(".mp4") || file.name.endsWith(".mkv"))
          ) {
            arquivos++;
          }
        }
      } else if (
        subItem.isFile() &&
        (subItem.name.endsWith(".mp4") || subItem.name.endsWith(".mkv"))
      ) {
        // Arquivos de vídeo direto na raiz do anime (sem pasta de season)
        arquivos++;
      }
    }
  }

  return { pastas, arquivos };
}
function listarInfoJson() {
  let lista = [];
  const config = lerConfig();
  try {
    const item = fsSync.readdirSync(config.path, { withFileTypes: true });
    item.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    const pastas = item.filter((i) => i.isDirectory());
    for (const pasta of pastas) {
      const destino = path.join(config.path, pasta.name, "info.json");
      if (fsSync.existsSync(destino)) {
        lista.push(destino);
      }
    }
  } catch (error) {
    console.log(`erro: ${error.message}`);
  }
  return lista;
}
function openBanner(banners) {
  if (fsSync.existsSync(banners)) shell.openPath(banners);
}
// ─── Janelas ──────────────────────────────────────────────────────────────────
function criarJanela() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 800,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F12" ||
      (input.control && input.shift && input.key.toLowerCase() === "i")
    ) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F5" ||
      (input.control && input.key.toLowerCase() === "r")
    ) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);

  mainWindow.on("close", (e) => {
    if (!forcarFecho) {
      e.preventDefault();
      mainWindow.hide();
      avisarPrimeiraMinimizacao();
    }
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, "ui/views/index.html"));
}
function criarJanelaPedidos(tema) {
  janelaPedidos = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: true,
    fullscreenable: false,
    autoHideMenuBar: true,
    minimizable: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  janelaPedidos.once("ready-to-show", () => janelaPedidos.show());
  janelaPedidos.loadFile(path.join(__dirname, "ui/views/pedidos.html"), {
    query: { tema },
  });
}
function criarJanelaInfoJson(tema) {
  janelaInfoJson = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: true,
    fullscreenable: false,
    autoHideMenuBar: true,
    minimizable: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  janelaInfoJson.once("ready-to-show", () => janelaInfoJson.show());
  janelaInfoJson.loadFile(
    path.join(__dirname, "ui/views/lista_info_json.html"),
    {
      query: { tema },
    },
  );
}
// ─── Tray ─────────────────────────────────────────────────────────────────────
function criarTray() {
  tray = new Tray(path.join(__dirname, "ui/icons/favicon32.ico"));
  tray.setToolTip("AniHD");
  const menu = Menu.buildFromTemplate([
    { label: "Abrir", click: () => mainWindow.show() },
    {
      label: "Resetar Localização",
      click: () => {
        pararServidor();
        guardarConfig({ titulo: "AniHD", path: null });
        mainWindow.show();
        mainWindow.reload();
      },
    },
    {
      label: "Abrir Banners",
      click: () => openBanner(bannersPath),
    },
    {
      label: "Fechar",
      click: () => {
        fechoIntesional = true;
        forcarFecho = true;
        app.quit();
      },
    },
  ]);
  tray.on("click", () => mainWindow.show());
  tray.on("right-click", () => tray.popUpContextMenu(menu));
}
// ─── Servidor ─────────────────────────────────────────────────────────────────
function iniciarServidor() {
  pararServidor();
  const config = lerConfig();
  if (!config?.path || !fsSync.existsSync(config.path)) {
    console.log("Pasta de vídeos não configurada ou não existe.");
    return;
  }

  fechoIntesional = false;
  serverProcess = spawn(
    process.execPath,
    [path.join(serverPath, "server.js")],
    {
      cwd: serverPath,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", FORCE_COLOR: "1" },
      encoding: "utf8",
    },
  );
  serverProcess.on("close", (dados) => {
    if (!fechoIntesional && dados !== 0) {
      mainWindow.webContents.send(
        "alert-crash",
        `Servidor encerrou com erro: ${dados}`,
      );
    }
    fechoIntesional = false;
  });
}
function spawnarProcesso(ficheiro) {
  return spawn(process.execPath, [path.join(serverPath, ficheiro)], {
    cwd: serverPath,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", FORCE_COLOR: "1" },
    encoding: "utf8",
  });
}
function avisarPrimeiraMinimizacao() {
  const config = lerAppConfig();
  if (config && !config.avisoTrayMostrado) {
    new Notification({
      title: "AniHD",
      body: "O app continua a correr na bandeja. Clica no ícone para reabrir.",
      icon: path.join(__dirname, "ui/icons/favicon48.ico"),
    }).show();

    guardarAppConfig({ ...config, avisoTrayMostrado: true });
  }
}
// ─── IPC ──────────────────────────────────────────────────────────────────────

// Config
ipcMain.handle("get-config", () => lerConfig());
ipcMain.handle("get-estado", () => ({
  servidorAtivo: !!serverProcess && !serverProcess.killed,
}));
ipcMain.handle("get-ip", () => getLocalIP());
ipcMain.handle("get-hostname", () => os.hostname());
// Servidor
ipcMain.handle("iniciar-servidor", () => {
  iniciarServidor();
  return true;
});
ipcMain.handle("resetar", () => {
  pararServidor();
  guardarConfig({ titulo: "AniHD", path: null });
  mainWindow.reload();
});
// Thumbs
ipcMain.handle("gerar-thumbs", () => {
  return new Promise((resolve, reject) => {
    const proc = spawnarProcesso("gerar-thumbs.js");
    proc.stdout.on("data", (data) => {
      for (const linha of data.toString().split("\n")) {
        const l = linha.trim();
        if (!l) continue;
        if (l.startsWith("TOTAL_VIDEOS|")) {
          mainWindow.webContents.send("thumb-total-videos", l.split("|")[1]);
        } else if (l.startsWith("TOTAL|")) {
          mainWindow.webContents.send("thumb-total", l.split("|")[1]);
        } else if (l.startsWith("PROGRESSO|")) {
          const [, atual, ficheiro] = l.split("|");
          mainWindow.webContents.send("thumb-progresso", {
            atual,
            f: path.basename(ficheiro),
          });
        } else if (l.startsWith("ERRO|")) {
          mainWindow.webContents.send("alert-crash", l.split("|")[1]);
        }
      }
      process.stdout.write(data);
    });
    proc.stderr.on("data", (data) => process.stderr.write(data));
    proc.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Erro ao gerar thumbs: ${code}`));
    });
  });
});
ipcMain.handle("apagar-thumbs", async () => {
  await apagarThumbs();
  const texto = "As thumbnails foram apagadas";
  mainWindow.webContents.send("alert-geral", texto);
  return true;
});
// Info JSON
ipcMain.handle("gerar-info-json", () => {
  return new Promise((resolve, reject) => {
    const proc = spawnarProcesso("gerar-info.js");
    let buffer = "";
    proc.stdout.on("data", (data) => {
      buffer += data.toString();
      const linhas = buffer.split("\n");
      buffer = linhas.pop(); // guarda o resto incompleto pra próxima vez
      for (const linha of linhas) {
        const l = linha.trim();
        if (!l) continue;
        if (l.startsWith("ALERT-INFO|")) {
          janelaInfoJson.webContents.send(
            "alert-info",
            l.slice(l.indexOf("|") + 1),
          );
        }
      }
      process.stdout.write(data);
    });
    proc.stderr.on("data", (data) => process.stderr.write(data));
    proc.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Erro ao gerar info.json: ${code}`));
    });
  });
});
ipcMain.handle("listar-info-json", () => {
  return listarInfoJson().map((destino) => ({
    nome: path.basename(path.dirname(destino)), // nome do anime
    caminho: destino, // rota real, usada só internamente
  }));
});
ipcMain.handle("editar-info-json", (_, caminho) => {
  if (fsSync.existsSync(caminho)) {
    shell.openPath(caminho);
  }
});
ipcMain.handle("abrir-info-json", (_, tema) => {
  criarJanelaInfoJson(tema);
  return true;
});
ipcMain.handle("apagar-info-json", (_, caminho) => {
  if (fsSync.existsSync(caminho)) {
    fsSync.unlinkSync(caminho);
  }
});
// Banners e links
ipcMain.handle("get-banners", () => {
  openBanner(bannersPath);
});
ipcMain.handle("abrir-link", (_, url) => shell.openExternal(url));
// Pedidos
ipcMain.handle("abrir-pedidos", (_, tema) => {
  criarJanelaPedidos(tema);
  return true;
});
ipcMain.handle(
  "get-pedidos",
  () => lerDatabaseJson()?.pedidos ?? lerDatabaseJson() ?? [],
);
ipcMain.handle("atualizar-pedido", (_, { index, status }) => {
  const lista = lerDatabaseJson();
  if (lista && lista[index]) {
    lista[index].Status = status;
    guardarDatabaseJson(lista);
  }
  return true;
});
ipcMain.handle("apagar-pedidos", async () => {
  const pedidos = await lerDatabaseJson();
  if (pedidos.length === 0) {
    janelaPedidos.webContents.send(
      "alert-geral",
      "Nenhum pedido foi encontrado.",
    );
    return;
  }
  guardarDatabaseJson([]);
  janelaPedidos.webContents.send(
    "alert-geral",
    "Pedidos excluidos com sucesso",
  );
});
// Sistema
ipcMain.handle("selecionar-pasta", async () => {
  pararServidor();
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (!result.canceled) {
    const caminho = result.filePaths[0];
    if (!caminho || !fsSync.existsSync(caminho)) return null;
    guardarConfig({ titulo: "AniHD", path: caminho });
    return caminho;
    9;
  }
  return null;
});
ipcMain.handle("notificar", (_, { titulo, desc }) => {
  new Notification({
    title: titulo,
    body: desc,
    icon: path.join(__dirname, "ui/icons/favicon48.ico"),
  }).show();
});
ipcMain.handle("abrir-thumbs", () => {
  const thumbsPath = path.join(serverPath, "thumbs");
  if (fsSync.existsSync(thumbsPath)) shell.openPath(thumbsPath);
});
ipcMain.handle("info-pasta", () => {
  const pasta = lerConfig();
  if (!pasta?.path || !fsSync.existsSync(pasta.path)) {
    return null;
  }
  const bytes = getTamanhoPasta(pasta.path);
  const gb = (bytes / 1024 ** 3).toFixed(2);
  const { pastas, arquivos } = contarItens(pasta.path);
  return {
    name: path.basename(pasta.path),
    tamanho: gb + "GB",
    pasta: pastas,
    arquivo: arquivos,
  };
});
// ─── App ──────────────────────────────────────────────────────────────────────
Menu.setApplicationMenu(null);
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    appConfigPath = path.join(app.getPath("userData"), "app-config.json");
    app.setAppUserModelId("com.airoscript95.anihd");
    criarJanela();
    criarTray();
    validarConfig();
  });
}
