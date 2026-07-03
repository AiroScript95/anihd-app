const list = document.getElementById("list");
const season = document.getElementById("data-season");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const SCROLL = 320;

btnRight?.addEventListener("click", () => {
  list?.scrollBy({ left: SCROLL, behavior: "smooth" });
  season?.scrollBy({ left: SCROLL, behavior: "smooth" });
});

btnLeft?.addEventListener("click", () => {
  list?.scrollBy({ left: -SCROLL, behavior: "smooth" });
  season?.scrollBy({ left: -SCROLL, behavior: "smooth" });
});
