async function carregarBanners() {
  const banners = await fetch("/api/banners").then((r) => r.json());
  const container = document.querySelector(".banners");
  const lista = [...banners, ...banners];
  lista.forEach((url) => {
    const img = document.createElement("img");
    img.src = `${url}?w=1280`; // desktop
    img.loading = "lazy";
    img.decoding = "async";
    container.appendChild(img);
  });
  let atual = 0;
  const total = banners.length;
  function avancar() {
    atual++;
    container.style.transition = "transform 0.8s ease-in-out";
    container.style.transform = `translateX(-${atual * 100}%)`;
    if(atual>= total) {
      setTimeout(() => {
        container.style.transition = "none";
        container.style.transform = `translateX(0)`;
        atual = 0;
      }, 800);
    }
  }
  setInterval(avancar,5000)
}
carregarBanners();
