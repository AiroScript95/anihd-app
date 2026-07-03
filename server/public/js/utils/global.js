const path = window.location.pathname;
const partes = path.split("/").filter(Boolean);
const nomeRota = partes[0] || "/";
const cabecalho = document.querySelector("header");
const footer = document.querySelector("footer");
const overlay = document.getElementById("termos-overlay");
const lista = document.getElementById("termos-lista");
let title = {};
const listaRotas = {
  catalog: "Catalogo",
  releases: "Lancamentos",
  search: "Pesquisa",
  "/": "Home",
};

fetch("/videos")
  .then((r) => r.json())
  .then((stats) => {
    const animes = new Set(stats.videos.map((v) => `${v.anime}|||${v.season}`));
    const numAnimes = document.querySelector("#statAnimes .hero-stat-num");
    const numEps = document.querySelector("#statEps .hero-stat-num");
    if (numAnimes) numAnimes.textContent = animes.size;
    if (numEps) numEps.textContent = stats.total;
  })
  .catch(() => {});

fetch("/api/config")
  .then((r) => r.json())
  .then((config) => {
    title = config;
    const prefixo = getTituloRota();
    document.title = prefixo ? `${prefixo} · ${title.titulo}` : title.titulo;
    header(cabecalho);
    footerInfo(footer);
    activeTag(nomeRota);
  });

function getTituloRota() {
  switch (nomeRota) {
    case "catalog":
      return "Catálogo";
    case "releases":
      return "Lançamentos";
    case "search":
      return "Pesquisa";
    case "requests":
      return "Pedidos";
    case "anime":
      return decodeURIComponent(partes[partes.length - 1]);
    default:
      return null; // home não precisa de prefixo
  }
}

