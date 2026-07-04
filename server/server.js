/* ===================[ IMPORTACOES DE BIBLIOTECAS (IMPORTS) ]======================= */
import "dotenv/config";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import sharp from "sharp";
import { promises as fs, readdirSync, existsSync, readFileSync } from "fs";
import os from "os";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

/* ===================[ IMPORTS LIBS (FUNCTIONS) ]======================= */
import { getCache, setCache, limparCache } from "./lib/cache.js";
import { adicionarThumbQueue } from "./lib/thumbs.js";
import { streamVideo } from "./lib/stream.js";
import { downloadVideo } from "./lib/download.js";
import { urlJoin, lerInfo, imgDefault } from "./lib/anime.js";
import { getLocalIP, salvarJson } from "./lib/utils.js";
import { getReleases } from "./lib/releases.js";
import { lerPedidos } from "./lib/pedidos.js";
// import { iniciarBanco, criarUsuario, listarUsuarios} from "./lib/users.js";

/* ===================[ VARIAVEIS (VARIABLES) ]======================= */
const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const config = JSON.parse(readFileSync("./config.json", "utf-8"));
const viewsPath = join(dirname(fileURLToPath(import.meta.url)), "views");
const bannersPath = join(dirname(fileURLToPath(import.meta.url)), "banners");
const videoPath = config.path;
const bannerCache = new Map();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(viewsPath));
app.use(express.static("public"));
app.use("/thumbs", express.static("thumbs"));
const db = await open({
  filename: "./database/database.db",
  driver: sqlite3.Database,
});
/* ===================[ CAMINHOS (ROUTER) ]======================= */
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: viewsPath });
});
app.get("/search", (req, res) => {
  res.sendFile("search.html", { root: viewsPath });
});
app.get("/catalog", (req, res) => {
  res.sendFile("catalog.html", { root: viewsPath });
});
app.get("/requests", (req, res) => {
  res.sendFile("requests.html", { root: viewsPath });
});
app.get("/feedback", async (req, res) => {
  const { nome, desc } = req.query;
  const resultado = await salvarJson(nome, desc);
  const status = resultado.ok ? "enviado" : resultado.codigo;
  res.redirect(`/requests?status=${encodeURIComponent(status)}`);
});
app.post("/feedback", async (req, res) => {
  const { nome, desc } = req.body;
  const resultado = await salvarJson(nome, desc);
  const status = resultado.ok ? "enviado" : resultado.codigo;
  res.redirect(`/requests?status=${encodeURIComponent(status)}`);
});
app.get("/anime/:nome", (req, res) => {
  res.sendFile("anime.html", { root: viewsPath });
});
app.get("/anime/:season/:nome", (req, res) => {
  res.sendFile("anime.html", { root: viewsPath });
});
app.get("/watch/:nome", (req, res) => {
  res.sendFile("player.html", { root: viewsPath });
});
app.get("/watch/:season/:nome", (req, res) => {
  res.sendFile("player.html", { root: viewsPath });
});
app.get("/releases", (req, res) => {
  res.sendFile("releases.html", { root: viewsPath });
});
app.get("/perfil", (req, res) => {
  res.sendFile("perfil.html", { root: viewsPath });
});
/* ===================[ APIS NODE ]======================= */
app.get("/get-pedidos", async (req, res) => {
  res.json(await lerPedidos("database/database.json"));
});
app.get("/videos", async (req, res) => {
  const chave = "videos:all";

  const cached = getCache(chave);
  if (cached) return res.json(cached);

  try {
    await fs.access(videoPath);
  } catch {
    return res.status(503).json({ erro: "HD não conectado" });
  }

  try {
    const items = await fs.readdir(videoPath, { withFileTypes: true });
    items.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    async function processarAnime(item) {
      if (!item.isDirectory()) return [];

      const videos = [];
      const nivel1Path = join(videoPath, item.name);
      const nivel1Items = await fs.readdir(nivel1Path, { withFileTypes: true });

      const imgFile = nivel1Items.find(
        (f) =>
          f.isFile() &&
          (f.name.endsWith(".png") ||
            f.name.endsWith(".jpg") ||
            f.name.endsWith(".webp")),
      );

      const { categorias } = await lerInfo(nivel1Path);

      nivel1Items.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );

      async function processarSeason(subItem) {
        if (subItem.isDirectory()) {
          const nivel2Path = join(nivel1Path, subItem.name);
          const nivel2Files = await fs.readdir(nivel2Path, {
            withFileTypes: true,
          });

          const { sinopse, status, year } = await lerInfo(
            nivel1Path,
            subItem.name,
          );

          const imgsubFile = nivel2Files.find(
            (f) =>
              f.isFile() &&
              (f.name.endsWith(".png") ||
                f.name.endsWith(".jpg") ||
                f.name.endsWith(".webp")),
          );

          const videoFiles = nivel2Files
            .filter((f) => f.name.endsWith(".mp4") || f.name.endsWith(".mkv"))
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true }),
            );

          const imgData = imgsubFile
            ? `/img/${item.name}/${subItem.name}`
            : imgDefault;

          if (videoFiles.length === 0) {
            // ← subpasta sem vídeos — gera card igualmente
            videos.push({
              img: imgData,
              anime: item.name,
              categoria: categorias,
              sinopse: sinopse,
              year: year,
              status: status,
              season: subItem.name,
              arquivo: null,
              caminho: null,
              semEpisodios: true,
            });
            return;
          }

          videoFiles.forEach((video) => {
            videos.push({
              img: imgData,
              anime: item.name,
              categoria: categorias,
              sinopse: sinopse,
              year: year,
              status: status,
              season: subItem.name,
              arquivo: video.name,
              caminho: urlJoin(item.name, subItem.name, video.name),
            });
          });
        } else if (
          subItem.name.endsWith(".mp4") ||
          subItem.name.endsWith(".mkv")
        ) {
          const { sinopse, status, year } = await lerInfo(nivel1Path);
          const imgRootData = imgFile ? `/img/${item.name}` : imgDefault;

          videos.push({
            img: imgRootData,
            anime: item.name,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: item.name,
            arquivo: subItem.name,
            caminho: urlJoin(item.name, subItem.name),
          });
        }
      }

      // ✅ todas as seasons do anime rodam em paralelo
      await Promise.all(nivel1Items.map(processarSeason));

      if (videos.length === 0) {
        const { sinopse, status, year } = await lerInfo(nivel1Path);
        return [
          {
            img: imgFile ? `/img/${item.name}` : imgDefault,
            anime: item.name,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: item.name,
            arquivo: null,
            caminho: null,
            semEpisodios: true,
          },
        ];
      }

      return videos;
    }

    const results = await Promise.all(items.map(processarAnime));
    const allVideos = results.flat();

    allVideos.sort((a, b) =>
      a.season.localeCompare(b.season, undefined, { numeric: true }),
    );

    const resposta = { total: allVideos.length, videos: allVideos };
    setCache(chave, resposta);
    res.json(resposta);
  } catch (error) {
    console.log("ERRO:", error.message);
    res
      .status(500)
      .json({ erro: "Erro ao ler a pasta", detalhes: error.message });
  }
});
app.get("/api/download/:anime/:season/:filename", (req, res) => {
  const { anime, season, filename } = req.params;
  downloadVideo(req, res, join(videoPath, anime, season, filename), filename);
});
app.get("/api/download/:anime/:filename", (req, res) => {
  const { anime, filename } = req.params;
  downloadVideo(req, res, join(videoPath, anime, filename), filename);
});
app.get("/stream/:anime/:season/:filename", (req, res) => {
  const { anime, season, filename } = req.params;
  streamVideo(req, res, join(videoPath, anime, season, filename));
});
app.get("/stream/:anime/:filename", (req, res) => {
  const { anime, filename } = req.params;
  streamVideo(req, res, join(videoPath, anime, filename));
});
app.get("/img/:anime/:season", async (req, res) => {
  const { anime, season } = req.params;
  const dir = join(videoPath, anime, season);
  try {
    const files = await fs.readdir(dir);
    const img = files.find((f) => /\.(png|jpg|webp)$/i.test(f));
    if (!img) return res.status(404).end();
    res.sendFile(join(dir, img));
  } catch {
    res.status(404).end();
  }
});
app.get("/img/:anime", async (req, res) => {
  const { anime } = req.params;
  const dir = join(videoPath, anime);
  try {
    const files = await fs.readdir(dir);
    const img = files.find((f) => /\.(png|jpg|webp)$/i.test(f));
    if (!img) return res.status(404).end();
    res.sendFile(join(dir, img));
  } catch {
    res.status(404).end();
  }
});
app.get("/api/anime/:nome", async (req, res) => {
  const { nome } = req.params;
  const caminhoAnime = join(videoPath, nome);
  const chave = `anime:${nome}`;
  const cached = getCache(chave);
  if (cached) return res.json(cached);

  try {
    await fs.access(caminhoAnime);

    const nivel1Items = await fs.readdir(caminhoAnime, { withFileTypes: true });
    nivel1Items.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const imgFile = nivel1Items.find(
      (f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name),
    );
    const { categorias } = await lerInfo(caminhoAnime);
    const videos = [];

    async function processarSeason(subItem) {
      if (subItem.isDirectory()) {
        // ── COM SEASON ──────────────────────────────────────────
        const nivel2Path = join(caminhoAnime, subItem.name);
        const nivel2Files = await fs.readdir(nivel2Path, {
          withFileTypes: true,
        });
        const { sinopse, status, year } = await lerInfo(
          caminhoAnime,
          subItem.name,
        );

        const imgsubFile = nivel2Files.find(
          (f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name),
        );
        const imgData = imgsubFile
          ? `/img/${nome}/${subItem.name}`
          : imgDefault;

        const videoFiles = nivel2Files
          .filter((f) => f.name.endsWith(".mp4") || f.name.endsWith(".mkv"))
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true }),
          );

        if (videoFiles.length === 0) {
          videos.push({
            img: imgData,
            anime: nome,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: subItem.name,
            arquivo: null,
            caminho: null,
            thumb: null,
            semEpisodios: true,
          });
          return;
        }

        videoFiles.forEach((video) => {
          const thumbName = video.name.replace(/\.(mp4|mkv)$/i, ".webp");
          const thumbOutput = join("thumbs", nome, subItem.name, thumbName);
          const thumbUrl = `/thumbs/${nome}/${subItem.name}/${thumbName}`;

          adicionarThumbQueue(join(nivel2Path, video.name), thumbOutput);

          videos.push({
            img: imgData,
            anime: nome,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: subItem.name,
            arquivo: video.name,
            thumb: existsSync(thumbOutput) ? thumbUrl : null,
            caminho: urlJoin(nome, subItem.name, video.name),
          });
        });
      } else if (
        subItem.name.endsWith(".mp4") ||
        subItem.name.endsWith(".mkv")
      ) {
        // ── SEM SEASON ──────────────────────────────────────────
        const { sinopse, status, year } = await lerInfo(caminhoAnime);

        const thumbName = subItem.name.replace(/\.(mp4|mkv)$/i, ".webp");
        const thumbOutput = join("thumbs", nome, thumbName);
        const thumbUrl = `/thumbs/${nome}/${thumbName}`;

        adicionarThumbQueue(join(caminhoAnime, subItem.name), thumbOutput);

        videos.push({
          img: imgFile ? `/img/${nome}` : imgDefault,
          anime: nome,
          categoria: categorias,
          sinopse: sinopse,
          year: year,
          status: status,
          season: "Temporada",
          arquivo: subItem.name,
          thumb: existsSync(thumbOutput) ? thumbUrl : null,
          caminho: urlJoin(nome, subItem.name),
        });
      }
    }

    await Promise.all(nivel1Items.map(processarSeason));

    if (videos.length === 0) {
      return res.status(404).json({ erro: "Nenhum vídeo encontrado" });
    }

    videos.sort((a, b) =>
      a.season.localeCompare(b.season, undefined, { numeric: true }),
    );
    const resposta = { anime: nome, videos };
    setCache(chave, resposta);
    res.json(resposta);
  } catch (error) {
    console.error("Erro na API:", error.message);
    res.status(404).json({ erro: "Anime não encontrado ou erro no disco" });
  }
});
app.get("/api/anime/:season/:nome", async (req, res) => {
  const { season, nome } = req.params;
  const caminhoSeason = join(videoPath, season);
  const caminhoAnime = join(videoPath, season, nome);
  const chave = `anime:${season}:${nome}`;
  const cached = getCache(chave);
  if (cached) return res.json(cached);

  try {
    await fs.access(caminhoAnime);

    const { categorias } = await lerInfo(caminhoSeason, nome);
    const nivel1Items = await fs.readdir(caminhoAnime, { withFileTypes: true });
    nivel1Items.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const imgFile = nivel1Items.find(
      (f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name),
    );
    const videos = [];

    async function processarSeason(subItem) {
      if (subItem.isDirectory()) {
        // ── COM SEASON ──────────────────────────────────────────
        const nivel2Path = join(caminhoAnime, subItem.name);
        const nivel2Files = await fs.readdir(nivel2Path, {
          withFileTypes: true,
        });
        const { sinopse, status, year } = await lerInfo(
          caminhoSeason,
          subItem.name,
        );

        const imgsubFile = nivel2Files.find(
          (f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name),
        );
        const imgData = imgsubFile
          ? `/img/${season}/${nome}/${subItem.name}`
          : imgDefault;

        const videoFiles = nivel2Files
          .filter((f) => f.name.endsWith(".mp4") || f.name.endsWith(".mkv"))
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true }),
          );

        if (videoFiles.length === 0) {
          videos.push({
            img: imgData,
            anime: nome,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: subItem.name,
            arquivo: null,
            caminho: null,
            thumb: null,
            semEpisodios: true,
          });
          return;
        }

        videoFiles.forEach((video) => {
          const thumbName = video.name.replace(/\.(mp4|mkv)$/i, ".webp");
          const thumbOutput = join(
            "thumbs",
            season,
            nome,
            subItem.name,
            thumbName,
          );
          const thumbUrl = `/thumbs/${season}/${nome}/${subItem.name}/${thumbName}`;

          adicionarThumbQueue(join(nivel2Path, video.name), thumbOutput);

          videos.push({
            img: imgData,
            anime: nome,
            categoria: categorias,
            sinopse: sinopse,
            year: year,
            status: status,
            season: subItem.name,
            arquivo: video.name,
            thumb: existsSync(thumbOutput) ? thumbUrl : null,
            caminho: urlJoin(season, nome, subItem.name, video.name),
          });
        });
      } else if (
        subItem.name.endsWith(".mp4") ||
        subItem.name.endsWith(".mkv")
      ) {
        // ── SEM SEASON ──────────────────────────────────────────
        const { sinopse, status, year } = await lerInfo(caminhoSeason, nome);

        const thumbName = subItem.name.replace(/\.(mp4|mkv)$/i, ".webp");
        const thumbOutput = join("thumbs", season, nome, thumbName);
        const thumbUrl = `/thumbs/${season}/${nome}/${thumbName}`;

        adicionarThumbQueue(join(caminhoAnime, subItem.name), thumbOutput);

        videos.push({
          img: imgFile ? `/img/${season}/${nome}` : imgDefault,
          anime: nome,
          categoria: categorias,
          sinopse: sinopse,
          year: year,
          status: status,
          season: "Temporada",
          arquivo: subItem.name,
          thumb: existsSync(thumbOutput) ? thumbUrl : null,
          caminho: urlJoin(season, nome, subItem.name),
        });
      }
    }

    await Promise.all(nivel1Items.map(processarSeason));

    if (videos.length === 0) {
      return res.status(404).json({ erro: "Nenhum vídeo encontrado" });
    }

    videos.sort((a, b) =>
      a.season.localeCompare(b.season, undefined, { numeric: true }),
    );
    const resposta = { season, anime: nome, videos };
    setCache(chave, resposta);
    res.json(resposta);
  } catch (error) {
    console.error("Erro na API:", error.message);
    res.status(404).json({ erro: "Anime não encontrado ou erro no disco" });
  }
});
app.get("/api/releases", async (req, res) => {
  const cached = getCache("releases");
  if (cached) return res.json(cached);

  try {
    await fs.access(videoPath);
  } catch {
    return res.status(503).json({ erro: "HD não conectado" });
  }

  try {
    const releases = await getReleases(videoPath);
    setCache("releases", releases);
    res.json(releases);
  } catch (err) {
    console.error("ERRO releases:", err);
    res.status(500).json({ erro: err.message });
  }
});
app.get("/api/banners", (req, res) => {
  const arquivos = readdirSync(bannersPath).filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f),
  );

  // Fisher-Yates
  for (let i = arquivos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arquivos[i], arquivos[j]] = [arquivos[j], arquivos[i]];
  }

  res.json(arquivos.map((f) => `/banner/${f}`));
});
app.get("/banner/:filename", async (req, res) => {
  const width = parseInt(req.query.w) || 1280;
  const chave = `${req.params.filename}-${width}`;

  if (bannerCache.has(chave)) {
    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=86400");
    return res.send(bannerCache.get(chave));
  }
  const filePath = join(bannersPath, req.params.filename);

  try {
    const buffer = await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    bannerCache.set(chave, buffer);
    res.set("Content-Type", "image/webp");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err) {
    console.log("ERRO BANNER:", err.message);
    res.status(500).json({ erro: err.message });
  }
});
app.get("/api/config", (req, res) => {
  res.json({
    titulo: config.titulo,
    desc: config.desc,
  });
});
app.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  const hostname = os.hostname();

  if (process.env.ELECTRON_RUN_AS_NODE) {
    console.log(`[AniHD] Servidor online`);
    console.log(`[AniHD] http://localhost:${PORT}`);
    console.log(`[AniHD] http://${localIP}:${PORT}`);
    return;
  }
  const linhas = [
    { label: "▶  Server", valor: `http://localhost:${PORT}` },
    { label: "📱 Mobile", valor: `http://${localIP}:${PORT}` },
    { label: "🌐 Local ", valor: `http://${hostname}:${PORT}` },
    { label: "📁 HD    ", valor: videoPath },
    { label: "✔  Online", valor: new Date().toLocaleTimeString() },
  ];

  const maxLabel = Math.max(...linhas.map((l) => l.label.length));
  const maxValor = Math.max(...linhas.map((l) => l.valor.length));
  const inner = maxLabel + maxValor + 7; // "  │  " = 5 + 2 espaços laterais

  const topo = "╭" + "─".repeat(inner + 2) + "╮";
  const fundo = "╰" + "─".repeat(inner + 2) + "╯";
  const separador = "├" + "─".repeat(inner + 2) + "┤";

  const cor = chalk.hex("#363e4f").bold;
  const corLabel = chalk.hex("#b0c0cc");
  const corValor = chalk.hex("#f6f2ef");
  const corSep = chalk.hex("#4a5568");
  const corOnline = chalk.hex("#27ae60");

  const formatarLinha = ({ label, valor }) => {
    const isOnline = label.includes("✔");
    const conteudo =
      corLabel(label.padEnd(maxLabel)) +
      corSep("  │  ") +
      (isOnline ? corOnline : corValor)(valor);

    // padding para alinhar a barra direita
    const tamanhoVisivel = label.length + 5 + valor.length; // 5 = "  │  "
    const pad = inner - tamanhoVisivel;

    return cor("│") + " " + conteudo + " ".repeat(pad) + " " + cor("│");
  };

  console.log(cor(topo));
  linhas.forEach((l, i) => {
    console.log(formatarLinha(l));
    if (i === linhas.length - 2) console.log(cor(separador)); // separador antes do Online
  });
  console.log(cor(fundo));
  console.log();
  console.log("  " + corLabel.bold(config.titulo));
  console.log("  " + chalk.hex("#8ea39d")("Streaming pessoal · HD Quality"));
  console.log();
});
