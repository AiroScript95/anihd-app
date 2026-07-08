// ─── Ícones ────────────────────────────────────────────────────────────────
const iconSol = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`;
const iconLua = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
// ─── Estado global ────────────────────────────────────────────────────────
let _totalVideos = 0;
let _pendentes = 0;
// ─── Tema ───────────────────────────────────────────────────────────────────
function aplicarTema(tema) {
  if (tema === "dark") {
    document.body.classList.add("dark");
    document.getElementById("icon-tema").innerHTML = iconLua;
  } else {
    document.body.classList.remove("dark");
    document.getElementById("icon-tema").innerHTML = iconSol;
  }
}
function toggleTema() {
  const novoTema = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("tema", novoTema);
  aplicarTema(novoTema);
}
function carregarTema() {
  const params = new URLSearchParams(window.location.search);
  const tema = params.get("tema") || localStorage.getItem("tema") || "light";
  aplicarTema(tema);
}
// ─── Modais ───────────────────────────────────────────────────────────────
function abrirModal(id) {
  const mapOverlay = {
    modalBanners: "overlayBanners",
    modalHelp: "overlayHelp",
    modalInfo: "overlayInfo",
    modalMais: "overlayMais",
  };

  // fecha qualquer modal/overlay que esteja aberto
  document
    .querySelectorAll(".modal.active")
    .forEach((m) => m.classList.remove("active"));
  document
    .querySelectorAll(".overlay.active")
    .forEach((o) => o.classList.remove("active"));

  const overlay = mapOverlay[id];
  document.getElementById(id).classList.add("active");
  document.getElementById(overlay).classList.add("active");
}
function fecharModal(id, overlayId) {
  document.getElementById(id).classList.remove("active");
  document.getElementById(overlayId).classList.remove("active");
}
function mudarAba(index) {
  document.querySelectorAll(".help-tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === index);
  });
  document.querySelectorAll(".help-pane").forEach((pane, i) => {
    pane.classList.toggle("active", i === index);
  });
}
// ─── Alertas / Utilitários de UI ───────────────────────────────────────────
async function copiar(texto) {
  await navigator.clipboard.writeText(texto);
  const alertCopy = document.createElement("div");
  alertCopy.classList.add("alert", "alert-copy");
  alertCopy.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12l5 5l10 -10" />
  </svg>
  Copiado
`;
  document.body.appendChild(alertCopy);
  setTimeout(() => {
    alertCopy.classList.add("hide");
  }, 2000);
}
async function apagarThumbs() {
  const texto =
    "Tens a certeza? <br> As thumbnails vão ser apagadas e regeneradas na próxima vez.";
  const ok = await confirmarHTML(texto);
  if (!ok) return;
  else await window.api.apagarThumbs();
}
function confirmarHTML(mensagem) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = /* html */ `
      <div class="confirm-card">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 3c7.2 0 9 1.8 9 9c0 7.2 -1.8 9 -9 9c-7.2 0 -9 -1.8 -9 -9c0 -7.2 1.8 -9 9 -9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <p>${mensagem}</p>
        <div class="confirm-botoes">
          <button class="btn-cancelar btn-secondary">Cancelar</button>
          <button class="btn-confirmar btn-danger">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fechar = (resultado) => {
      overlay.classList.add("hide");
      setTimeout(() => {
        overlay.remove();
        resolve(resultado);
      }, 300);
    };

    overlay
      .querySelector(".btn-confirmar")
      .addEventListener("click", () => fechar(true));
    overlay
      .querySelector(".btn-cancelar")
      .addEventListener("click", () => fechar(false));
  });
}
async function resetar() {
  const texto =
    "Tens a certeza? <br> A pasta configurada será removida e terás de selecioná-la novamente.";
  const ok = await confirmarHTML(texto);
  if (!ok) return;
  else await window.api.resetar();
}
function loading() {
  return new Promise((resolve) => {
    const load = document.getElementById("loading-screen");
    const progress = document.getElementById("progress-fill");
    let index = 0;

    const interval = setInterval(() => {
      index++;
      progress.style.width = `${index}%`;
      if (index >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          load.classList.add("hide");
          resolve();
        }, 100);
      }
    }, 20);
  });
}
function setProgresso(pct) {
  const fill = document.getElementById("fill");
  fill.style.transition = "stroke-dashoffset 0.3s ease";
  fill.style.strokeDashoffset = 56.5 - (pct / 100) * 56.5;
}
// ─── Info da pasta ──────────────────────────────────────────────────────────
async function criarInfoPasta(info) {
  if (!info) return;

  document.getElementById("nome").innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-label">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16.52 7h-10.52a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h10.52a1 1 0 0 0 .78 -.375l3.7 -4.625l-3.7 -4.625a1 1 0 0 0 -.78 -.375" />
    </svg>
    <span>Caminho: ${info.name}</span>
  `;

  document.getElementById("tamanho").innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-database">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 6a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" />
      <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </svg>
    <span>Tamanho total: ${info.tamanho}</span>
  `;

  document.getElementById("pasta").innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-folders">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 3h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
      <path d="M17 16v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h2" />
    </svg>
    <span>Subpastas: ${info.pasta}</span>
  `;

  document.getElementById("arquivo").innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-files">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 3v4a1 1 0 0 0 1 1h4" />
      <path d="M18 17h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h4l5 5v7a2 2 0 0 1 -2 2" />
      <path d="M16 17v2a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2" />
    </svg>
    <span>Arquivos: ${info.arquivo}</span>
  `;
}
// ─── Fluxo de inicialização / arranque do servidor ─────────────────────────
async function init() {
  await loading();
  document.getElementById("btn-banners").disabled = true;
  document.getElementById("btn-reset").disabled = true;
  document.getElementById("btn-pedidos").disabled = true;
  document.getElementById("btn-info-json").disabled = true;
  const config = await window.api.getConfig();
  await new Promise((r) => setTimeout(r, 600));
  if (config && config.path) {
    const estado = await window.api.getEstado(); // novo handler que criamos no main
    if (estado.servidorAtivo) {
      const ip = await window.api.getIP();
      const hostname = await window.api.getHostname();
      document.getElementById("btn-banners").disabled = false;
      document.getElementById("btn-reset").disabled = false;
      document.getElementById("btn-pedidos").disabled = false;
      document.getElementById("btn-info-json").disabled = false;
      document.getElementById("setup").style.display = "none";
      document.getElementById("loading").style.display = "none";
      document.getElementById("main").style.display = "flex";
      // preenche as URLs igual ao arrancar()
      const urlLocal = document.getElementById("url-local");
      const urlRede = document.getElementById("url-rede");
      const urlHostname = document.getElementById("hostname-rede");
      urlLocal.dataset.url = `http://localhost:5000`;
      urlLocal.querySelector("span").textContent = `http://localhost:5000`;
      urlRede.dataset.url = `http://${ip}:5000`;
      urlRede.querySelector(".url-inner span").textContent =
        `http://${ip}:5000`;
      urlHostname.dataset.url = `http://${hostname}:5000`;
      urlHostname.querySelector(".url-inner span").textContent =
        `http://${hostname}:5000`;
      document.getElementById("caminho").textContent = config.path;
    } else {
      await arrancar(config.path);
    }
  }
}
async function arrancar(caminho) {
  const info = await window.api.infoPasta();
  await criarInfoPasta(info);
  document.getElementById("setup").style.display = "none";
  document.getElementById("loading-msg").textContent =
    "A carregar a biblioteca...";
  document.getElementById("loading").classList.add("active");
  await window.api.gerarThumbs();
  if (_pendentes && Number(_pendentes) > 0) {
    await window.api.notificar(
      "Thumbnails Concluídas!",
      "A iniciar o servidor...",
    );
  }
  document.getElementById("btn-banners").disabled = false;
  document.getElementById("btn-pedidos").disabled = false;
  document.getElementById("btn-info-json").disabled = false;
  document.getElementById("btn-reset").disabled = false;
  document.getElementById("loading-msg").textContent = "Ohayo, Senpai!";
  await window.api.iniciarServidor();
  const ip = await window.api.getIP();
  const hostname = await window.api.getHostname();
  document.getElementById("loading").classList.remove("active");
  document.getElementById("main").style.display = "flex";
  const urlLocal = document.getElementById("url-local");
  const urlRede = document.getElementById("url-rede");
  const urlHostname = document.getElementById("hostname-rede");
  urlLocal.dataset.url = `http://localhost:5000`;
  urlLocal.querySelector("span").textContent = `http://localhost:5000`;

  urlRede.dataset.url = `http://${ip}:5000`;
  urlRede.querySelector(".url-inner span").textContent = `http://${ip}:5000`;

  urlHostname.dataset.url = `http://${hostname}:5000`;
  urlHostname.querySelector(".url-inner span").textContent =
    `http://${hostname}:5000`;
  document.getElementById("caminho").textContent = caminho;
}
async function selecionar() {
  const caminho = await window.api.selecionarPasta();
  if (caminho) await arrancar(caminho);
}
async function redefinir() {
  const texto =
    "Tens a certeza? <br> O servidor sera reiniciado e perdera o acesso as suas thumbnails";
  const ok = await confirmarHTML(texto);
  if (!ok) return;
  const caminho = await window.api.selecionarPasta();
  if (caminho) {
    document.getElementById("main").style.display = "none";
    document.getElementById("setup").style.display = "none";
    document.getElementById("loading").classList.add("active");
    document.getElementById("loading-msg").textContent =
      "A gerar thumbnails...";
    window.api.notificar(
      "Gerando Thumbnails!",
      "As thumbs de cada ficheiro estão a ser geradas. Aguarde a conclusão.",
    );
    await arrancar(caminho);
  }
}
// ─── Listeners IPC (eventos vindos do main) ────────────────────────────────
window.api.alertCrash((codigo) => {
  const alert = document.createElement("div");
  alert.classList.add("alert", "alert-crash");
  alert.innerHTML = /* html */ `
  <div class="alert-card">
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-alert-square-rounded">
	  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
	  <path d="M12 3c7.2 0 9 1.8 9 9c0 7.2 -1.8 9 -9 9c-7.2 0 -9 -1.8 -9 -9c0 -7.2 1.8 -9 9 -9" />
	  <path d="M12 8v4" />
	  <path d="M12 16h.01" />
   </svg>
   <span>Warning</span>
   <p>${codigo}</p>
  </div>
  `;
  window.api.notificar(
    "Erro no servidor",
    "O servidor encontrou um problema e será reiniciado.",
  );
  document.body.appendChild(alert);
  setTimeout(() => {
    alert.querySelector(".alert-card").classList.add("hide");
    setTimeout(() => window.api.resetar(), 300); // ← reset após a animação
  }, 4000);
});
window.api.alertGeral((info) => {
  const alert = document.createElement("div");
  alert.classList.add("alert", "alert-geral");
  alert.innerHTML = /* html */ `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M5 12l5 5l10 -10" />
</svg>
<span>${info}</span>
  `;
  document.body.appendChild(alert);
  setTimeout(() => {
    alert.classList.add("hide");
  }, 2000);
});
window.api.onTotalVideos((val) => {
  _totalVideos = val.trim();
});
window.api.onTotal((val) => {
  _pendentes = val.trim();
});


window.api.onProgresso(({ atual, f }) => {
  const pct = ((atual / _totalVideos) * 100).toFixed(0);
  document.getElementById("btn-reset").disabled = true;
  document.getElementById("percentagem").innerText = `${pct}%`;
  document.getElementById("progresso-atual").innerHTML = /* html */ `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-photo">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 8h.01" />
      <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" />
      <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
      <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
      </svg>
      <span>${f.replace(/\.webp$/, "")}</span>
  `;
  setProgresso(pct);
});
// ─── Boot ───────────────────────────────────────────────────────────────────
carregarTema();
init();
