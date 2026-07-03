// ─── Elementos ───────────────────────────────────────────
const video = document.getElementById("videoplay");
const barprogress = document.getElementById("barraProgresso");
const volumeBar = document.getElementById("volume");
const icoVolume = document.getElementById("icoVolume");
const containerVideo = document.getElementById("containerVideo");
const tempoTotal = document.getElementById("tempoTotal");
const loader = document.getElementById("loader");
const playStatus = document.getElementById("play-status");
// ─── Teclado ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === " ") e.preventDefault();
  if (e.ctrlKey) {
    if (e.key === "ArrowRight") video.currentTime += 10;
    if (e.key === "ArrowLeft") video.currentTime -= 10;
    return;
  }
  switch (e.key) {
    case " ":
    case "k":
      playOrPause();
      break;
    case "f":
      fullScreem();
      break;
    case "m":
      muted();
      break;
    case "ArrowRight":
      video.currentTime += 5;
      break;
    case "ArrowLeft":
      video.currentTime -= 5;
      break;
    case "ArrowUp":
      video.volume = Math.min(1, video.volume + 0.1);
      break;
    case "ArrowDown":
      video.volume = Math.max(0, video.volume - 0.1);
      break;
    case "t":
      if (document.fullscreenElement) mostrarControlos();
      break;
  }
});

// ─── Play / Pause ─────────────────────────────────────────
video.addEventListener("click", () => {
  if (video.src) playOrPause();
});

let tentativas = 0;
const maxTentativas = 15;

function recarregar() {
  if (tentativas >= maxTentativas) return;
  tentativas++;
  const tempoAtual = isFinite(video.currentTime) ? video.currentTime : 0;
  const fonte = video.src;
  if (!fonte) return;

  setTimeout(() => {
    video.src = fonte;
    video.load();
    video.addEventListener(
      "loadedmetadata",
      () => {
        video.currentTime = tempoAtual;
        video.play().catch(() => {});
      },
      { once: true },
    );
  }, 5000);
}

video.addEventListener("error", () => recarregar());
video.addEventListener("stalled", () => recarregar());
video.addEventListener("playing", () => {
  tentativas = 0;
  loader.classList.remove("open");
  playStatus.classList.remove("open")
  iconPlay(true);
});

video.addEventListener("waiting", () => {
  loader.classList.add("open");
});

function playOrPause() {
  if (video.src) {
    if (video.paused) {
      video.play();
      playStatus.classList.remove("open")
      iconPlay(true);
    } else {
      video.pause();
      playStatus.classList.add("open")
      iconPlay(false);
    }
  }
}

function iconPlay(playing) {
  const btn = document.querySelector(".play");
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-player-pause">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
    <path d="M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
  </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-player-play">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M7 4v16l13 -8l-13 -8" />
  </svg>`;
}

// ─── Navegação de tempo ───────────────────────────────────
function nextDuration() {
  video.currentTime = Math.min(video.currentTime + 10, video.duration);
}

function previusDuration() {
  video.currentTime = Math.max(video.currentTime - 10, 0);
}

// ─── Progresso ────────────────────────────────────────────
function updateTrack(input) {
  const min = input.min || 0;
  const max = input.max || 100;
  const val = ((input.value - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, #c4935a ${val}%, #ffffff30 ${val}%)`;
}

video.addEventListener("loadedmetadata", () => {
  document.getElementById("tempo").textContent = formatarTime(video.duration);
  tempoTotal.innerText = formatarTime(video.duration);
});

video.addEventListener("timeupdate", () => {
  const percentagem = (video.currentTime / video.duration) * 100;
  barprogress.value = percentagem;
  document.getElementById("tempo").textContent = formatarTime(
    video.currentTime,
  );
  updateTrack(barprogress); // ← adiciona
});

barprogress.addEventListener("input", () => {
  video.currentTime = (barprogress.value / 100) * video.duration;
  document.getElementById("tempo").textContent = formatarTime(
    video.currentTime,
  );
  updateTrack(barprogress); // ← adiciona
});

