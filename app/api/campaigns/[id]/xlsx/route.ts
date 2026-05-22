import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  const results = await prisma.scoredDomain.findMany({
    where: {
      campaignId: id,
      disqualified: false,
      included: true,
    },
    include: {
      vendorDomain: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Selected Domains");

  sheet.columns = [
    { header: "Domain", key: "domain", width: 30 },
    { header: "Score", key: "score", width: 12 },
    { header: "DR", key: "dr", width: 10 },
    { header: "Traffic", key: "traffic", width: 15 },
    { header: "Price", key: "price", width: 12 },
    { header: "Geo", key: "geo", width: 10 },
    { header: "Link Type", key: "linkType", width: 15 },
    { header: "Email", key: "email", width: 30 },
    { header: "Reasoning", key: "reasoning", width: 50 },
  ];

  results.forEach((r) => {
    sheet.addRow({
      domain: r.vendorDomain.domain,
      score: r.score,
      dr: r.vendorDomain.dr,
      traffic: r.vendorDomain.traffic,
      price: r.vendorDomain.price,
      geo: r.vendorDomain.geo,
      linkType: r.vendorDomain.linkType,
      email: r.vendorDomain.contactEmail,
      reasoning: r.reasoningSummary,
    });
  });

  sheet.getRow(1).font = {
    bold: true,
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="campaign-${id}.xlsx"`,
    },
  });
}
