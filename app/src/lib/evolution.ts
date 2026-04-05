import { getEvolutionChain } from "./pokeapi";

interface EvolutionCheck {
  shouldEvolve: boolean;
  evolvesToId: number | null;
  evolvesToName: string | null;
}

// Cache evolution chains so we don't re-fetch
const chainCache = new Map<number, Awaited<ReturnType<typeof getEvolutionChain>>>();

export async function checkEvolution(pokeapiId: number, newLevel: number): Promise<EvolutionCheck> {
  let chain = chainCache.get(pokeapiId);
  if (!chain) {
    chain = await getEvolutionChain(pokeapiId);
    // Cache for all species in the chain
    for (const stage of chain) {
      chainCache.set(stage.speciesId, chain);
    }
  }

  // Find current stage
  const currentIdx = chain.findIndex((s) => s.speciesId === pokeapiId);
  if (currentIdx === -1 || currentIdx >= chain.length - 1) {
    return { shouldEvolve: false, evolvesToId: null, evolvesToName: null };
  }

  const nextStage = chain[currentIdx + 1]!;
  if (nextStage && nextStage.minLevel !== null && newLevel >= nextStage.minLevel) {
    return {
      shouldEvolve: true,
      evolvesToId: nextStage.speciesId,
      evolvesToName: nextStage.name,
    };
  }

  return { shouldEvolve: false, evolvesToId: null, evolvesToName: null };
}
