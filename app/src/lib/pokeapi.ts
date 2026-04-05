export interface PokemonBasicInfo {
  id: number;
  name: string;
  types: string[];
  spriteFront: string;
  spriteBack: string;
  cryUrl: string;
}

interface EvolutionStage {
  speciesId: number;
  name: string;
  minLevel: number | null;
}

const cache = new Map<number, PokemonBasicInfo>();

function spriteFrontUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
}

function spriteBackUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${id}.gif`;
}

function cryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

export async function getPokemon(id: number): Promise<PokemonBasicInfo> {
  const cached = cache.get(id);
  if (cached) return cached;

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

  const info: PokemonBasicInfo = {
    id: data.id,
    name: data.name,
    types: data.types.map((t: { type: { name: string } }) => t.type.name),
    spriteFront: spriteFrontUrl(data.id),
    spriteBack: spriteBackUrl(data.id),
    cryUrl: cryUrl(data.id),
  };

  cache.set(id, info);
  return info;
}

export async function getEvolutionChain(speciesId: number): Promise<EvolutionStage[]> {
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
  const speciesData = await speciesRes.json();

  const chainRes = await fetch(speciesData.evolution_chain.url);
  const chainData = await chainRes.json();

  const stages: EvolutionStage[] = [];

  function walk(node: { species: { name: string; url: string }; evolution_details: { min_level: number | null }[]; evolves_to: typeof node[] }) {
    const id = parseInt(node.species.url.split("/").filter(Boolean).pop()!, 10);
    const minLevel = node.evolution_details?.[0]?.min_level ?? null;
    stages.push({ speciesId: id, name: node.species.name, minLevel });
    for (const child of node.evolves_to) { walk(child); }
  }

  walk(chainData.chain);
  return stages;
}

export function randomWildPokemonId(): number {
  return Math.floor(Math.random() * 386) + 1;
}

export const STARTER_IDS = [1, 4, 7];

export async function preloadSprite(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}
