const dataPedidos = document.getElementById("dataPedidos");
const pedidoFeedback = document.getElementById("pedido-feedback");

const feedbacks = {
  enviado: "Pedido enviado com sucesso.",
  nome_obrigatorio: "Indica o nome do anime antes de enviar.",
  nome_muito_longo: "O nome do anime é demasiado longo.",
  descricao_muito_longa: "O motivo é demasiado longo.",
  pedido_duplicado: "Esse anime já tem um pedido em análise ou aprovado.",
};

const params = new URLSearchParams(window.location.search);
const status = params.get("status");
if (pedidoFeedback && status) {
  pedidoFeedback.textContent = feedbacks[status] || "";
  pedidoFeedback.classList.toggle("is-error", status !== "enviado");
}

fetch("get-pedidos")
  .then((res) => res.json())
  .then((data) => {
    if (!Array.isArray(data) || data.length === 0) {
      dataPedidos.innerHTML = "<p class=\"empty-state\">Sem pedidos por agora.</p>";
      return;
    }

    data.forEach((item) => {
      const art = document.createElement("article");

      const h2 = document.createElement("h2");
      h2.textContent = item.Anime || "Sem nome";

      const p = document.createElement("p");
      p.textContent = item.Descricao || "Sem descrição";

      const span = document.createElement("span");
      const pedidoStatus = item.Status || "analisando...";
      span.textContent = pedidoStatus;
      span.classList.add(pedidoStatus.replace(/\.+$/, "").replace(/\s+/g, "-"));

      art.appendChild(h2);
      art.appendChild(p);
      art.appendChild(span);
      dataPedidos.appendChild(art);
    });
  })
  .catch(() => {
    dataPedidos.innerHTML = "<p class=\"empty-state\">Erro ao carregar pedidos.</p>";
  });
