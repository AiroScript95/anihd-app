import { createReadStream, statSync, existsSync } from "fs";
import { extname } from "path";

const downloadsPorIP = {};
const maxDownloadsPorIP = 2;
const maxDownloadsTotal = 6;
let downloadsAtivos = 0;

const tipos = {
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
};

export function downloadVideo(req, res, filePath, filename) {
  const ip = req.ip;
  const ativosPorIP = downloadsPorIP[ip] || 0;

  if (ativosPorIP >= maxDownloadsPorIP) {
    return res.status(503).json({ erro: "Limite de downloads por utilizador atingido" });
  }

  if (downloadsAtivos >= maxDownloadsTotal) {
    return res.status(503).json({ erro: "Servidor ocupado, tenta mais tarde" });
  }

  if (!existsSync(filePath)) {
    return res.status(404).json({ erro: "Ficheiro não encontrado" });
  }

  downloadsPorIP[ip] = ativosPorIP + 1;
  downloadsAtivos++;

  const stat = statSync(filePath);
  const ext = extname(filename).toLowerCase();

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Type", tipos[ext] || "application/octet-stream");

  const stream = createReadStream(filePath, {
    highWaterMark: 6 * 1024 * 1024,
  });

  stream.on("error", (err) => {
    downloadsPorIP[ip]--;
    downloadsAtivos--;
    if (downloadsPorIP[ip] <= 0) delete downloadsPorIP[ip];
    console.error("Erro no stream:", err);
    res.status(500).end();
  });

  res.on("close", () => {
    downloadsPorIP[ip]--;
    downloadsAtivos--;
    if (downloadsPorIP[ip] <= 0) delete downloadsPorIP[ip];
  });

  stream.pipe(res);
}
