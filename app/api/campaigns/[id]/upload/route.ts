import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { redirect } from "next/navigation";

type Weights = {
  niche_match?: number;
  domain_rating?: number;
  traffic?: number;
  price_efficiency?: number;
  ranking_bonus?: number;
  geo_match?: number;
  no_red_flags?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { error: "Please choose a CSV file before uploading." },
      { status: 400 }
    );
  }

  const text = await file.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      { error: "CSV parse error", details: parsed.errors },
      { status: 400 }
    );
  }

  const rows = parsed.data;

  const config = await prisma.scoringConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!config) {
    return Response.json({ error: "No active scoring config" }, { status: 500 });
  }

  const weights = config.weightsJson as Weights;

  for (const row of rows) {
    const dr = Number(row.dr || row.DR || 0);
    const traffic = Number(row.traffic || row.Traffic || 0);
    const price = Number(row.price || row.Price || 0);
    const ranking = String(row.ranking || row.Ranking || "").toLowerCase();
    const linkType = String(row.link_type || row.linkType || "").toLowerCase();
    const redFlags = String(row.red_flags || row.redFlags || "").trim();

    let disqualified = false;
    let disqualificationReason = "";

    if (dr < campaign.minDr) {
      disqualified = true;
      disqualificationReason = "DR below minimum";
    }

    if (traffic < campaign.minTraffic) {
      disqualified = true;
      disqualificationReason = "Traffic below minimum";
    }

    if (
      campaign.followPreference === "dofollow_only" &&
      linkType !== "dofollow"
    ) {
      disqualified = true;
      disqualificationReason = "Client requires dofollow link";
    }

    if (["poor", "bad"].includes(ranking)) {
      disqualified = true;
      disqualificationReason = "Ranking marked Poor or Bad";
    }

    const nicheScore = getNicheScore(campaign.clientNiche, row, weights.niche_match ?? 40);

    const drScore = Math.min(
      weights.domain_rating ?? weights.dr ?? 15,
      ((dr - campaign.minDr) / 50) * (weights.domain_rating ?? weights.dr ?? 15)
    );

    const trafficScore = Math.min(
      weights.traffic ?? 15,
      Math.log10(traffic / campaign.minTraffic + 1) * (weights.traffic ?? 15)
    );

    const priceScore =
      price <= campaign.budgetPerLink
        ? weights.price_efficiency ?? weights.price ?? 10
        : Math.max(
            0,
            (weights.price_efficiency ?? weights.price ?? 10) -
              ((price - campaign.budgetPerLink) / campaign.budgetPerLink) *
                (weights.price_efficiency ?? weights.price ?? 10)
          );

    const rankingScore =
      ranking === "good"
        ? weights.ranking_bonus ?? weights.ranking ?? 10
        : ranking === "okay"
        ? (weights.ranking_bonus ?? weights.ranking ?? 10) / 2
        : 0;

    const geoScore =
      campaign.geoFocus.toLowerCase() === "global" ||
      String(row.geo || "").toLowerCase().includes(campaign.geoFocus.toLowerCase())
        ? weights.geo_match ?? weights.geo ?? 5
        : 0;

    const redFlagScore =
      redFlags.length === 0 ? weights.no_red_flags ?? weights.redFlags ?? 5 : 0;

    const breakdown = {
      niche_match: Math.max(0, nicheScore),
      domain_rating: Math.max(0, drScore),
      traffic: Math.max(0, trafficScore),
      price_efficiency: Math.max(0, priceScore),
      ranking_bonus: Math.max(0, rankingScore),
      geo_match: Math.max(0, geoScore),
      no_red_flags: Math.max(0, redFlagScore),
    };

    const score = disqualified
      ? 0
      : Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    const vendorDomain = await prisma.vendorDomain.create({
      data: {
        campaignId: id,
        domain: row.domain || "",
        dr,
        traffic,
        geo: row.geo || "",
        price,
        tat: row.tat || "",
        linkType: row.link_type || "",
        contactEmail: row.contact_email || "",
        mainNiche: row.main_niche || "",
        complementaryNiche: row.complementary_niche || "",
        indirectNiche: row.indirect_niche || "",
        ranking: row.ranking || "",
        redFlags: row.red_flags || "",
        rawJson: row,
      },
    });

    await prisma.scoredDomain.create({
      data: {
        campaignId: id,
        vendorDomainId: vendorDomain.id,
        scoringConfigId: config.id,
        score: Math.round(score * 100) / 100,
        disqualified,
        disqualificationReason,
        included: !disqualified,
        reasoningSummary: disqualified
          ? disqualificationReason
          : buildReasoning(breakdown, dr, traffic, price),
        breakdownJson: breakdown,
      },
    });
  }

  redirect(`/campaigns/${id}/results`);
}

function getNicheScore(
  clientNiche: string,
  row: Record<string, string>,
  maxScore: number
) {
  const clientWords = normalize(clientNiche);

  const domainText = [
    row.main_niche,
    row.complementary_niche,
    row.indirect_niche,
    row.domain,
  ]
    .filter(Boolean)
    .join(" ");

  const domainWords = normalize(domainText);

  if (clientWords.length === 0 || domainWords.length === 0) return 0;

  const matches = clientWords.filter((word) => domainWords.includes(word));

  return (matches.length / clientWords.length) * maxScore;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .split(/[\s,;/|.-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

function buildReasoning(
  breakdown: Record<string, number>,
  dr: number,
  traffic: number,
  price: number
) {
  const topFactors = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key.replaceAll("_", " "))
    .join(" and ");

  return `Best fit because of ${topFactors}. DR ${dr}, traffic ${traffic}, price $${price}.`;
}
