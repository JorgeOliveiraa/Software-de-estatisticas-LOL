const BASE = 'https://ddragon.leagueoflegends.com';

export type Champion = {
  id: string; // ex.: "Zed", "MonkeyKing" (usado nas URLs de imagem)
  name: string; // ex.: "Zed", "Wukong"
  title: string;
  tags: string[];
};

export type ChampionData = {
  version: string;
  champions: Champion[];
};

async function fetchJson(url: string, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Busca a versão mais recente e a lista de campeões no Data Dragon. */
export async function fetchChampionsFromNetwork(): Promise<ChampionData> {
  const versions: string[] = await fetchJson(`${BASE}/api/versions.json`);
  const version = versions[0];
  const json = await fetchJson(`${BASE}/cdn/${version}/data/pt_BR/champion.json`);

  const champions: Champion[] = Object.values<any>(json.data).map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    tags: c.tags ?? [],
  }));

  return { version, champions };
}

export function portraitUrl(version: string, championId: string) {
  return `${BASE}/cdn/${version}/img/champion/${championId}.png`;
}

export function splashUrl(championId: string) {
  return `${BASE}/cdn/img/champion/splash/${championId}_0.jpg`;
}

export function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Favoritos primeiro; dentro de cada grupo, ordem alfabética (A–Z). */
export function sortChampions(list: Champion[], favorites: Set<string>) {
  return [...list].sort((a, b) => {
    const fa = favorites.has(a.id) ? 0 : 1;
    const fb = favorites.has(b.id) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  });
}