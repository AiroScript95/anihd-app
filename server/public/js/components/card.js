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

/**
 * Cria um card de anime.
 *
 * @param {object} video     — objeto do vídeo (campos: anime, season, img, semEpisodios, status, categoria, year)
 * @param {number} totalEps  — número de episódios do grupo (já calculado pelo chamador)
 * @returns {HTMLElement}    — o <section> pronto a inserir no DOM
 */
function criarCardAnime(video, totalEps) {
  const semEpisodios = video.semEpisodios === true;
  const categorias = Array.isArray(video.categoria) ? video.categoria : [];
  const status = video.status;
  const year = video.year || null;
  const totalEp = totalEps;

  const sec = document.createElement("section");
  sec.classList.add("card-anime-img");
  if (semEpisodios) sec.classList.add("card-sem-episodios");

  sec.onclick = () => {
    if (semEpisodios) return;
    const destino =
      video.anime !== video.season && video.season !== "Temporada"
        ? `/anime/${encodeURIComponent(video.anime)}/${encodeURIComponent(video.season)}`
        : `/anime/${encodeURIComponent(video.anime)}`;
    window.location.href = destino;
  };

  // imagem (lazy)
  const img = document.createElement("img");
  img.dataset.src = video.img;
  img.src = "";
  img.alt = video.season;
  img.loading = "lazy";
  img.decoding = "async";
  sec.appendChild(img);

  // badge de status (só se existir)
  if (status) {
    const statusBadge = document.createElement("span");
    statusBadge.classList.add("card-cat-badge");
    statusBadge.innerText = status;
    if (status === "download") statusBadge.classList.add("badge-download");
    else if (status === "em breve") statusBadge.classList.add("badge-soon");
    else if (status === "a expirar") statusBadge.classList.add("badge-removing");
    sec.appendChild(statusBadge);
  }

  // painel inferior: título + categorias + ano
  const bottom = document.createElement("div");
  bottom.classList.add("card-bottom");

  const h3 = document.createElement("h3");
  h3.innerText = video.season;
  h3.title = video.season;
  bottom.appendChild(h3);

  if (categorias.length > 0) {
    const cats = document.createElement("div");
    cats.classList.add("card-cats");
    categorias.forEach((cat) => {
      const span = document.createElement("span");
      span.innerText = cat;
      cats.appendChild(span);
    });
    bottom.appendChild(cats);
  }
  const ep_year = document.createElement("div");
  ep_year.className = "card-meta";
  const epText = `${String(totalEp).padStart(2,"0")} ${totalEp > 1 ? "episódeos" : "episódeo"}`;
  const metaParts = [epText];
  metaParts.push(year);
  ep_year.innerText = metaParts.join(" · ");

  bottom.appendChild(ep_year);

  sec.appendChild(bottom);

  return sec;
}
