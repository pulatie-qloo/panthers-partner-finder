// Server-only client for the Qloo Taste AI API (https://docs.qloo.com).
// Never import this from a client component — it requires QLOO_API_KEY.
import "server-only";

const QLOO_API_BASE = process.env.QLOO_API_BASE || "https://api.qloo.com";

function apiKey(): string {
  const key = process.env.QLOO_API_KEY;
  if (!key) {
    throw new Error(
      "QLOO_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return key;
}

type QueryValue = string | number | boolean | string[] | undefined;

async function qlooGet<T>(path: string, params: Record<string, QueryValue>): Promise<T> {
  const url = new URL(path, QLOO_API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Qloo API ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 500)}`);
  }

  return res.json() as Promise<T>;
}

export interface QlooSearchResult {
  name: string;
  entity_id: string;
  types: string[];
  popularity?: number;
  properties?: Record<string, unknown>;
}

export async function searchEntity(
  query: string,
  types?: string[],
  take = 5
): Promise<QlooSearchResult[]> {
  const data = await qlooGet<{ results: QlooSearchResult[] }>("/search", {
    query,
    types,
    take,
  });
  return data.results ?? [];
}

export interface QlooInsightEntity {
  name: string;
  entity_id: string;
  type: string;
  subtype?: string;
  query?: {
    affinity?: number;
    explainability?: Record<string, unknown>;
  };
  properties?: {
    image?: { url?: string };
    description?: string;
    [key: string]: unknown;
  };
  tags?: { id: string; name: string; type?: string }[];
  popularity?: number;
}

export interface InsightsParams {
  filterType: string;
  interestEntityIds: string[];
  locationQuery?: string;
  ageRange?: string;
  audiences?: string[];
  tags?: string[];
  take?: number;
  explainability?: boolean;
}

export async function getInsights(params: InsightsParams): Promise<QlooInsightEntity[]> {
  const data = await qlooGet<{ results: { entities: QlooInsightEntity[] } }>(
    "/v2/insights",
    {
      "filter.type": params.filterType,
      "signal.interests.entities": params.interestEntityIds,
      "signal.location.query": params.locationQuery,
      "signal.demographics.age": params.ageRange,
      "signal.demographics.audiences": params.audiences,
      "signal.interests.tags": params.tags,
      "feature.explainability": params.explainability,
      take: params.take ?? 20,
    }
  );
  return data?.results?.entities ?? [];
}
