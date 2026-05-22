import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      targetPages: true,
    },
  });

  if (!campaign) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        Campaign not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Domain Selector
          </Link>

          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>

            <Link href="/campaigns/new" className="hover:text-white">
              New Campaign
            </Link>

            <Link href="/config" className="hover:text-white">
              Config
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-emerald-400 text-sm tracking-[0.25em] uppercase mb-3">
              Campaign Workspace
            </p>

            <h1 className="text-5xl font-bold">
              {campaign.clientName}
            </h1>

            <p className="text-zinc-400 mt-3 text-lg">
              {campaign.clientNiche}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="border border-zinc-700 px-5 py-3 rounded-2xl text-sm hover:border-zinc-500"
            >
              Back
            </Link>

            <Link
              href={`/campaigns/${campaign.id}/results`}
              className="bg-white text-black px-5 py-3 rounded-2xl text-sm font-semibold"
            >
              View Results
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Campaign Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Info label="Budget per link" value={`$${campaign.budgetPerLink}`} />
              <Info label="Geo focus" value={campaign.geoFocus} />
              <Info label="Minimum DR" value={campaign.minDr} />
              <Info label="Minimum traffic" value={campaign.minTraffic} />
              <Info label="Link goal" value={campaign.linkCountGoal} />
              <Info label="Follow preference" value={campaign.followPreference} />
            </div>
          </section>

          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Target Pages
            </h2>

            <div className="space-y-3">
              {campaign.targetPages.map((page) => (
                <div
                  key={page.id}
                  className="bg-black border border-zinc-800 rounded-2xl p-5"
                >
                  <p className="text-zinc-400 text-sm">Target URL</p>
                  <p className="font-semibold break-all">{page.targetUrl}</p>

                  <p className="text-zinc-400 text-sm mt-4">
                    Primary keyword
                  </p>
                  <p className="font-semibold">{page.primaryKeyword}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-3">
              Upload Vendor CSV
            </h2>

            <p className="text-zinc-400 mb-6">
              Upload the vendor inventory file to score domains against this campaign brief.
            </p>

            <form
              action={`/api/campaigns/${campaign.id}/upload`}
              method="POST"
              encType="multipart/form-data"
              className="space-y-5"
            >
              <input
                type="file"
                name="file"
                accept=".csv"
                className="block w-full rounded-2xl border border-zinc-800 bg-black p-4"
              />

              <button className="bg-emerald-500 text-black px-6 py-4 rounded-2xl font-semibold hover:bg-emerald-400">
                Upload and Score
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-black border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-500 text-sm uppercase tracking-wide">
        {label}
      </p>

      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}
