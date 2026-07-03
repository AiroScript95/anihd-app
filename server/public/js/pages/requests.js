const dataPedidos = document.getElementById("dataPedidos");
fetch("get-pedidos")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((item) => {
      const art = document.createElement("article");

      const h2 = document.createElement("h2");
      h2.textContent = item.Anime;

      const p = document.createElement("p");
      p.textContent = item.Descricao;

      const span = document.createElement("span");
      span.textContent = item.Status;
      span.classList.add(`${item.Status}`)

      art.appendChild(h2);
      art.appendChild(p);
      art.appendChild(span);
      dataPedidos.appendChild(art);
    });
  });
