const dataEp = document.getElementById("data-ep");
const dataSeason = document.getElementById("data-season");
const bar = document.getElementById("tabBar");
const MAX_TABS = 6;
const PER_TAB = 24;
let active = 0;
let allcards = [];

function renderTab(bar) {
  bar.innerHTML = "";
  const totalTabs = Math.min(MAX_TABS, Math.ceil(allcards.length / PER_TAB));
  for (let i = 0; i < totalTabs; i++) {
    const btn = document.createElement("button");
    btn.classList.add("tab-btn");
    btn.textContent = String(i + 1);
    btn.onclick = () => {
      bar.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setTab(i);
    };
    bar.appendChild(btn);
  }
  const first = bar.querySelector(".tab-btn");
  if (first) first.classList.add("active");
}

fetch("/api/releases")
  .then((r) => r.json())
  .then((releases) => {
    const seasonsVistas = new Set();
    const episodios = [];
    const temporadas = [];

    releases.forEach((release) => {
      const chaveSeason = `${release.anime}::${release.season}`;
      if (!seasonsVistas.has(chaveSeason)) {
        seasonsVistas.add(chaveSeason);
        temporadas.push(release);
      }
      episodios.push(release);
    });

    if (episodios.length === 0) {
      dataEp.innerHTML = "<p>Nenhum episódio encontrado.</p>";
    } else {
      allcards = episodios.slice(0, MAX_TABS * PER_TAB);
      renderCards(getGroup(0));
      if (allcards.length > PER_TAB) renderTab(bar);
    }

    if (temporadas.length === 0) {
      dataSeason.innerHTML = "<p>Nenhuma temporada encontrada.</p>";
    } else {
      temporadas.forEach((r) => dataSeason.appendChild(criarCardSeason(r)));
    }
  })
  .catch(() => {
    dataEp.innerHTML = "<p>Erro ao carregar.</p>";
    dataSeason.innerHTML = "<p>Erro ao carregar.</p>";
  });

function criarCardRelease(release) {
  const sec = document.createElement("section");
  sec.classList.add("card-anime-ep");

  sec.onclick = () => {
    const partes = release.caminho.split("/");
    const destino =
      partes.length === 3
        ? `/watch/${encodeURIComponent(partes[0])}/${encodeURIComponent(partes[1])}?caminho=${encodeURIComponent(release.caminho)}`
        : `/watch/${encodeURIComponent(partes[0])}?caminho=${encodeURIComponent(release.caminho)}`;
    window.location.href = destino;
  };

  const img = document.createElement("img");
  img.dataset.src = release.thumb || release.img;
  img.src = "";
  img.alt = release.anime;
  img.loading = "lazy";
  img.decoding = "async";
  sec.appendChild(img);

  const bottom = document.createElement("div");
  bottom.classList.add("card-bottom");
  const div = document.createElement("div");
  div.classList.add("card-title");
  const h4 = document.createElement("h4");
  h4.innerText = release.arquivo.replace(/\.[^.]+$/, "");
  h4.title = release.arquivo.replace(/\.[^.]+$/, "");
  const h5 = document.createElement("h5");
  h5.innerText = release.season;
  h5.title = release.season;
  div.appendChild(h4);
  div.appendChild(h5);

  const meta = document.createElement("div");
  meta.classList.add("card-meta");
  meta.innerText = dataRelativa(release.adicionado);

  function NumberEp(arquivo) {
    const num = parseInt(
      arquivo.match(/ep\s*\d+x(\d+)/i)?.[1] ||
        arquivo.match(/ep\s*(\d+)/i)?.[1] ||
        arquivo.match(/epis[oó]dio\s*(\d+)/i)?.[1] ||
        arquivo.match(/episode\s*(\d+)/i)?.[1] ||
        arquivo.match(/\d+x(\d+)/i)?.[1] ||
        arquivo.match(/\bS\d+E(\d+)\b/i)?.[1] ||
        arquivo.match(/\bE(\d+)\b/i)?.[1] ||
        arquivo.match(/[\[\(](\d+)[\]\)]/)?.[1] ||
        arquivo.match(/\s-\s(\d+)\s-/)?.[1] ||
        arquivo.match(/movie\s*(\d+)/i)?.[1] ||
        "0",
      10,
    );
    return num;
  }

  const ep = document.createElement("div");
  ep.classList.add("card-ep");
  ep.innerText = `EP ${String(NumberEp(release.arquivo)).padStart(2, "0")}`;

  bottom.appendChild(div);
  bottom.appendChild(meta);
  bottom.appendChild(ep);
  sec.appendChild(bottom);
  observer.observe(sec);

  return sec;
}

function criarCardSeason(release) {
  const sec = document.createElement("section");
  sec.classList.add("card-anime-img", "card-carrossel");

  sec.onclick = () => {
    const partes = release.caminho.split("/");
    const destino =
      partes.length === 3
        ? `/anime/${encodeURIComponent(partes[0])}/${encodeURIComponent(partes[1])}`
        : `/anime/${encodeURIComponent(partes[0])}`;
    window.location.href = destino;
  };

  const img = document.createElement("img");
  img.dataset.src = release.img;
  img.src = "";
  img.alt = release.season;
  img.loading = "lazy";
  img.decoding = "async";
  sec.appendChild(img);

  const status = release.status;
  if (status) {
    const statusBadge = document.createElement("span");
    statusBadge.classList.add("card-cat-badge");
    statusBadge.innerText = status;
    if (status === "download") statusBadge.classList.add("badge-download");
    else if (status === "em breve") statusBadge.classList.add("badge-soon");
    else if (status === "a expirar") statusBadge.classList.add("badge-removing");
    sec.appendChild(statusBadge);
  }

  const bottom = document.createElement("div");
  bottom.classList.add("card-bottom");
  const h3 = document.createElement("h3");
  h3.innerText = release.season;
  h3.title = release.season;
  bottom.appendChild(h3);

  const meta = document.createElement("div");
  meta.classList.add("card-meta");
  const data = new Date(release.adicionado).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });
  meta.innerText = `Nova temporada · ${data}`;
  bottom.appendChild(meta);

  sec.appendChild(bottom);
  observer.observe(sec);

  return sec;
}

function dataRelativa(ms) {
  const diff = Date.now() - ms;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return `Há ${dias} dias`;
  if (dias < 30) return `Há ${Math.floor(dias / 7)} sem.`;
  if (dias < 365)
    return new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  return new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function renderCards(grupo) {
  dataEp.innerHTML = "";
  grupo.forEach((r) => dataEp.appendChild(criarCardRelease(r)));
}

function getGroup(index) {
  const start = index * PER_TAB;
  return allcards.slice(start, start + PER_TAB);
}

function setTab(i) {
  active = i;
  renderCards(getGroup(i));
}
