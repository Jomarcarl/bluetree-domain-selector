import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const results = await prisma.scoredDomain.findMany({
    where: {
      campaignId: id,
      included: true,
      disqualified: false,
    },
    include: {
      vendorDomain: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  const headers = [
    "domain",
    "score",
    "dr",
    "traffic",
    "price",
    "geo",
    "link_type",
    "contact_email",
    "reasoning",
  ];

  const rows = results.map((r) => [
    r.vendorDomain.domain,
    r.score ?? "",
    r.vendorDomain.dr,
    r.vendorDomain.traffic,
    r.vendorDomain.price,
    r.vendorDomain.geo,
    r.vendorDomain.linkType,
    r.vendorDomain.contactEmail ?? "",
    r.reasoningSummary ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="campaign-export-${id}.csv"`,
    },
  });
}
