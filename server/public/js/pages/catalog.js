const dataList = document.getElementById("dataList");
const bar = document.getElementById("tabBar");
let active = 0;
let perTab = 0;
let allcards = [];
let totalTabs = 0;

// ✅ Conta cards e calcula quantas abas precisa
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
  dataList.innerHTML = "";
  grupo.forEach((r) => dataList.appendChild(r));
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

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector("img[data-src]");
        if (img) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "100px" },
);

fetch("/videos")
  .then((response) => response.json())
  .then((data) => {
    const videosPorSeason = {};

    data.videos.forEach((item) => {
      const chave = `${item.anime}|||${item.season}`;
      if (!videosPorSeason[chave]) videosPorSeason[chave] = [];
      videosPorSeason[chave].push(item);
    });

    // Gera todos os cards
    Object.keys(videosPorSeason).forEach((chave) => {
      const listaEpisodios = videosPorSeason[chave];
      const videoData = listaEpisodios[0];
      const card = createCard(videoData, listaEpisodios);
      if (!card) return;
      allcards.push(card);
      observer.observe(card);
    });

    // ✅ Calcula tabs automaticamente
    const { numTabs, perTab: cardsPerTab } = calculateTabs(allcards.length);
    totalTabs = numTabs;
    perTab = cardsPerTab;

    // ✅ Renderiza abas só se houver mais de 1
    if (totalTabs > 1) {
      renderTab(totalTabs);
    } else {
      bar.style.display = "none"; // esconde abas se só tiver 1
    }

    renderCards(getGroup(0));
  })
  .catch((error) => {
    console.error("Erro ao buscar vídeos:", error);
    document.getElementById("dataList").innerHTML = `
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
  });

function createCard(videoData, listaEpisodios) {
  const nomeAnime = videoData.anime;
  const nomeSeason = videoData.season;
  const semEpisodios = videoData.semEpisodios === true;
  const status = videoData.status;
  const year = videoData.year || null;
  const categorias = Array.isArray(videoData.categoria)
    ? videoData.categoria
    : [];

  if (semEpisodios) return;

  const sec = document.createElement("section");
  sec.classList.add("card-catalog");

  const img = document.createElement("img");
  img.dataset.src = videoData.img;
  img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  img.loading = "eager";
  img.decoding = "async";
  img.alt = nomeSeason;
  sec.appendChild(img);

  const gradient = document.createElement("div");
  gradient.classList.add("card-gradient");
  sec.appendChild(gradient);

  const top = document.createElement("div");
  top.classList.add("card-top");

  if (status) {
    const statusBadge = document.createElement("span");
    statusBadge.classList.add("card-cat-badge");
    statusBadge.innerText = status;
    if (status === "download") statusBadge.classList.add("badge-download");
    else if (status === "em breve") statusBadge.classList.add("badge-soon");
    else if (status === "a expirar")
      statusBadge.classList.add("badge-removing");
    top.appendChild(statusBadge);
  }
  sec.appendChild(top);

  const content = document.createElement("div");
  content.classList.add("card-content");

  const ul = document.createElement("ul");
  ul.classList.add("card-cats");
  categorias.forEach((cat) => {
    const li = document.createElement("li");
    li.innerText = cat;
    ul.appendChild(li);
  });
  content.appendChild(ul);

  const h3 = document.createElement("h3");
  h3.innerText = nomeSeason;
  h3.title = nomeSeason;
  content.appendChild(h3);

  const meta = document.createElement("div");
  meta.classList.add("card-meta");
  const v = listaEpisodios.length;
  const epText = `${String(v).padStart(2, "0")} ${v > 1 ? "episódeos" : "episódeo"}`;
  const metaParts = [epText];
  if (year) metaParts.push(year);
  meta.innerText = metaParts.join(" · ");
  content.appendChild(meta);

  const bottom = document.createElement("div");
  bottom.classList.add("card-bottom");

  const p = document.createElement("p");
  p.innerText = videoData.sinopse || "";
  bottom.appendChild(p);

  const playBtn = document.createElement("button");
  playBtn.classList.add("card-play-btn");
  playBtn.setAttribute("aria-label", "Assistir");
  playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M7 4v16l13-8z"/></svg>`;
  playBtn.onclick = () => {
    let urlDestino;
    if (nomeAnime !== nomeSeason && nomeSeason !== "Temporada") {
      urlDestino = `/anime/${encodeURIComponent(nomeAnime)}/${encodeURIComponent(nomeSeason)}`;
    } else {
      urlDestino = `/anime/${encodeURIComponent(nomeAnime)}`;
    }
    window.location.href = urlDestino;
  };
  bottom.appendChild(playBtn);

  content.appendChild(bottom);
  sec.appendChild(content);

  const art = document.createElement("article");
  art.classList.add("card-sinopse-overlay");

  const buttonArt = document.createElement("button");
  buttonArt.setAttribute("aria-label", "Fechar sinopse");
  buttonArt.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
  buttonArt.onclick = (e) => {
    e.stopPropagation();
    art.classList.remove("open");
  };

  const h3Art = document.createElement("h3");
  h3Art.innerText = "Sinopse";

  const pArt = document.createElement("p");
  pArt.innerText = videoData.sinopse || "";

  art.appendChild(buttonArt);
  art.appendChild(h3Art);
  art.appendChild(pArt);
  sec.appendChild(art);

  const observerP = new ResizeObserver(() => {
    if (p.scrollHeight > p.clientHeight) {
      if (!sec.contains(art)) sec.appendChild(art);
      p.classList.add("clicavel");
      p.onclick = () => art.classList.add("open");
    } else {
      p.classList.remove("clicavel");
      p.onclick = null;
    }
  });
  observerP.observe(p);

  return sec;
}
