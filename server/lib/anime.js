import { join } from "path";
import { promises as fs } from "fs";

const imgDefault = "/assets/icons/device-tv.svg";

export function urlJoin(...parts) {
  return parts.join("/").replace(/\\/g, "/");
}

export async function lerInfo(dirPath, season = null) {
  const defaults = {
    categorias: ["Geral"],
    sinopse: "sem sinopse no momento",
    status: "download",
    year: "0000",
  };
  try {
    const raw = await fs.readFile(join(dirPath, "info.json"), "utf-8");
    const json = JSON.parse(raw);

    const categorias = json.categorias ?? defaults.categorias;
    const sinopse = json.sinopse ?? defaults.sinopse;
    const status = json.status ?? defaults.status;
    const year = json.year ?? defaults.year;

    if (season && json.seasons?.[season]) {
      const s = json.seasons[season];
      return {
        categorias: s.categorias ?? categorias,
        sinopse: s.sinopse ?? sinopse,
        status: s.status ?? defaults.status,
        year: s.year ?? defaults.year,
      };
    }
    return { categorias, sinopse, status, year };
  } catch {
    return defaults;
  }
}

export { imgDefault };
