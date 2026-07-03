const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

export function setCache(chave, valor) {
  cache.set(chave, { valor, expira: Date.now() + CACHE_TTL });
}

export function getCache(chave) {
  const entry = cache.get(chave);
  if (!entry) return null;
  if (Date.now() > entry.expira) {
    cache.delete(chave);
    return null;
  }
  return entry.valor;
}

export function limparCache() {
  for (const [chave] of cache) {
    cache.delete(chave);
  }
}
