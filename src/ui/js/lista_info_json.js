const listaInfo = await window.api.listarInfoJson();
const iconSol = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`;
const iconLua = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
const search = document.getElementById("input-search");
search.addEventListener("input", (e) => {
  const name = e.target.value.toLowerCase();
  const filtrados = listaInfo.filter((item) =>
    item.nome.toLowerCase().includes(name),
  );
  carregarListaInfoJson(filtrados);
});
document.getElementById("btn-add-info").addEventListener("click", () => {
  gerarInfoJson();
});
document.getElementById("btn-reload").addEventListener("click", async () => {
  carregarListaInfoJson(await window.api.listarInfoJson());
});
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
async function gerarInfoJson() {
  document.getElementById("btn-add-info").disabled = true;
  const alert = document.createElement("div");
  alert.classList.add("alert", "alert-info");
  alert.innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-file-info">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
      <path d="M11 14h1v4h1" />
      <path d="M12 11h.01" />
  </svg>
    <span>Gerando Info.js</span>
    `;
  document.body.appendChild(alert);
  await window.api.gerarInfo();
  setTimeout(() => {
    alert.classList.add("hide"); // ← animação de saída
  }, 1000);
}
window.api.onAlertInfoJson(async (i) => {
  const alert = document.createElement("div");
  alert.classList.add("alert", "alert-info-json");
  alert.innerHTML = /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-file-info">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
      <path d="M11 14h1v4h1" />
      <path d="M12 11h.01" />
  </svg>
  <span>${i}</span>
    `;

  carregarListaInfoJson(await window.api.listarInfoJson());
  document.body.appendChild(alert);
  setTimeout(() => {
    alert.classList.add("hide");
  }, 1500);
});
async function carregarListaInfoJson(lista) {
  document.getElementById("btn-add-info").disabled = false;
  const listaInfoJson = document.getElementById("lista");
  const contagem = document.getElementById("contagem");
  listaInfoJson.innerHTML = "";
  if (lista.length === 0) {
    contagem.textContent = "Nenhum anime";
    listaInfoJson.innerHTML = /* html */ `
    <div class="empty">
    <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-file-off">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 3l18 18" />
    <path d="M7 3h7l5 5v7m0 4a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-14" />
  </svg>
    <p>Nenhum anime com info.json encontrado</p>
    </div>`;
    return
  }
  let i = 0;

  contagem.textContent = `${lista.length} anime${lista.length !== 1 ? "s" : ""}`;
  lista.forEach((item) => {
    i++;
    const el = document.createElement("div");
    el.classList.add("item-anime");
    el.innerHTML = /* html */ `
        <span class="number-anime">${i}</span>
        <span class="name-anime">${item.nome}</span>
        <button class="btn-secondary btn-editar" data-caminho="${item.caminho}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-edit">
	    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
	    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
	    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
	    <path d="M16 5l3 3" />
        </svg>
        Editar
        </button>
        <button class="btn-danger btn-apagar" data-caminho="${item.caminho}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash">
	    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
	    <path d="M4 7l16 0" />
	    <path d="M10 11l0 6" />
	    <path d="M14 11l0 6" />
	    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
	    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
        Apagar
        </button>
      `;
    el.querySelector(".btn-editar").addEventListener("click", () => {
      window.api.editarInfoJson(item.caminho);
    });
    el.querySelector(".btn-apagar").addEventListener("click", async () => {
      window.api.apagarInfoJson(item.caminho);
      carregarListaInfoJson(await window.api.listarInfoJson()); // recarrega a lista
    });
    listaInfoJson.appendChild(el);
  });
}
carregarListaInfoJson(listaInfo);
carregarTema();
