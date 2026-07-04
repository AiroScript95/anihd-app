import os from "os";
import { access, mkdir } from "fs/promises";
import { join } from "path";
import { adicionarPedido } from "./pedidos.js";

export async function criarPastaBanners() {
  const bannersPath = join(process.cwd(), "banners");

  try {
    await access(bannersPath);
    console.log('A pasta "banners" já existe.');
  } catch (error) {
    if (error.code === "ENOENT") {
      await mkdir(bannersPath, { recursive: true });
      console.log('Pasta "banners" criada com sucesso!');
    } else {
      console.error("Erro inesperado:", error);
    }
  }
}
export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

export async function salvarJson(nome, desc) {
  return adicionarPedido("database/database.json", { nome, desc });
}
