"use client";

import { useState, type FormEvent } from "react";
import {
  AGE_RANGES,
  CANDIDATE_TYPES,
  DEFAULT_AGE_RANGE,
  DEFAULT_ANCHOR,
  DEFAULT_CANDIDATE_TYPES,
  DEFAULT_LOCATION,
  DEFAULT_TAKE,
  type CandidateType,
} from "@/lib/constants";
import type { PartnerResult } from "@/app/api/partners/route";

interface PartnersResponse {
  anchor: { name: string; entity_id: string };
  location: string | null;
  ageRange: string | null;
  results: PartnerResult[];
  warnings: string[];
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CANDIDATE_TYPES.map((c) => [c.value, c.label])
);

function categoryLabel(type: string): string {
  return CATEGORY_LABELS[type] ?? type.replace("urn:entity:", "");
}

export default function Home() {
  const [anchor, setAnchor] = useState(DEFAULT_ANCHOR);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [ageRange, setAgeRange] = useState(DEFAULT_AGE_RANGE);
  const [take, setTake] = useState(DEFAULT_TAKE);
  const [candidateTypes, setCandidateTypes] = useState<CandidateType[]>(
    DEFAULT_CANDIDATE_TYPES
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PartnersResponse | null>(null);

  function toggleType(type: CandidateType) {
    setCandidateTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchor,
          location,
          ageRange,
          take,
          candidateTypes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-5xl px-6 py-10 sm:px-10">
        <header className="mb-10 border-b border-neutral-800 pb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">
            Carolina Panthers · Partnerships
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Discord-Audience Partner Finder
          </h1>
          <p className="mt-3 max-w-3xl text-neutral-400">
            Qloo doesn&apos;t model NFL teams directly, so this tool anchors on Discord&apos;s
            taste profile — plus the Carolinas market and a younger demographic skew — and
            ranks other brands, games, shows, and podcasts by cultural affinity to that
            audience. Use it to build a sponsorship / co-marketing shortlist, not as a final
            answer.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-10 grid grid-cols-1 gap-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Anchor brand
            </label>
            <input
              type="text"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              placeholder="Discord"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              The Qloo entity whose audience taste profile drives the recommendations.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Market bias (location)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              placeholder="Charlotte, NC"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Leave blank for a national/global result set instead of the Carolinas.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Age skew
            </label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
            >
              {AGE_RANGES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Results per category
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={take}
              onChange={(e) => setTake(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Candidate categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CANDIDATE_TYPES.map((c) => {
                const active = candidateTypes.includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => toggleType(c.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-sky-500 bg-sky-500/10 text-sky-300"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading || candidateTypes.length === 0}
              className="w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Searching Qloo…" : "Find Partners"}
            </button>
            {candidateTypes.length === 0 && (
              <p className="mt-2 text-xs text-red-400">Select at least one category.</p>
            )}
          </div>
        </form>

        {error && (
          <div className="mb-8 rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-300">
            <p className="font-semibold">Request failed</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {data && (
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
              <span>
                Anchor: <span className="font-medium text-white">{data.anchor.name}</span>
              </span>
              {data.location && (
                <span>
                  Market: <span className="font-medium text-white">{data.location}</span>
                </span>
              )}
              {data.ageRange && (
                <span>
                  Age skew:{" "}
                  <span className="font-medium text-white">
                    {AGE_RANGES.find((a) => a.value === data.ageRange)?.label ?? data.ageRange}
                  </span>
                </span>
              )}
              <span>
                <span className="font-medium text-white">{data.results.length}</span> candidates
              </span>
            </div>

            {data.warnings.length > 0 && (
              <div className="mb-6 rounded-lg border border-amber-900 bg-amber-950/40 p-4 text-sm text-amber-300">
                {data.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}

            {data.results.length === 0 ? (
              <p className="text-neutral-400">
                No candidates came back for this combination. Try widening the market, removing
                the age skew, or adding more categories.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.results.map((entity) => {
                  const affinity = entity.query?.affinity ?? 0;
                  const image = entity.properties?.image?.url;
                  return (
                    <li
                      key={`${entity.category}-${entity.entity_id}`}
                      className="flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50"
                    >
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={entity.name}
                          className="h-36 w-full object-cover"
                        />
                      )}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white">{entity.name}</h3>
                          <span className="shrink-0 rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-400">
                            {categoryLabel(entity.category)}
                          </span>
                        </div>

                        {entity.properties?.description && (
                          <p className="mb-3 line-clamp-2 text-xs text-neutral-500">
                            {String(entity.properties.description)}
                          </p>
                        )}

                        <div className="mt-auto">
                          <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                            <span>Affinity to {data.anchor.name}</span>
                            <span className="font-medium text-sky-400">
                              {Math.round(affinity * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                            <div
                              className="h-full rounded-full bg-sky-500"
                              style={{ width: `${Math.min(Math.round(affinity * 100), 100)}%` }}
                            />
                          </div>

                          {entity.tags && entity.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {entity.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {!data && !error && !loading && (
          <p className="text-sm text-neutral-500">
            Set your filters above and run a search to generate a partner shortlist.
          </p>
        )}
      </div>
    </div>
  );
}
