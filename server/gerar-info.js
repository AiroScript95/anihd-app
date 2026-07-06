import { join } from "path";
import { promises as fs, existsSync, readFileSync } from "fs";

const config = JSON.parse(readFileSync("./config.json", "utf-8"));
let videoPath = null;
if (existsSync(config.path)) {
  videoPath = config.path;
}
async function criarInfoJson(router) {
  try {
    const item = await fs.readdir(router, { withFileTypes: true });
    item.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    const pastas = item.filter((i) => i.isDirectory());

    for (const pasta of pastas) {
      const pastaPath = join(router, pasta.name);
      const destino = join(pastaPath, "info.json");

      if (!existsSync(destino)) {
        const subItens = await fs.readdir(pastaPath, { withFileTypes: true });
        const seasons = subItens.filter((s) => s.isDirectory());

        let infoJsonFinal;

        if (seasons.length > 0) {
          const seasonsObj = {};
          for (const season of seasons) {
            seasonsObj[season.name] = {
              sinopse: "sem sinopse",
              status: "download",
              year: "0000",
            };
          }

          infoJsonFinal = {
            categorias: ["Geral", "", ""],
            seasons: seasonsObj,
          };
        } else {
          infoJsonFinal = {
            categorias: ["Geral", "", ""],
            sinopse: "sem sinopse",
            status: "download",
            year: "0000",
          };
        }

        await new Promise((r) => setTimeout(r, 1500));
        console.log(`ALERT-INFO|Gerando info.json na pasta ${pasta.name}`);
        await fs.writeFile(
          destino,
          JSON.stringify(infoJsonFinal, null, 2),
          "utf-8",
        );
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        console.log(`ALERT-INFO|A pasta ${pasta.name} ja possui um info.json`);
      }
    }
  } catch {
    console.log("Erro| rota nao existe");
  }
}
if (videoPath) criarInfoJson(videoPath);
