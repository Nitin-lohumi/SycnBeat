import type { TrackSource } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { TtlCache } from "../../utils/ttlCache";
import { jamendoProvider } from "./jamendo_provider";
import type { MusicProvider, TrackPage } from "./types";

// To switch or add an API: write a provider file and register it here.
const providers: Partial<Record<TrackSource, MusicProvider>> = {
  JAMENDO: jamendoProvider,
};

const searchProvider = jamendoProvider;

export function getProvider(source: TrackSource) {
  const provider = providers[source];
  if (!provider) throw new AppError(400, `Unsupported track source: ${source}`);
  return provider;
}

const searchCache = new TtlCache<TrackPage>(10 * 60_000, 500);

export async function searchTracks(q: string, limit: number, offset: number) {
  const key = `${searchProvider.source}|${q.toLowerCase()}|${limit}|${offset}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const page = await searchProvider.search({ q, limit, offset });
  if (page.tracks.length) searchCache.set(key, page);
  return page;
}

export function resolveStreamUrl(source: TrackSource, sourceId: string) {
  return getProvider(source).resolveStream(sourceId);
}

export * from "./types";
