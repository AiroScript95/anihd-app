import { join } from "path";
import { promises as fs, statSync, existsSync } from "fs";
import { lerInfo, urlJoin, imgDefault } from "./anime.js";

const LIMITE = 70; // máximo de resultados

async function percorrerAnime(videoPath, nomeAnime) {
  const resultados = [];
  const caminhoAnime = join(videoPath, nomeAnime);
  const nivel1 = await fs.readdir(caminhoAnime, { withFileTypes: true });

  const imgFile = nivel1.find((f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name));

  for (const subItem of nivel1) {
    if (subItem.isDirectory()) {
      // ── COM SEASON ──────────────────────────────────────────
      const caminhoSeason = join(caminhoAnime, subItem.name);
      const nivel2 = await fs.readdir(caminhoSeason, { withFileTypes: true });

      const imgsubFile = nivel2.find((f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name));
      const img = imgsubFile ? `/img/${nomeAnime}/${subItem.name}` : (imgFile ? `/img/${nomeAnime}` : imgDefault);

      const { status } = await lerInfo(caminhoAnime, subItem.name);

      const videoFiles = nivel2.filter(
        (f) => f.isFile() && (f.name.endsWith(".mp4") || f.name.endsWith(".mkv")),
      );

      for (const video of videoFiles) {
        const filePath = join(caminhoSeason, video.name);
        const stat = statSync(filePath);
        const thumbName = video.name.replace(/\.(mp4|mkv)$/i, ".webp");
        const thumbOutput = join("thumbs", nomeAnime, subItem.name, thumbName);
        const thumbUrl = `/thumbs/${nomeAnime}/${subItem.name}/${thumbName}`;

        resultados.push({
          anime: nomeAnime,
          season: subItem.name,
          arquivo: video.name,
          caminho: urlJoin(nomeAnime, subItem.name, video.name),
          img,
          thumb: existsSync(thumbOutput) ? thumbUrl : null,
          status,
          adicionado: stat.mtimeMs,
        });
      }
    } else if (subItem.name.endsWith(".mp4") || subItem.name.endsWith(".mkv")) {
      // ── SEM SEASON ──────────────────────────────────────────
      const filePath = join(caminhoAnime, subItem.name);
      const stat = statSync(filePath);
      const { status } = await lerInfo(caminhoAnime);
      const thumbName = subItem.name.replace(/\.(mp4|mkv)$/i, ".webp");
      const thumbOutput = join("thumbs", nomeAnime, thumbName);
      const thumbUrl = `/thumbs/${nomeAnime}/${thumbName}`;

      resultados.push({
        anime: nomeAnime,
        season: nomeAnime,
        arquivo: subItem.name,
        caminho: urlJoin(nomeAnime, subItem.name),
        img: imgFile ? `/img/${nomeAnime}` : imgDefault,
        thumb: existsSync(thumbOutput) ? thumbUrl : null,
        status,
        adicionado: stat.mtimeMs,
      });
    }
  }

  return resultados;
}
async function percorrerSeason(videoPath, nomeSeason) {
  const resultados = [];
  const caminhoSeason = join(videoPath, nomeSeason);
  const nivel1 = await fs.readdir(caminhoSeason, { withFileTypes: true });

  for (const subItem of nivel1) {
    if (!subItem.isDirectory()) continue;

    const caminhoAnime = join(caminhoSeason, subItem.name);
    const nivel2 = await fs.readdir(caminhoAnime, { withFileTypes: true });

    const imgFile = nivel2.find((f) => f.isFile() && /\.(png|jpg|webp)$/i.test(f.name));
    const { status } = await lerInfo(caminhoSeason, subItem.name);

    const videoFiles = nivel2.filter(
      (f) => f.isFile() && (f.name.endsWith(".mp4") || f.name.endsWith(".mkv")),
    );

    for (const video of videoFiles) {
      const filePath = join(caminhoAnime, video.name);
      const stat = statSync(filePath);
      const thumbName = video.name.replace(/\.(mp4|mkv)$/i, ".webp");
      const thumbOutput = join("thumbs", nomeSeason, subItem.name, thumbName);
      const thumbUrl = `/thumbs/${nomeSeason}/${subItem.name}/${thumbName}`;

      resultados.push({
        anime: subItem.name,
        season: subItem.name,
        arquivo: video.name,
        caminho: urlJoin(nomeSeason, subItem.name, video.name),
        img: imgFile ? `/img/${nomeSeason}/${subItem.name}` : imgDefault,
        thumb: existsSync(thumbOutput) ? thumbUrl : null,
        status,
        adicionado: stat.mtimeMs,
      });
    }
  }

  return resultados;
}
export async function getReleases(videoPath) {
  const items = await fs.readdir(videoPath, { withFileTypes: true });
  const todos = [];

  await Promise.all(
    items.map(async (item) => {
      if (!item.isDirectory()) return;

      const nivel1 = await fs.readdir(join(videoPath, item.name), { withFileTypes: true });

      const temVideoRaiz = nivel1.some(
        (f) => f.isFile() && (f.name.endsWith(".mp4") || f.name.endsWith(".mkv"))
      );

      const subpastas = nivel1.filter((f) => f.isDirectory());

      // verifica se alguma subpasta tem vídeos (= season de anime)
      let temVideoNasSubpastas = false;
      for (const sub of subpastas) {
        const nivel2 = await fs.readdir(join(videoPath, item.name, sub.name), { withFileTypes: true });
        if (nivel2.some((f) => f.isFile() && (f.name.endsWith(".mp4") || f.name.endsWith(".mkv")))) {
          temVideoNasSubpastas = true;
          break;
        }
      }

      if (temVideoRaiz || temVideoNasSubpastas) {
        // Anime A ou Anime B
        const resultados = await percorrerAnime(videoPath, item.name);
        todos.push(...resultados);
      } else {
        // Filmes/ — pasta de Season
        const resultados = await percorrerSeason(videoPath, item.name);
        todos.push(...resultados);
      }
    }),
  );

  return todos
    .sort((a, b) => b.adicionado - a.adicionado)
    .slice(0, LIMITE);
}
