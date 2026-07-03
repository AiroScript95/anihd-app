import { join} from "path";
import { promises as fs, existsSync, readFileSync } from "fs";

const config = JSON.parse(readFileSync("./config.json", "utf-8"));
let videoPath = null;
if (existsSync(config.path)) {
  videoPath = config.path;
}
const infoJson = {
  categorias: ["Geral"],
  sinopse: "?",
  status: "download",
  year: "0000",
  seasons: {
    "name season": {
      sinopse: "?",
      status: "download",
      year: "0000",
    },
  },
};

async function criarInfoJson(router) {
  try {
    const item = await fs.readdir(router, { withFileTypes: true });
    item.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    const pastas = item.filter((i) => i.isDirectory());
    for (const pasta of pastas) {
      const destino = join(router, pasta.name, "info.json");
      if (!existsSync(destino)) {
        await new Promise((r) => setTimeout(r, 1500));
        console.log(`ALERT-INFO|Gerando info.json na pasta ${pasta.name}`);
        await fs.writeFile(destino, JSON.stringify(infoJson, null, 2), "utf-8");
      }else {
        await new Promise((r) => setTimeout(r, 1500));
        console.log(`ALERT-INFO|A pasta ${pasta.name} ja possui um info.json`);
      }
    }
  } catch {
    console.log("Erro| rota nao existe");
  }
}
if (videoPath) criarInfoJson(videoPath);
