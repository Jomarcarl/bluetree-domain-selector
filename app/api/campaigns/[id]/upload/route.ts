import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { redirect } from "next/navigation";

type Weights = Record<string, number>;

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
    return Response.json({ error: "Please choose a CSV file." }, { status: 400 });
  }

  const text = await file.text();

  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    line.toLowerCase().startsWith("domain,")
  );

  if (headerIndex === -1) {
    return Response.json(
      { error: "Could not find vendor inventory header row starting with Domain." },
      { status: 400 }
    );
  }

  const cleanedCsv = lines.slice(headerIndex).join("\n");

  const parsed = Papa.parse<Record<string, string>>(cleanedCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      { error: "CSV parse error", details: parsed.errors },
      { status: 400 }
    );
  }

  const config = await prisma.scoringConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!config) {
    return Response.json({ error: "No active scoring config" }, { status: 500 });
  }

  const weights = config.weightsJson as Weights;

  await prisma.scoredDomain.deleteMany({ where: { campaignId: id } });
  await prisma.vendorDomain.deleteMany({ where: { campaignId: id } });

  let importedCount = 0;

  for (const row of parsed.data) {
    const domain = cleanDomain(getText(row, ["Domain"]));
    if (!domain) continue;

    const dr = getNumber(row, ["DR"]);
    const traffic = getNumber(row, ["Traffic"]);
    const price = getNumber(row, ["LI Price", "GP Price"]);
    const geo = extractCountry(getText(row, ["Country. Traffic"])) || campaign.geoFocus || "global";
    const linkType = normalizeLinkType(getText(row, ["Link Type"]));
    const ranking = normalizeRanking(getText(row, ["Ranking"]));
    const redFlags = getText(row, ["Red Flags"]);
    const tat = getText(row, ["TAT"]);
    const contactEmail = getText(row, ["Contact"]);
    const mainNiche = getText(row, ["Main", "Niche"]);
    const complementaryNiche = getText(row, ["Complementary"]);
    const indirectNiche = getText(row, ["Indirect"]);

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

    const nicheScore = getNicheScore(
      campaign.clientNiche,
      {
        main_niche: mainNiche,
        complementary_niche: complementaryNiche,
        indirect_niche: indirectNiche,
        domain,
      },
      weights.niche_match ?? weights.NicheMatch ?? 40
    );

    const drWeight = weights.domain_rating ?? weights.dr ?? weights.Dr ?? 15;
    const trafficWeight = weights.traffic ?? weights.Traffic ?? 15;
    const priceWeight = weights.price_efficiency ?? weights.price ?? weights.Price ?? 10;
    const rankingWeight = weights.ranking_bonus ?? weights.ranking ?? weights.Ranking ?? 10;
    const geoWeight = weights.geo_match ?? weights.geo ?? weights.Geo ?? 5;
    const redFlagWeight = weights.no_red_flags ?? weights.redFlags ?? weights.RedFlags ?? 5;

    const drScore = Math.min(
      drWeight,
      Math.max(0, ((dr - campaign.minDr) / 50) * drWeight)
    );

    const trafficScore = Math.min(
      trafficWeight,
      Math.max(0, Math.log10(traffic / campaign.minTraffic + 1) * trafficWeight)
    );

    const priceScore =
      price <= campaign.budgetPerLink
        ? priceWeight
        : Math.max(
            0,
            priceWeight -
              ((price - campaign.budgetPerLink) / campaign.budgetPerLink) *
                priceWeight
          );

    const rankingScore =
      ranking === "good"
        ? rankingWeight
        : ranking === "okay"
        ? rankingWeight / 2
        : 0;

    const geoScore =
      campaign.geoFocus.toLowerCase() === "global" ||
      geo.toLowerCase().includes(campaign.geoFocus.toLowerCase())
        ? geoWeight
        : 0;

    const redFlagScore = redFlags.length === 0 ? redFlagWeight : 0;

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
        domain,
        dr,
        traffic,
        geo,
        price,
        tat,
        linkType,
        contactEmail,
        mainNiche,
        complementaryNiche,
        indirectNiche,
        ranking,
        redFlags,
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

    importedCount++;
  }

  if (importedCount === 0) {
    return Response.json(
      { error: "No domain rows imported." },
      { status: 400 }
    );
  }

  redirect(`/campaigns/${id}/results`);
}

function getText(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function getNumber(row: Record<string, string>, keys: string[]) {
  const value = getText(row, keys);
  if (!value || value === "-") return 0;

  return (
    Number(
      value
        .replaceAll("$", "")
        .replaceAll(",", "")
        .replaceAll("%", "")
        .trim()
    ) || 0
  );
}

function cleanDomain(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function extractCountry(value: string) {
  const match = value.match(/\(([^,]+),/);
  return match?.[1]?.trim().toUpperCase() || "";
}

function normalizeLinkType(value: string) {
  const text = value.toLowerCase();

  if (text.includes("nofollow")) return "nofollow";
  if (text.includes("li")) return "dofollow";
  if (text.includes("gp")) return "dofollow";

  return "dofollow";
}

function normalizeRanking(value: string) {
  const text = value.toLowerCase();

  if (text.includes("poor") || text.includes("bad")) return "poor";
  if (text.includes("good")) return "good";
  if (text.includes("okay")) return "okay";

  return "okay";
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
    .split(/[\s,;/|.\-↔️⬆️⬇️]+/)
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
