import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();

  const clientName = formData.get("clientName") as string;
  const clientNiche = formData.get("clientNiche") as string;
  const targetUrl = formData.get("targetUrl") as string;
  const primaryKeyword = formData.get("primaryKeyword") as string;

  const budgetPerLink = Number(
    formData.get("budgetPerLink")
  );

  const geoFocus = formData.get("geoFocus") as string;

  const followPreference = formData.get(
    "followPreference"
  ) as string;

  const minDr = Number(formData.get("minDr"));

  const minTraffic = Number(
    formData.get("minTraffic")
  );

  const linkCountGoal = Number(
    formData.get("linkCountGoal")
  );

  const campaign = await prisma.campaign.create({
    data: {
      clientName,
      clientNiche,
      budgetPerLink,
      geoFocus,
      followPreference,
      minDr,
      minTraffic,
      linkCountGoal,

      targetPages: {
        create: [
          {
            targetUrl,
            primaryKeyword,
          },
        ],
      },
    },
  });

  redirect(`/campaigns/${campaign.id}`);
}
