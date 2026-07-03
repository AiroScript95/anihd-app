import { createReadStream, statSync } from "fs";

function getMimeType(filename) {
  if (filename.endsWith(".mkv")) return "video/x-matroska";
  return "video/mp4";
}

export function streamVideo(req, res, filePath) {
  try {
    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": getMimeType(filePath),
      });

      createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });

      createReadStream(filePath).pipe(res);
    }
  } catch {
    res.status(404).json({ erro: "Ficheiro não encontrado" });
  }
}