function activeTag(nomeRota) {
  // 1. Identifica qual o nome da rota (trata a home como '/' ou vazia)
  const rotaAtual =
    nomeRota === "/" || !nomeRota ? "Home" : listaRotas[nomeRota];

  // 2. Seleciona todas as labels dos seus links
  const tags = document.querySelectorAll(".nav-icon-link");

  tags.forEach((tag) => {
    // 3. Compara o texto da tag com a nossa rotaAtual
    // Usamos trim() para garantir que espaços extras não quebrem a comparação
    if (tag.innerText.trim() === rotaAtual) {
      tag.classList.add("active"); // Adiciona no link (a1, a2...)
    } else {
      tag.classList.remove("active");
    }
  });
}
async function header(header) {
  if (header) {
    const h2 = document.createElement("h2");
    h2.innerText = title.titulo;
    const small = document.createElement("small");
    small.innerText = "Animes na melhor resolução";
    const div = document.createElement("div");
    div.classList.add("title");
    div.appendChild(h2);
    div.appendChild(small);
    div.onclick = () => {
      window.location.href = "/";
    };

    const a1 = document.createElement("a");
    a1.href = "/";
    a1.classList.add("nav-icon-link");
    a1.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-smart-home">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M19 8.71l-5.333 -4.148a2.666 2.666 0 0 0 -3.274 0l-5.334 4.148a2.665 2.665 0 0 0 -1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-7.2c0 -.823 -.38 -1.6 -1.03 -2.105" />
    <path d="M16 15c-2.21 1.333 -5.792 1.333 -8 0" />
  </svg>
    <span class="nav-label">Home</span>`;

    const a2 = document.createElement("a");
    a2.href = "/catalog";
    a2.classList.add("nav-icon-link");
    a2.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-device-tv">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9" />
    <path d="M16 3l-4 4l-4 -4" />
  </svg>
    <span class="nav-label">Catalogo</span>`;

    const a3 = document.createElement("a");
    a3.href = "/releases";
    a3.classList.add("nav-icon-link");
    a3.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bookmark">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4" />
  </svg>
    <span class="nav-label">Lancamentos</span>`;

    const a4 = document.createElement("a");
    a4.href = "/search";
    a4.classList.add("nav-icon-link");
    a4.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-search">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
    <path d="M21 21l-6 -6" />
  </svg>
    <span class="nav-label">Pesquisa</span>`;
    // separador

    // const a5 = document.createElement("a");
    // a5.href = "/perfil";
    // a5.classList.add("nav-user-link");
    // a5.innerHTML = `
    // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler       icons-tabler-outline icon-tabler-user">
    // <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    // <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    // <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    // </svg>`

    const sep = document.createElement("div");
    sep.classList.add("nav-sep");

    // botão de tema no header
    const isDarkNow = document.documentElement.classList.contains("dark");
    const themeBtn = document.createElement("button");
    themeBtn.classList.add("theme-btn");
    themeBtn.setAttribute("aria-label", "Alternar tema");
    themeBtn.innerHTML = isDarkNow
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-5.7 -13.7l.7 .7m12 -.7l-.7 .7m0 11.4l.7 .7m-12 -.7l-.7 .7"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>`;

    themeBtn.onclick = () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      themeBtn.innerHTML = isDark
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-5.7 -13.7l.7 .7m12 -.7l-.7 .7m0 11.4l.7 .7m-12 -.7l-.7 .7"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>`;
      // sincroniza o darkBtn do footer se existir
      syncDarkBtns(isDark);
    };

    const nav = document.createElement("nav");

    const buttonExit = document.createElement("button");
    buttonExit.onclick = () => nav.classList.remove("open");
    buttonExit.className = "btn-exit";
    buttonExit.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x-mark">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M12 16l3.644 3.644a1.21 1.21 0 0 0 1.712 0l2.288 -2.288a1.21 1.21 0 0 0 0 -1.712l-3.644 -3.644l3.644 -3.644a1.21 1.21 0 0 0 0 -1.712l-2.288 -2.288a1.21 1.21 0 0 0 -1.712 0l-3.644 3.644l-3.644 -3.644a1.21 1.21 0 0 0 -1.712 0l-2.288 2.288a1.21 1.21 0 0 0 0 1.712l3.644 3.644l-3.644 3.644a1.21 1.21 0 0 0 0 1.712l2.288 2.288a1.21 1.21 0 0 0 1.712 0l3.644 -3.644" />
</svg>
    `;
    nav.appendChild(buttonExit);
    nav.appendChild(a1);
    nav.appendChild(a2);
    nav.appendChild(a3);
    nav.appendChild(a4);
    nav.appendChild(sep);
    nav.appendChild(themeBtn);
    // nav.appendChild(a5);

    const buttonOpen = document.createElement("button");
    buttonOpen.className = "btn-open";
    buttonOpen.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-menu">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M4 8l16 0" />
	<path d="M4 16l16 0" />
</svg>
    `;
    buttonOpen.onclick = () => nav.classList.add("open");
    header.appendChild(div);
    header.appendChild(nav);
    header.appendChild(buttonOpen);
    return header;
  }
}
function syncDarkBtns(isDark) {
  const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-5.7 -13.7l.7 .7m12 -.7l-.7 .7m0 11.4l.7 .7m-12 -.7l-.7 .7"/></svg>`;
  const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>`;
  document.querySelectorAll(".footer-dark-btn, .theme-btn").forEach((btn) => {
    btn.innerHTML = isDark ? sunSvg : moonSvg;
  });
}
async function footerInfo(footer) {
  if (footer) {
    const logo = document.createElement("span");
    logo.classList.add("footer-logo");
    logo.innerHTML = title.titulo;

    const tagline = document.createElement("p");
    tagline.innerText = "Sua coleção. Sua qualidade.";

    const brand = document.createElement("div");
    brand.classList.add("footer-brand");
    brand.appendChild(logo);
    brand.appendChild(tagline);

    // Navegar
    const navTitle = document.createElement("h4");
    navTitle.innerText = "Navegar";

    const a1 = document.createElement("a");
    a1.href = "/";
    a1.innerText = "Início";

    const a2 = document.createElement("a");
    a2.href = "/catalog";
    a2.innerText = "Coleção";

    const a3 = document.createElement("a");
    a3.href = "/requests";
    a3.innerText = "Pedidos";

    const a4 = document.createElement("a");
    a4.href = "/releases";
    a4.innerText = "Lançamentos";

    const nav_button = document.createElement("button");
    nav_button.innerText = "Termos";
    nav_button.onclick = () => {
      overlay.classList.add("open");
    };

    const navLinks = document.createElement("div");
    navLinks.classList.add("footer-links");
    navLinks.appendChild(navTitle);
    navLinks.appendChild(a1);
    navLinks.appendChild(a2);
    navLinks.appendChild(a3);
    navLinks.appendChild(a4);
    navLinks.appendChild(nav_button);

    // Formatos
    const formatsTitle = document.createElement("h4");
    formatsTitle.innerText = "Formatos";

    const formatsLinks = document.createElement("div");
    formatsLinks.classList.add("footer-links");
    formatsLinks.appendChild(formatsTitle);

    [".MP4", ".MKV", "1080p", "4K"].forEach((f) => {
      const span = document.createElement("span");
      span.innerText = f;
      formatsLinks.appendChild(span);
    });

    // Servidor
    const serverTitle = document.createElement("h4");
    serverTitle.innerText = "Servidor";

    const status = document.createElement("span");
    status.classList.add("footer-status");

    const animesSpan = document.createElement("span");
    animesSpan.classList.add("footer-animes");
    animesSpan.innerText = "— animes";

    const totalSpan = document.createElement("span");
    totalSpan.classList.add("footer-total");
    totalSpan.innerText = "— episódios";

    const horaSpan = document.createElement("span");
    horaSpan.classList.add("footer-hora");

    const serverLinks = document.createElement("div");
    serverLinks.classList.add("footer-links");
    serverLinks.appendChild(serverTitle);
    serverLinks.appendChild(status);
    serverLinks.appendChild(animesSpan);
    serverLinks.appendChild(totalSpan);
    serverLinks.appendChild(horaSpan);

    // Dark mode
    const isDarkNow = document.documentElement.classList.contains("dark");
    const darkBtn = document.createElement("button");
    darkBtn.classList.add("footer-dark-btn");
    darkBtn.innerHTML = isDarkNow
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-5.7 -13.7l.7 .7m12 -.7l-.7 .7m0 11.4l.7 .7m-12 -.7l-.7 .7"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>`;

    darkBtn.onclick = () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      syncDarkBtns(isDark);
    };
    // linha inferior
    const footerBottom = document.createElement("div");
    footerBottom.classList.add("footer-bottom");
    footerBottom.innerHTML = `
      <p>${title.titulo} · Streaming pessoal · <span>HD Quality</span></p>
      <p>Rede local · privado</p>`;

    // Montar footer
    footer.classList.add("footer");
    footer.appendChild(brand);
    footer.appendChild(navLinks);
    footer.appendChild(formatsLinks);
    footer.appendChild(serverLinks);
    footer.appendChild(darkBtn);
    footer.after(footerBottom);

    // Hora em tempo real
    function updateTime() {
      horaSpan.textContent = new Date().toLocaleTimeString();
    }
    updateTime();
    setInterval(updateTime, 1000);

    // Stats da API
    try {
      const res = await fetch("/videos");
      if (!res.ok) throw new Error("Erro no servidor");
      const stats = await res.json();
      const animes = new Set(
        stats.videos.map((v) => `${v.anime}|||${v.season}`),
      );
      totalSpan.textContent = `${stats.total} episódios`;
      animesSpan.textContent = `${animes.size} animes`;
      status.textContent = "● Online";
      status.style.color = "#4ade80";
    } catch {
      status.textContent = "● Offline";
      status.style.color = "#f87171";
    }
    return footer;
  }
}
const termos = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 20a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>`,
    titulo: "Download de temporadas completas",
    descricao:
      "Para descarregar uma temporada completa, faz o pedido pela aba Pedidos indicando o anime e a temporada. O administrador irá transferir para uma pen e entregar pessoalmente.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/></svg>`,
    titulo: "Limite de downloads",
    descricao:
      "Máximo de 2 downloads simultâneos por dispositivo. O servidor suporta 5 no total — respeita os outros utilizadores.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="3" y="4" width="18" height="8" rx="1"/><rect x="3" y="12" width="18" height="8" rx="1"/><line x1="7" y1="8" x2="7.01" y2="8"/><line x1="7" y1="16" x2="7.01" y2="16"/></svg>`,
    titulo: "Disponibilidade do servidor",
    descricao:
      "O servidor pode ficar offline para manutenção sem aviso prévio. A velocidade pode variar com muitos utilizadores em simultâneo.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/></svg>`,
    titulo: "Pedidos e sugestões",
    descricao:
      "Pedidos de anime e relatórios de erros devem ser feitos pela aba Pedidos no footer. Não contactes o administrador diretamente.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>`,
    titulo: "Uso pessoal e privacidade",
    descricao:
      "Conteúdo apenas para uso pessoal e familiar. Não partilhes o link ou o acesso ao servidor com pessoas fora da rede.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.871l-8.106 -13.534a1.914 1.914 0 0 0 -3.274 0z"/><path d="M12 16h.01"/></svg>`,
    titulo: "Compatibilidade de vídeos",
    descricao:
      "Alguns vídeos podem não permitir avançar corretamente ou não funcionar no streaming. Isto é uma limitação técnica do ficheiro original — não é um erro do servidor.",
  },
];
termos.forEach(({ icon, titulo, descricao }) => {
  if (lista) {
    lista.innerHTML += `
  <div class="termo-item">
     ${icon}
    <div>
      <p class="termo-titulo">${titulo}</p>
      <p class="termo-desc">${descricao}</p>
    </div>
  </div>
`;
  }
});

const btnTopo = document.createElement("button");
btnTopo.classList.add("btn-topo");
btnTopo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="20" height="20" fill="currentColor"><path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"/></svg>`;
btnTopo.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
document.body.appendChild(btnTopo);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    btnTopo.classList.add("visible");
  } else {
    btnTopo.classList.remove("visible");
  }
});
if (localStorage.getItem("termos-aceites") === "sim") {
  if (overlay) {
    overlay.classList.remove("open");
  }
}
if (overlay) {
  document.getElementById("btn-aceitar").onclick = () => {
    localStorage.setItem("termos-aceites", "sim");
    overlay.classList.remove("open");
  };
}
