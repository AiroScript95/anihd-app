import { dirname } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import sharp from "sharp";
import { promises as fs } from "fs";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { limparCache } from "./cache.js";

const execFileAsync = promisify(execFile);

async function hasEmbeddedThumbnail(videoPath) {
  const { stdout } = await execFileAsync(ffprobePath.path, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    videoPath,
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

async function extractEmbeddedThumbnail(videoPath, outputPath) {
  const hasThumb = await hasEmbeddedThumbnail(videoPath);
  if (!hasThumb) return null;

  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  await execFileAsync(
    ffmpegPath,
    ["-y", "-i", videoPath, "-an", "-vcodec", "copy", outputPath],
    { maxBuffer: 1024 * 1024 },
  );
  return outputPath;
}

async function generateFrameThumbnail(videoPath, outputPath, options = {}) {
  const { seconds = 5, size = "800x450" } = options;

  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const { stdout } = await execFileAsync(ffprobePath.path, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    videoPath,
  ]);

  const duracao = parseFloat(JSON.parse(stdout).format?.duration || "0");
  const seek = duracao > 0 ? Math.min(seconds, duracao * 0.3) : seconds;

  const tempPath = outputPath + ".tmp.jpg";

  await execFileAsync(
    ffmpegPath,
    [
      "-y",
      "-ss",
      String(seek),
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-vf",
      `scale=${size}`,
      "-q:v",
      "2",
      tempPath,
    ],
    { maxBuffer: 1024 * 1024 },
  );

  await sharp(tempPath).webp({ quality: 80 }).toFile(outputPath);

  await fs.unlink(tempPath).catch(() => {});
  return outputPath;
}

async function getThumbnail(videoPath, outputPath, options = {}) {
  const embedded = await extractEmbeddedThumbnail(videoPath, outputPath);
  if (embedded) return { path: embedded, source: "embedded" };

  const frame = await generateFrameThumbnail(videoPath, outputPath, options);
  return { path: frame, source: "frame" };
}

const thumbQueue = [];
let thumbWorkerRunning = false;

export function adicionarThumbQueue(videoFilePath, thumbOutput) {
  if (existsSync(thumbOutput)) return;
  if (thumbQueue.some((t) => t.thumbOutput === thumbOutput)) return;

  thumbQueue.push({ videoFilePath, thumbOutput });
  processarFila();
}

async function processarFila() {
  if (thumbWorkerRunning) return;
  thumbWorkerRunning = true;

  while (thumbQueue.length > 0) {
    const { videoFilePath, thumbOutput } = thumbQueue.shift();
    try {
      await getThumbnail(videoFilePath, thumbOutput, {
        seconds: 260,
        size: "640x360",
      });
      console.log(`Thumb gerada: ${thumbOutput}`);
      limparCache();
    } catch (err) {
      console.log(`Erro thumb: ${err.message}`);
    }
  }
  thumbWorkerRunning = false;
}
