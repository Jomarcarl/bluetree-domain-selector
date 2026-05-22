import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.scoringConfig.updateMany({
    data: {
      isActive: false,
    },
  });

  await prisma.scoringConfig.update({
    where: { id },
    data: {
      isActive: true,
    },
  });

  redirect("/config");
}
