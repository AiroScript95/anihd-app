// ── DADOS GLOBAIS ──────────────────────────────────────────────────
let videosAll = [];
let todosOsCards = [];

// ── FUNÇÕES AUXILIARES ─────────────────────────────────────────────
function agrupar(videos) {
  const grupos = {};
  videos.forEach((video) => {
    const chave = `${video.anime}|||${video.season}`;
    if (!grupos[chave]) {
      grupos[chave] = { ...video, total: 1 };
    } else {
      grupos[chave].total++;
    }
  });
  return Object.values(grupos).sort((a, b) =>
    a.season.localeCompare(b.season, undefined, { numeric: true })
  );
}

function extrairCategorias(videos) {
  const categorias = new Set();
  videos.forEach((video) => {
    const cats = Array.isArray(video.categoria) ? video.categoria : [];
    cats.forEach((c) => {
      // exclui badges de estado
      if (c !== "Download" && c !== "Em breve" && c !== "Brevemente") {
        categorias.add(c);
      }
    });
  });
  return Array.from(categorias).sort();
}

function renderizar(videos, categoriaFiltro = "Todos") {
  const datalist = document.getElementById("animes-search");
  datalist.innerHTML = "";


  // filtra por categoria também
  const videosAgrupados = agrupar(videos);
  const videosFiltrados =
    categoriaFiltro === "Todos"
      ? videosAgrupados
      : videosAgrupados.filter((v) => {
          const cats = Array.isArray(v.categoria) ? v.categoria : [];
          return cats.includes(categoriaFiltro);
        });

  if (videosFiltrados.length === 0) {
    datalist.innerHTML = `
      <div class="anime-off">
        <div class="anime-off-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2>Nenhum resultado</h2>
        <small>Tenta outro termo ou categoria</small>
      </div>`;
    return;
  }

  videosFiltrados.forEach((video) => {
    const card = criarCardAnime(video, video.total);
    card.dataset.categorias = JSON.stringify(
      Array.isArray(video.categoria) ? video.categoria : []
    );
    datalist.appendChild(card);
    observer.observe(card);
  });
}

// ── FETCH E INICIALIZAÇÃO ──────────────────────────────────────────
fetch("/videos")
  .then((r) => r.json())
  .then((data) => {
    if (!data.videos || data.videos.length === 0) {
      document.getElementById("animes-search").innerHTML = `
        <div class="anime-off">
          <div class="anime-off-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z" />
              <path d="M10 17l.01 0" />
              <path d="M14 17l.01 0" />
              <path d="M10 5l4 0" />
            </svg>
          </div>
          <h2>HD Desconectado</h2>
          <small>Liga o HD para aceder à tua coleção</small>
        </div>`;
      return;
    }

    videosAll = data.videos;


    // ── GERA FILTROS DE CATEGORIA ──────────────────────────────────
    const searchFiltersContainer = document.getElementById("search-filters");
    if (searchFiltersContainer) {
      searchFiltersContainer.innerHTML = "";

      const btnTodos = document.createElement("button");
      btnTodos.classList.add("search-filter-btn", "active");
      btnTodos.dataset.categoria = "Todos";
      btnTodos.textContent = "Todos";
      searchFiltersContainer.appendChild(btnTodos);

      extrairCategorias(videosAll).forEach((categoria) => {
        const btn = document.createElement("button");
        btn.classList.add("search-filter-btn");
        btn.dataset.categoria = categoria;
        btn.textContent = categoria;
        searchFiltersContainer.appendChild(btn);
      });

      // ── LÓGICA DE FILTRO DE CATEGORIA ──────────────────────────
      searchFiltersContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".search-filter-btn");
        if (!btn) return;

        searchFiltersContainer
          .querySelectorAll(".search-filter-btn")
          .forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");

        const categoriaFiltro = btn.dataset.categoria;
        const termo = document
          .getElementById("searchInput")
          .value.toLowerCase();

        const videosFiltradosPorTermo = videosAll.filter(
          (v) =>
            v.anime.toLowerCase().includes(termo) ||
            v.season.toLowerCase().includes(termo)
        );

        renderizar(videosFiltradosPorTermo, categoriaFiltro);
      });
    }

    // ── RENDERIZA INICIAL ──────────────────────────────────────────
    renderizar(videosAll);
  })
  .catch(() => {
    document.getElementById("animes-search").innerHTML = `
      <div class="anime-off">
        <div class="anime-off-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2>Erro ao carregar</h2>
        <small>Não foi possível ligar ao servidor</small>
      </div>`;
  });

// ── EVENT LISTENER DO SEARCH INPUT ─────────────────────────────────
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", (e) => {
  const termo = e.target.value.toLowerCase();
  const categoriaAtiva = document.querySelector(".search-filter-btn.active");
  const categoriaFiltro = categoriaAtiva
    ? categoriaAtiva.dataset.categoria
    : "Todos";

  const videosFiltrados = videosAll.filter(
    (v) =>
      v.anime.toLowerCase().includes(termo) ||
      v.season.toLowerCase().includes(termo)
  );

  renderizar(videosFiltrados, categoriaFiltro);
});
