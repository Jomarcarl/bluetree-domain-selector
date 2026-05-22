import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;

  const scored = await prisma.scoredDomain.findUnique({
    where: { id },
  });

  if (!scored) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  await prisma.scoredDomain.update({
    where: { id },
    data: {
      included: !scored.included,
    },
  });

  return NextResponse.redirect(
    request.headers.get("referer") || "/dashboard"
  );
}
