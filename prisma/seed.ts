import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.scoringConfig.deleteMany();

  await prisma.scoringConfig.create({
    data: {
      version: 1,
      name: "Default SaaS Config",
      isActive: true,

      weightsJson: {
        niche_match: 40,
        domain_rating: 15,
        traffic: 15,
        price_efficiency: 10,
        ranking_bonus: 10,
        geo_match: 5,
        no_red_flags: 5,
      },

      rulesJson: {
        min_dr: true,
        min_traffic: true,
        require_dofollow: true,
        ranking_disqualifiers: [
          "poor",
          "bad",
        ],
      },

      promptsJson: {
        niche_prompt:
          "Evaluate topical relevance between client niche and domain niche.",
      },
    },
  });

  await prisma.scoringConfig.create({
    data: {
      version: 2,
      name: "Ecommerce Heavy Niche Config",
      isActive: false,

      weightsJson: {
        niche_match: 50,
        domain_rating: 10,
        traffic: 10,
        price_efficiency: 10,
        ranking_bonus: 10,
        geo_match: 5,
        no_red_flags: 5,
      },

      rulesJson: {
        min_dr: true,
        min_traffic: true,
        require_dofollow: false,
        ranking_disqualifiers: [
          "bad",
        ],
      },

      promptsJson: {
        niche_prompt:
          "Prioritize ecommerce topical overlap strongly.",
      },
    },
  });

  console.log("Seeded scoring configs.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
