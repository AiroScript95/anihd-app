const grid = document.getElementById("episodesGrid");
const bar = document.getElementById("tabBar");
let active = 0;
let perTab = 0;
let allcards = [];
let totalTabs = 0;
const segments = location.pathname.replace(/^\/anime\//, "").split("/");
let apiUrl, hasParent;
let seasons = {};
let seasonNames = [];
if (segments.length === 1) {
  apiUrl = `/api/anime/${segments[0]}`;
  hasParent = false;
} else {
  apiUrl = `/api/anime/${segments[0]}/${segments[1]}`;
  hasParent = true;
}

function calculateTabs(totalCards) {
  const cardsPerTab = 24; // mínimo de cards por aba

  if (totalCards <= cardsPerTab) {
    // Se for menor que 24, só 1 aba
    return { numTabs: 1, perTab: totalCards };
  }

  // Calcula quantas abas precisa
  let numTabs = Math.ceil(totalCards / cardsPerTab);
  let perTab = cardsPerTab;

  return { numTabs, perTab };
}
// ✅ Gera labels das abas dinamicamente
function generateTabLabels(numTabs) {
  const labels = [];
  for (let i = 1; i <= numTabs; i++) {
    labels.push(i.toString());
  }
  return labels;
}

// ✅ Renderiza as abas
function renderTab(numTabs) {
  bar.innerHTML = ""; // limpa abas antigas
  const tabLabels = generateTabLabels(numTabs);

  tabLabels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.classList.add("tab-btn");
    btn.textContent = label;
    btn.onclick = () => {
      bar
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setTab(i);
    };
    bar.appendChild(btn);
  });

  // Primeira aba ativa
  bar.querySelector(".tab-btn").classList.add("active");
}

// ✅ Renderiza cards da aba selecionada
function renderCards(grupo) {
  grid.innerHTML = "";
  grupo.forEach((r) => grid.appendChild(r));
}

// ✅ Pega os cards de uma aba específica
function getGroup(index) {
  const start = index * perTab;
  return allcards.slice(start, start + perTab);
}

// ✅ Muda de aba
function setTab(i) {
  active = i;
  renderCards(getGroup(i));
}
/* ── INIT ───────────────────────────────── */
async function init() {
  try {
    const r = await fetch(apiUrl);
    if (!r.ok) throw new Error("Anime não encontrado");
    buildPage(await r.json());
  } catch (e) {
    document.getElementById("episodesGrid").innerHTML = `
      <div class="error-wrap">
        <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--error)" fill="none" stroke-width="1.4">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${e.message}</p>
      </div>`;
  }
}

/* ── BUILD PAGE ─────────────────────────── */
function buildPage(data) {
  const videos = data.videos || [];

  videos.forEach((v) => {
    if (!seasons[v.season]) seasons[v.season] = [];
    seasons[v.season].push(v);
  });

  seasonNames = Object.keys(seasons).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  const primeiro = videos[0] || {};
  document.title = (data.anime || "Anime") + " · AniHD";
  document.getElementById("heroTitle").textContent = data.anime || "";

  /* poster */
  const poster = document.getElementById("heroPoster");
  if (primeiro.img) {
    poster.innerHTML = "";
    const img = document.createElement("img");
    img.src = primeiro.img;
    img.alt = data.anime;
    img.onerror = () => {
      poster.innerHTML = `
        <svg viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="15" rx="2"/>
          <polyline points="17 2 12 7 7 2"/>
        </svg>`;
    };
    poster.appendChild(img);
  }

  /* hero background */
  if (primeiro.thumb) {
    document.getElementById("heroBg").style.backgroundImage =
      `url('${primeiro.thumb}')`;
  }

  /* badges */
  const meta = document.getElementById("heroMeta");

  (primeiro.categoria || ["Geral"]).forEach((c) => {
    const b = document.createElement("span");
    b.className = "badge badge-cat";
    b.textContent = c;
    meta.appendChild(b);
  });

  if (primeiro.year && primeiro.year !== "0000") {
    const b = document.createElement("span");
    b.className = "badge badge-year";
    b.textContent = primeiro.year;
    meta.appendChild(b);
  }

  if (primeiro.status) {
    const isSoon = primeiro.status.toLowerCase().includes("em breve");
    const b = document.createElement("span");
    b.className = "badge " + (isSoon ? "badge-status-soon" : "badge-status-ok");
    b.textContent = primeiro.status;
    meta.appendChild(b);
  }

  document.getElementById("heroSinopse").textContent = primeiro.sinopse || "";

  selectSeason(seasonNames[0]);
}

function selectSeason(season) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.season === season));
  renderEpisodes(seasons[season] || []);
}

