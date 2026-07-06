const iconSol = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`;
const iconLua = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
let filtroAtual = "todos";

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
async function apagarPedidos() {
  const texto =
    "Tens a certeza? <br> Todos os pedidos serão apagados permanentemente.";
  const ok = await confirmarHTML(texto);
  if (!ok) return;
  else await window.api.apagarPedidos();
  carregarPedidos();
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
function aplicarTema(tema) {
  if (tema === "dark") {
    document.body.classList.add("dark");
    document.getElementById("icon-tema").innerHTML = iconLua;
  } else {
    document.body.classList.remove("dark");
    document.getElementById("icon-tema").innerHTML = iconSol;
  }
}
function carregarTema() {
  const params = new URLSearchParams(window.location.search);
  const tema = params.get("tema") || localStorage.getItem("tema") || "light";
  aplicarTema(tema);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function getBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("aprovado")) return "badge-aprovado";
  if (s.includes("rejeitado")) return "badge-rejeitado";
  return "badge-analisando";
}

function filtrar(status, btn) {
  filtroAtual = status;
  document.querySelectorAll("#tab-bar button").forEach((b) => {
    b.classList.remove("active");
  });
  btn.classList.add("active");
  carregarPedidos();
}

async function carregarPedidos() {
  const lista = document.getElementById("lista");
  const contagem = document.getElementById("contagem");
  document.getElementById("btn-apagar").disabled = false;
  lista.innerHTML = "";

  const todosBrutos = await window.api.getPedidos();

  // Adiciona o índice original a cada item
  const todos = todosBrutos.map((p, index) => ({ ...p, idOriginal: index }));

  const pedidos = todos.filter((p) => {
    if (filtroAtual === "todos") return true;
    if (filtroAtual === "pendentes")
      return (
        !p.Status?.toLowerCase().includes("aprovado") &&
        !p.Status?.toLowerCase().includes("rejeitado")
      );
    if (filtroAtual === "aprovados")
      return p.Status?.toLowerCase().includes("aprovado");
    if (filtroAtual === "rejeitados")
      return p.Status?.toLowerCase().includes("rejeitado");
    return true;
  });

  if (pedidos.length === 0) {
    document.getElementById("btn-apagar").disabled = true;
    contagem.textContent = "Nenhum pedido";
    lista.innerHTML = /* html */ `
    <div class="empty">
    <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-clipboard-off">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5.575 5.597a2 2 0 0 0 -.575 1.403v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2m0 -4v-8a2 2 0 0 0 -2 -2h-2" />
    <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 1 1 0 4h-2" />
    <path d="M3 3l18 18" />
  </svg>
    <p>Nenhum pedido enconrtado</p>
    </div>`;
    return;
  }

  contagem.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""}`;

  pedidos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "pedido";
    const badgeClass = getBadgeClass(p.Status);
    const jaDecidido =
      p.Status?.toLowerCase().includes("aprovado") ||
      p.Status?.toLowerCase().includes("rejeitado");

    div.innerHTML = `
      <div class="pedido-info">
        <div class="pedido-anime">${escapeHTML(p.Anime) || "—"}</div>
        <div class="pedido-desc">${escapeHTML(p.Descricao) || "Sem descrição"}</div>
      </div>
      <span class="badge ${badgeClass}">${escapeHTML(p.Status) || "analisando"}</span>
      <div class="pedido-acoes">
        ${
          !jaDecidido
            ? `<button class="btn-aprovar" onclick="atualizarStatus(${p.idOriginal}, 'aprovado')">Aprovar</button>
               <button class="btn-rejeitar" onclick="atualizarStatus(${p.idOriginal}, 'rejeitado')">Rejeitar</button>`
            : `<button class="btn-secondary" onclick="atualizarStatus(${p.idOriginal}, 'analisando...')">Reconsiderar</button>`
        }
      </div>`;
    lista.appendChild(div);
  });
}

async function atualizarStatus(index, novoStatus) {
  await window.api.atualizarPedido(index, novoStatus);
  carregarPedidos();
}

carregarPedidos();
carregarTema();
