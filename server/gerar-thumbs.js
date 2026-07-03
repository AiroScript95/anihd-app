import "dotenv/config";
import { join, dirname, basename } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { promises as fs, existsSync, mkdirSync, readFileSync } from "fs";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { limparCache } from "./lib/cache.js";
import { criarPastaBanners } from "./lib/utils.js";

const config = JSON.parse(readFileSync("./config.json", "utf-8"));
const execFileAsync = promisify(execFile);
let videoPath = null;
if (existsSync(config.path)) {
  videoPath = config.path;
}

async function hasEmbeddedThumbnail(filePath) {
  const { stdout } = await execFileAsync(ffprobePath.path, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    filePath,
  ]);
  const { streams } = JSON.parse(stdout);
  return streams.some(
    (s) =>
      s.codec_type === "video" &&
      (s.disposition?.attached_pic === 1 ||
        s.codec_name === "mjpeg" ||
        s.codec_name === "png"),
  );
}

async function extractEmbeddedThumbnail(filePath, outputPath) {
  const hasThumb = await hasEmbeddedThumbnail(filePath);
  if (!hasThumb) return null;

  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  await execFileAsync(ffmpegPath, [
    "-y",
    "-i",
    filePath,
    "-an",
    "-vcodec",
    "copy",
    outputPath,
  ]);
  return outputPath;
}

async function generateFrameThumbnail(filePath, outputPath) {
  const { stdout } = await execFileAsync(ffprobePath.path, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    filePath,
  ]);
  const duracao = parseFloat(JSON.parse(stdout).format?.duration || "0");
  const seek = duracao > 0 ? Math.min(300, duracao * 0.3) : 5;

  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  await execFileAsync(ffmpegPath, [
    "-y",
    "-ss",
    String(seek),
    "-i",
    filePath,
    "-vframes",
    "1",
    "-vf",
    "scale=640x360",
    "-q:v",
    "5",
    outputPath,
  ]);
  return outputPath;
}

async function getThumbnail(filePath, outputPath) {
  const embedded = await extractEmbeddedThumbnail(filePath, outputPath);
  if (embedded) return "embedded";
  await generateFrameThumbnail(filePath, outputPath);
  return "frame";
}

async function recolherVideos(dir, prefixo = "") {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const videos = [];

  for (const item of items) {
    const caminhoCompleto = join(dir, item.name);
    const caminhoRelativo = prefixo ? `${prefixo}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const sub = await recolherVideos(caminhoCompleto, caminhoRelativo);
      videos.push(...sub);
    } else if (item.name.endsWith(".mp4") || item.name.endsWith(".mkv")) {
      videos.push({ filePath: caminhoCompleto, relativo: caminhoRelativo });
    }
  }

  return videos;
}

async function main() {
  await criarPastaBanners();
  if (!videoPath) {
    console.log("ERRO|Pasta de vídeos não foi encontrada ou foi removida.");
    process.exit(1);
  }
  console.log(`\nA ler videos em: ${videoPath}\n`);

  const todos = await recolherVideos(videoPath);
  const pendentes = todos.filter(({ relativo }) => {
    const thumbName = relativo.replace(/\.(mp4|mkv)$/i, ".webp");
    return !existsSync(join("thumbs", thumbName));
  });

  console.log(`TOTAL_VIDEOS|${todos.length}`);
  console.log(`TOTAL|${pendentes.length}`);

  if (pendentes.length === 0) {
    console.log("Nada para gerar. Tudo ja tem thumb.\n");
    limparCache();
    return;
  }

  let ok = 0;
  let erro = 0;

  for (const { filePath, relativo } of pendentes) {
    const thumbName = relativo.replace(/\.(mp4|mkv)$/i, ".webp");
    const thumbOutput = join("thumbs", thumbName);

    try {
      const source = await getThumbnail(filePath, thumbOutput);
      ok++;
      console.log(`PROGRESSO|${ok}|${basename(thumbName)}`);
      limparCache();
    } catch (err) {
      console.log(`ERRO|Pasta de vídeos não foi encontrada ou foi removida.`);
      break;
    }
  }

  console.log(`\nGeradas: ${ok}`);
  if (erro > 0) console.log(`Erros  : ${erro}`);
  console.log();
}

main();