/* ── EPISODES ───────────────────────────── */
function renderEpisodes(eps) {
  const validos = eps.filter((e) => !e.semEpisodios);

  // ✅ ordena pelo número do episódio antes de renderizar
  validos.sort((a, b) => {
    const getNum = (arquivo) =>
      parseInt(
        arquivo?.match(/ep\s*\d+x(\d+)/i)?.[1] ||
          arquivo?.match(/ep\s*(\d+)/i)?.[1] ||
          arquivo?.match(/epis[oó]dio\s*(\d+)/i)?.[1] ||
          arquivo?.match(/episode\s*(\d+)/i)?.[1] ||
          arquivo?.match(/\bS\d+E(\d+)\b/i)?.[1] ||
          arquivo?.match(/\d+x(\d+)/i)?.[1] ||
          arquivo?.match(/\bE(\d+)\b/i)?.[1] ||
          arquivo?.match(/[\[\(](\d+)[\]\)]/)?.[1] ||
          arquivo?.match(/\s-\s(\d+)\s-/)?.[1] ||
          arquivo?.match(/movie\s*(\d+)/i)?.[1] ||
          "0",
        10,
      );
    return getNum(a.arquivo) - getNum(b.arquivo);
  });

  if (!validos.length) {
    grid.innerHTML = `
      <div class="empty-season">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-movie-off">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 4h10a2 2 0 0 1 2 2v10m-.592 3.42c-.362 .359 -.859 .58 -1.408 .58h-12a2 2 0 0 1 -2 -2v-12c0 -.539 .213 -1.028 .56 -1.388" />
      <path d="M8 8v12" />
      <path d="M16 4v8m0 4v4" />
      <path d="M4 8h4" />
      <path d="M4 16h4" />
      <path d="M4 12h8m4 0h4" />
      <path d="M16 8h4" />
      <path d="M3 3l18 18" />
    </svg>
        <p>Sem episódios disponíveis ainda.</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";

  const { numTabs, perTab: cardsPerTab } = calculateTabs(validos.length);
  totalTabs = numTabs;
  perTab = cardsPerTab;
  allcards = [];

  if (totalTabs > 1) {
    renderTab(totalTabs);
  }

  validos.forEach((ep, index) => {
    const nomeEp = ep.arquivo
      ? ep.arquivo.replace(/\.[^.]+$/, "")
      : `Episódio ${index + 1}`;

    const playerUrl = hasParent
      ? `/watch/${segments[0]}/${segments[1]}?caminho=${encodeURIComponent(ep.caminho)}`
      : `/watch/${segments[0]}?caminho=${encodeURIComponent(ep.caminho)}`;

    /* extrai número do episódio do nome do ficheiro */
    const numEp =
      ep.arquivo.match(/ep\s*\d+x(\d+)/i)?.[1] ||
      ep.arquivo.match(/ep\s*(\d+)/i)?.[1] ||
      ep.arquivo.match(/epis[oó]dio\s*(\d+)/i)?.[1] ||
      ep.arquivo.match(/episode\s*(\d+)/i)?.[1] ||
      ep.arquivo.match(/\bS\d+E(\d+)\b/i)?.[1] ||
      ep.arquivo.match(/\d+x(\d+)/i)?.[1] ||
      ep.arquivo.match(/\bE(\d+)\b/i)?.[1] ||
      ep.arquivo.match(/[\[\(](\d+)[\]\)]/)?.[1] ||
      ep.arquivo.match(/\s-\s(\d+)\s-/)?.[1] ||
      ep.arquivo.match(/movie\s*(\d+)/i)?.[1] ||
      String(index + 1);

    const numPad = String(numEp).padStart(2, "0");

    const card = document.createElement("a");
    card.className = "ep-card";
    card.href = playerUrl;

    /* thumbnail: tenta imagem, cai para SVG */
    const thumbHtml = ep.thumb
      ? `<img src="${ep.thumb}" alt="${nomeEp}"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'ep-thumb-fallback\\'><svg viewBox=\\'0 0 24 24\\'><polygon points=\\'23 7 16 12 23 17 23 7\\'/><rect x=\\'1\\' y=\\'5\\' width=\\'15\\' height=\\'14\\' rx=\\'2\\'/></svg></div>'">`
      : `<div class="ep-thumb-fallback">
           <svg viewBox="0 0 24 24">
             <polygon points="23 7 16 12 23 17 23 7"/>
             <rect x="1" y="5" width="15" height="14" rx="2"/>
           </svg>
         </div>`;

    card.innerHTML = `
      <div class="ep-thumb">
        ${thumbHtml}
        <div class="ep-overlay">
          <div class="ep-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <span class="ep-num-badge">EP ${numPad}</span>
      </div>
      <div class="ep-body">
        <p class="ep-title">${nomeEp}</p>
      </div>`;
    allcards.push(card);
  });

  // ✅ RENDERIZA PRIMEIRA ABA
  if (totalTabs > 1) {
    renderCards(getGroup(0));
  } else {
    // Se só tem 1 aba, renderiza tudo
    allcards.forEach((card) => grid.appendChild(card));
  }
}

init();
