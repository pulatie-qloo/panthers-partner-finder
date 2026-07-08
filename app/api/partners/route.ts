import { NextRequest, NextResponse } from "next/server";
import { getInsights, searchEntity, type QlooInsightEntity } from "@/lib/qloo";
import { DEFAULT_CANDIDATE_TYPES, type CandidateType } from "@/lib/constants";

export const runtime = "nodejs";

interface PartnersRequestBody {
  anchor?: string;
  candidateTypes?: CandidateType[];
  location?: string;
  ageRange?: string;
  take?: number;
}

export interface PartnerResult extends QlooInsightEntity {
  category: string;
}

export async function POST(req: NextRequest) {
  let body: PartnersRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const anchor = (body.anchor || "Discord").trim();
  const candidateTypes =
    body.candidateTypes && body.candidateTypes.length > 0
      ? body.candidateTypes
      : DEFAULT_CANDIDATE_TYPES;
  const location = body.location?.trim() || undefined;
  const ageRange = body.ageRange?.trim() || undefined;
  const take = Math.min(Math.max(body.take ?? 10, 1), 50);

  if (!process.env.QLOO_API_KEY) {
    return NextResponse.json(
      {
        error:
          "QLOO_API_KEY is not configured on the server. Add it to .env.local (see .env.local.example) and restart the dev server, or set it in your Vercel project's environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    // Resolve the anchor (e.g. "Discord") to a Qloo entity. Try scoping to
    // brand first since that's what Discord is; fall back to an unscoped
    // search if nothing matches.
    let anchorMatches = await searchEntity(anchor, ["urn:entity:brand"], 1);
    if (anchorMatches.length === 0) {
      anchorMatches = await searchEntity(anchor, undefined, 1);
    }
    const anchorEntity = anchorMatches[0];

    if (!anchorEntity) {
      return NextResponse.json(
        { error: `No Qloo entity found for "${anchor}". Try a different anchor brand.` },
        { status: 404 }
      );
    }

    const settled = await Promise.allSettled(
      candidateTypes.map((filterType) =>
        getInsights({
          filterType,
          interestEntityIds: [anchorEntity.entity_id],
          locationQuery: location,
          ageRange,
          take,
          explainability: true,
        }).then((entities) => ({ filterType, entities }))
      )
    );

    const results: PartnerResult[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      const category = candidateTypes[i];
      if (outcome.status === "fulfilled") {
        for (const entity of outcome.value.entities) {
          // Skip the anchor itself if it echoes back (e.g. searching brands near Discord).
          if (entity.entity_id === anchorEntity.entity_id) continue;
          results.push({ ...entity, category });
        }
      } else {
        warnings.push(
          `Category "${category}" failed: ${
            outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)
          }`
        );
      }
    }

    results.sort((a, b) => (b.query?.affinity ?? 0) - (a.query?.affinity ?? 0));

    return NextResponse.json({
      anchor: { name: anchorEntity.name, entity_id: anchorEntity.entity_id },
      location: location ?? null,
      ageRange: ageRange ?? null,
      results,
      warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling Qloo API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
