const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Configuração
  getConfig: () => ipcRenderer.invoke("get-config"),
  getEstado: () => ipcRenderer.invoke("get-estado"),
  getIP: () => ipcRenderer.invoke("get-ip"),
  getHostname: () => ipcRenderer.invoke("get-hostname"),

  // Configuração inicial
  selecionarPasta: () => ipcRenderer.invoke("selecionar-pasta"),
  iniciarServidor: () => ipcRenderer.invoke("iniciar-servidor"),
  resetar: () => ipcRenderer.invoke("resetar"),

  // Thumbnails
  gerarThumbs: () => ipcRenderer.invoke("gerar-thumbs"),
  apagarThumbs: () => ipcRenderer.invoke("apagar-thumbs"),
  onTotalVideos: (cb) =>
    ipcRenderer.on("thumb-total-videos", (_, data) => cb(data)),
  onTotal: (cb) => ipcRenderer.on("thumb-total", (_, data) => cb(data)),
  onProgresso: (cb) => ipcRenderer.on("thumb-progresso", (_, data) => cb(data)),
  abrirThumbs: () => ipcRenderer.invoke("abrir-thumbs"),

  // Info.json
  gerarInfo: () => ipcRenderer.invoke("gerar-info-json"),

  // Info for Pasta
  infoPasta: () => ipcRenderer.invoke("info-pasta"),
  onAlertInfo: (i) => ipcRenderer.on("alert-info", (_, data) => i(data)),
  // Banners e links
  abrirBanners: () => ipcRenderer.invoke("get-banners"),
  abrirLink: (url) => ipcRenderer.invoke("abrir-link", url),

  // Pedidos
  abrirPedidos: (tema) => ipcRenderer.invoke("abrir-pedidos", tema),
  getPedidos: () => ipcRenderer.invoke("get-pedidos"),
  apagarPedidos: () => ipcRenderer.invoke("apagar-pedidos"),
  atualizarPedido: (index, status) =>
    ipcRenderer.invoke("atualizar-pedido", { index, status }),

  // Sistema
  notificar: (titulo, desc) =>
    ipcRenderer.invoke("notificar", { titulo, desc }),
  alertCrash: (cb) => ipcRenderer.on("alert-crash", (_, data) => cb(data)),
  alertGeral: (cb) => ipcRenderer.on("alert-geral", (_, data) => cb(data)),
});
