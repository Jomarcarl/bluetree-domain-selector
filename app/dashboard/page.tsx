import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function DashboardPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-emerald-400">
              BlueTree internal tool
            </p>

            <h1 className="text-5xl font-bold tracking-tight">
              Domain Selector
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Score publisher domains against campaign briefs, review reasoning,
              and export selected placements.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/campaigns/new"
              className="rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200"
            >
              New Campaign
            </Link>

            <Link
              href="/config"
              className="rounded-xl border border-white/15 px-5 py-3 font-medium hover:bg-white/10"
            >
              Scoring Config
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Saved Campaigns
          </h2>

          <span className="text-sm text-zinc-500">
            {campaigns.length} campaigns
          </span>
        </div>

        <div className="grid gap-5">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-xl"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {campaign.clientName || "Untitled Campaign"}
                  </h3>

                  <p className="mt-1 text-zinc-400">
                    {campaign.clientNiche || "No niche provided"}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-300 md:grid-cols-4">
                    <span className="rounded-lg bg-white/5 px-3 py-2">
                      Budget ${campaign.budgetPerLink}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-2">
                      Min DR {campaign.minDr}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-2">
                      Traffic {campaign.minTraffic}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-2">
                      Goal {campaign.linkCountGoal}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="rounded-xl border border-white/15 px-4 py-3 hover:bg-white/10"
                  >
                    Open
                  </Link>

                  <Link
                    href={`/campaigns/${campaign.id}/results`}
                    className="rounded-xl bg-white px-4 py-3 font-medium text-black hover:bg-zinc-200"
                  >
                    Results
                  </Link>

                  <form
                    action={`/api/campaigns/${campaign.id}/delete`}
                    method="POST"
                  >
                    <button className="rounded-xl border border-red-500/40 px-4 py-3 text-red-400 hover:bg-red-500/10">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-8 text-zinc-400">
              No campaigns yet. Create your first campaign to start scoring
              domains.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}