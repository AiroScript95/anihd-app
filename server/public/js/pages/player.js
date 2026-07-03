let titleAnime = {};

fetch("/api/config")
  .then((r) => r.json())
  .then((config) => {
    titleAnime = config;
  });

const caminho = new URLSearchParams(location.search).get("caminho");
const partes = caminho.split("/");
let fetchUrl, hasParent, rotaEp;
if (partes.length === 3) {
  fetchUrl = `/api/anime/${partes[0]}/${partes[1]}`;
  hasParent = true;
  rotaEp = partes[2].replace(/\.[^.]+$/, "");
} else {
  fetchUrl = `/api/anime/${partes[0]}`;
  hasParent = false;
  rotaEp = partes[1].replace(/\.[^.]+$/, "");
}

function getNumEp(arquivo, fallback) {
  return parseInt(
    arquivo?.match(/ep\s*\d+x(\d+)/i)?.[1] ||
      arquivo?.match(/\d+x(\d+)/i)?.[1] || // fix: antes do ep\s*(\d+)
      arquivo?.match(/ep\s*(\d+)/i)?.[1] ||
      arquivo?.match(/epis[oó]dio\s*(\d+)/i)?.[1] || // adicionado da v1
      arquivo?.match(/episode\s*(\d+)/i)?.[1] || // adicionado da v1
      arquivo?.match(/\bS\d+E(\d+)\b/i)?.[1] ||
      arquivo?.match(/\bE(\d+)\b/i)?.[1] ||
      arquivo?.match(/[\[\(](\d+)[\]\)]/)?.[1] ||
      arquivo?.match(/\s-\s(\d+)\s-/)?.[1] ||
      arquivo?.match(/movie\s*(\d+)/i)?.[1] ||
      fallback,
    10,
  );
}

fetch(fetchUrl)
  .then((res) => res.json())
  .then((dados) => {
    const videos = dados.videos;
    // const primeiro = videos[2];
    document.title =
      "Assistindo" + " " + (rotaEp || "Anime") + " · " + titleAnime.titulo;
    videos.sort((a, b) => {
      const na = getNumEp(a.arquivo, 0);
      const nb = getNumEp(b.arquivo, 0);
      return na - nb;
    });
    // encontra o índice do ep clicado pelo caminho
    let indiceAtual = videos.findIndex((v) => v.caminho === caminho);
    if (indiceAtual === -1) indiceAtual = 0;
    const ep = videos[indiceAtual].arquivo;
    const video = document.getElementById("videoplay");
    const nextEp = document.getElementById("nextEp");
    const prevEp = document.getElementById("prevEp");
    const download = document.getElementById("btn-download");

    download.href = hasParent
      ? `/api/download/${partes[0]}/${partes[1]}/${ep}`
      : `/api/download/${partes[0]}/${videos[indiceAtual]}`;

    download.onclick = async (e) => {
      e.preventDefault();
      const url = download.href;
      const nomeAnime = videos[indiceAtual].anime;
      const numEpAtual = getNumEp(videos[indiceAtual].arquivo, indiceAtual + 1);
      const nome = `${titleAnime.titulo} - ${nomeAnime} Ep ${String(numEpAtual).padStart(2, "0")}.mp4`;

      download.disabled = true;
      download.title = "A descarregar...";

      const blob = await fetch(url).then((r) => r.blob());
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nome;
      a.click();
      URL.revokeObjectURL(a.href);

      download.disabled = false;
      download.title = "Download";
    };

    function atualizarNavegacao() {
      const anterior = videos[indiceAtual - 1];
      const seguinte = videos[indiceAtual + 1];

      const prevCard = document.getElementById("prevCard");
      const nextCard = document.getElementById("nextCard");

      if (anterior) {
        const num = getNumEp(anterior.arquivo, indiceAtual);
        prevCard.style.display = "flex";
        prevCard.querySelector(".ep-nav-num").innerText =
          `Ep ${String(num).padStart(2, "0")}`;
        prevCard.querySelector(".ep-nav-nome").innerText =
          anterior.arquivo.replace(/\.[^.]+$/, "");
      } else {
        prevCard.style.display = "none";
      }

      if (seguinte) {
        const num = getNumEp(seguinte.arquivo, indiceAtual + 2);
        nextCard.style.display = "flex";
        nextCard.querySelector(".ep-nav-num").innerText =
          `Ep ${String(num).padStart(2, "0")}`;
        nextCard.querySelector(".ep-nav-nome").innerText =
          seguinte.arquivo.replace(/\.[^.]+$/, "");
      } else {
        nextCard.style.display = "none";
      }
    }
    function irPara(index) {
      if (index < 0 || index >= videos.length) return;
      indiceAtual = index;
      const item = videos[indiceAtual];

      // ✅ actualiza a URL sem recarregar a página
      const novaUrl = hasParent
        ? `/watch/${partes[0]}/${partes[1]}?caminho=${encodeURIComponent(item.caminho)}`
        : `/watch/${partes[0]}?caminho=${encodeURIComponent(item.caminho)}`;

      download.href = hasParent
        ? `/api/download/${partes[0]}/${partes[1]}/${item.arquivo}`
        : `/api/download/${partes[0]}/${item.arquivo}`;
      history.replaceState(null, "", novaUrl);

      Play(`/stream/${item.caminho}`, item.arquivo.replace(/\.[^.]+$/, ""));
      atualizarNavegacao();
    }

    document.getElementById("prevCard").onclick = () => irPara(indiceAtual - 1);
    document.getElementById("nextCard").onclick = () => irPara(indiceAtual + 1);

    // botões flutuantes no video
    prevEp.onclick = () => irPara(indiceAtual - 1);
    nextEp.onclick = () => irPara(indiceAtual + 1);

    video.addEventListener("pause", () => {});
    video.addEventListener("play", () => {});

    let avancoAutomatico = false;
    video.addEventListener("timeupdate", () => {
      const temProximo = indiceAtual + 1 < videos.length;
      const temAnterior = indiceAtual - 1 >= 0;
      const limite = video.duration > 300 ? 120 : 30;

      if (video.currentTime >= video.duration - limite && temProximo) {
        nextEp.classList.add("open");
      } else {
        nextEp.classList.remove("open");
      }

      if (video.currentTime <= 10 && temAnterior) {
        prevEp.classList.add("open");
      } else {
        prevEp.classList.remove("open");
      }

      if (video.currentTime >= video.duration - 0.5 && !avancoAutomatico) {
        avancoAutomatico = true;
        irPara(indiceAtual + 1);
      }
    });

    // inicia o ep clicado automaticamente
    const item = videos[indiceAtual];
    Play(`/stream/${item.caminho}`, item.arquivo.replace(/\.[^.]+$/, ""));
    atualizarNavegacao();
  });
