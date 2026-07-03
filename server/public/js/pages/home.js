// guarda todos os cards gerados para filtrar sem novo fetch
let todosOsCards = [];

fetch("/videos")
  .then((r) => r.json())
  .then((data) => {
    const list = document.getElementById("list");
    const tabsContainer = document.getElementById("tabsGenero");

    // ── EMPTY STATE: HD desconectado ──────────────────────────────
    if (!data.videos || data.videos.length === 0) {
      list.innerHTML = `
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

    // ── AGRUPA POR SEASON ──────────────────────────────────────────
    const grupos = {};
    data.videos.forEach((item) => {
      if (!grupos[item.season]) grupos[item.season] = [];
      grupos[item.season].push(item);
    });

    // ── GERA CARDS ─────────────────────────────────────────────────
    const seasons = Object.keys(grupos).sort(() => Math.random() - 0.5);
    const limite = Math.min(seasons.length, 12);
    todosOsCards = [];

    for (let i = 0; i < limite; i++) {
      const episodios = grupos[seasons[i]];
      const video = episodios[0];
      if (video.semEpisodios) continue;

      const categorias = Array.isArray(video.categoria) ? video.categoria : [];
      const card = criarCardAnime(video, episodios.length);

      // guarda as categorias no elemento para filtrar depois
      card.dataset.categorias = JSON.stringify(categorias);
      card.classList.add("card-carrossel")

      list.appendChild(card);
      observer.observe(card);
      todosOsCards.push(card);
    }

    // ── GERA TABS DE GÉNERO dinamicamente ─────────────────────────
    const generosSet = new Set();
    todosOsCards.forEach((card) => {
      const cats = JSON.parse(card.dataset.categorias || "[]");
      cats.forEach((c) => {
        // exclui badges de estado, guarda só géneros
        if (c !== "Download" && c !== "Em breve" && c !== "Brevemente") {
          generosSet.add(c);
        }
      });
    });

    generosSet.forEach((genero) => {
      const btn = document.createElement("button");
      btn.classList.add("tab-genero");
      btn.dataset.genero = genero;
      btn.textContent = genero;
      tabsContainer.appendChild(btn);
    });

    // ── LÓGICA DE FILTRO ───────────────────────────────────────────
    tabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-genero");
      if (!btn) return;

      // atualiza tab ativa
      tabsContainer
        .querySelectorAll(".tab-genero")
        .forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");

      const generoSelecionado = btn.dataset.genero;

      todosOsCards.forEach((card) => {
        const cats = JSON.parse(card.dataset.categorias || "[]");
        const mostra =
          generoSelecionado === "Todos" || cats.includes(generoSelecionado);
        card.style.display = mostra ? "" : "none";
      });
    });
  })
  .catch(() => {
    document.getElementById("list").innerHTML = `
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