barprogress.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    // video.currentTime = Math.min(video.currentTime + 1, video.duration);
    video.currentTime += 1;
  } else {
    // video.currentTime = Math.min(video.currentTime - 1, video.duration);
    video.currentTime -= 1;
  }
});

// video.addEventListener(
//   "wheel",
//   (e) => {
//     if (video.paused || !video.duration || !isFinite(video.duration)) return;
//     e.preventDefault();
//     if (e.deltaY < 0) {
//       video.currentTime = Math.min(video.currentTime + 1, video.duration);
//     } else {
//       video.currentTime = Math.max(video.currentTime - 1, 0);
//     }
//   },
//   { passive: false },
// );

// ─── Volume ───────────────────────────────────────────────
video.addEventListener("volumechange", () => {
  volumeBar.value = video.volume;
  volumeAjuste(icoVolume);
  updateTrack(volumeBar); // ← adiciona
});

volumeBar.addEventListener("input", () => {
  video.volume = volumeBar.value;
  if (video.volume === 0) video.muted = true;
  if (video.muted && video.volume > 0) video.muted = false;
  volumeAjuste(icoVolume);
  updateTrack(volumeBar); // ← adiciona
});

function muted() {
  video.muted = !video.muted;
}

function volumeAjuste(i) {
  const silenciado = video.volume === 0 || video.muted || volumeBar.value == 0;
  i.innerHTML = silenciado
    ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-volume-off">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464" />
    <path d="M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615" />
    <path d="M9.069 5.054l.431 -.554a.8 .8 0 0 1 1.5 .5v2m0 4v8a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l1.294 -1.664" />
    <path d="M3 3l18 18" />
  </svg>
  `
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-volume">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M15 8a5 5 0 0 1 0 8" />
    <path d="M17.7 5a9 9 0 0 1 0 14" />
    <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
  </svg>`;
}

// ─── Fullscreen ───────────────────────────────────────────
async function fullScreem() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    screen.orientation.unlock();
    document.getElementById("fullscreem").innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-maximize">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
    </svg>`;
  } else {
    const container = document.getElementById("containerVideo");
    await container.requestFullscreen();
    document.getElementById("fullscreem").innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-minimize">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 19v-2a2 2 0 0 1 2 -2h2" />
      <path d="M15 5v2a2 2 0 0 0 2 2h2" />
      <path d="M5 15h2a2 2 0 0 1 2 2v2" />
      <path d="M5 9h2a2 2 0 0 0 2 -2v-2" />
    </svg>`;
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
  }
}

let hideTimer;

function mostrarControlos() {
  containerVideo.style.cursor = "default";
  containerVideo.classList.remove("hide-controls");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    containerVideo.style.cursor = "none";
    containerVideo.classList.add("hide-controls");
  }, 2000);
}

containerVideo.addEventListener("mousemove", () => {
  if (document.fullscreenElement) mostrarControlos();
});

containerVideo.addEventListener("mouseenter", () => {
  if (document.fullscreenElement) mostrarControlos();
});

containerVideo.addEventListener("mouseleave", () => {
  if (document.fullscreenElement) {
    clearTimeout(hideTimer);
    containerVideo.classList.add("hide-controls");
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    clearTimeout(hideTimer);
    containerVideo.style.cursor = "default";
    containerVideo.classList.remove("hide-controls");
  }
});

// ─── Carregar / Limpar vídeo ──────────────────────────────
function Play(play, name) {
  document.getElementById("name").innerHTML = name;
  video.src = play;
  video.load();
  video.play().catch((erro) => console.log("Erro na reprodução: ", erro));
}

function limpar() {
  video.src = "";
  video.load();
  document.getElementById("containerVideo").classList.remove("open");
}

// ─── Utilitários ──────────────────────────────────────────
function formatarTime(s) {
  const hor = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const seg = Math.floor(s % 60);
  return `${String(hor).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

updateTrack(barprogress);
updateTrack(volumeBar);
