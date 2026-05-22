import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ top?: string; sort?: string; hideDisqualified?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const top = Number(query.top || 50);
  const sort = query.sort || "score";
  const hideDisqualified = query.hideDisqualified === "true";

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  const results = await prisma.scoredDomain.findMany({
    where: { campaignId: id },
    include: {
      vendorDomain: true,
    },
  });

  const sortedResults = [...results].sort((a, b) => {
    if (sort === "price") {
      return a.vendorDomain.price - b.vendorDomain.price;
    }

    if (sort === "dr") {
      return b.vendorDomain.dr - a.vendorDomain.dr;
    }

    return (b.score || 0) - (a.score || 0);
  });

  const limitedResults = sortedResults.slice(0, top);

  const qualified = limitedResults.filter(
    (r) => !r.disqualified
  );

  const disqualified = limitedResults.filter(
    (r) => r.disqualified
  );

  const selected = qualified.filter(
    (r) => r.included
  );

  const totalSpend = selected.reduce(
    (sum, r) => sum + r.vendorDomain.price,
    0
  );

  const avgDr =
    selected.length > 0
      ? selected.reduce(
          (sum, r) => sum + r.vendorDomain.dr,
          0
        ) / selected.length
      : 0;

  const queryBase = `/campaigns/${id}/results`;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight"
          >
            Domain Selector
          </Link>

          <div className="flex gap-6 text-sm text-zinc-400">
            <Link
              href="/dashboard"
              className="hover:text-white transition"
            >
              Dashboard
            </Link>

            <Link
              href="/campaigns/new"
              className="hover:text-white transition"
            >
              New Campaign
            </Link>

            <Link
              href="/config"
              className="hover:text-white transition"
            >
              Config
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-bold tracking-tight">
                Scored Domains
              </h1>

              <div className="flex gap-2 text-sm">
                {[25, 50, 100].map((num) => (
                  <Link
                    key={num}
                    href={`${queryBase}?top=${num}&sort=${sort}&hideDisqualified=${hideDisqualified}`}
                    className={
                      top === num
                        ? "bg-white text-black px-3 py-1 rounded-full font-medium"
                        : "border border-zinc-700 px-3 py-1 rounded-full text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                    }
                  >
                    Top {num}
                  </Link>
                ))}
              </div>
            </div>

            <p className="text-zinc-400 mt-4 text-lg">
              {campaign?.clientName}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="border border-zinc-700 hover:border-zinc-500 px-5 py-3 rounded-2xl text-sm transition"
            >
              Back
            </Link>

            <a
              href={`/api/campaigns/${id}/export`}
              className="bg-white text-black hover:bg-zinc-200 px-5 py-3 rounded-2xl text-sm font-semibold transition"
            >
              Export CSV
            </a>

            <a
              href={`/api/campaigns/${id}/xlsx`}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 rounded-2xl text-sm font-semibold transition"
            >
              Export XLSX
            </a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-10">
          <Stat label="Selected" value={selected.length} />
          <Stat label="Total spend" value={`$${totalSpend}`} />
          <Stat label="Average DR" value={avgDr.toFixed(1)} />
          <Stat label="Disqualified" value={disqualified.length} />
        </div>

        <div className="flex gap-3 mb-10">
          <Link
            href={`${queryBase}?top=${top}&sort=score&hideDisqualified=${hideDisqualified}`}
            className={
              sort === "score"
                ? "bg-white text-black px-4 py-2 rounded-xl text-sm font-medium"
                : "border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-xl text-sm transition"
            }
          >
            Highest Score
          </Link>

          <Link
            href={`${queryBase}?top=${top}&sort=price&hideDisqualified=${hideDisqualified}`}
            className={
              sort === "price"
                ? "bg-white text-black px-4 py-2 rounded-xl text-sm font-medium"
                : "border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-xl text-sm transition"
            }
          >
            Lowest Price
          </Link>

          <Link
            href={`${queryBase}?top=${top}&sort=dr&hideDisqualified=${hideDisqualified}`}
            className={
              sort === "dr"
                ? "bg-white text-black px-4 py-2 rounded-xl text-sm font-medium"
                : "border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-xl text-sm transition"
            }
          >
            Highest DR
          </Link>

          <Link
            href={`${queryBase}?top=${top}&sort=${sort}&hideDisqualified=${!hideDisqualified}`}
            className={
              hideDisqualified
                ? "bg-white text-black px-4 py-2 rounded-xl text-sm font-medium"
                : "border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-xl text-sm transition"
            }
          >
            {hideDisqualified ? "Show Disqualified" : "Hide Disqualified"}
          </Link>
        </div>

        <h2 className="text-3xl font-bold mb-6">
          Qualified Domains
        </h2>

        <div className="space-y-6 mb-14">
          {qualified.map((result) => (
            <DomainCard
              key={result.id}
              result={result}
            />
          ))}
        </div>

        {!hideDisqualified && (
          <>
            <h2 className="text-3xl font-bold mb-6 text-red-400">
              Disqualified Domains
            </h2>

            <div className="space-y-6">
              {disqualified.map((result) => (
                <DomainCard
                  key={result.id}
                  result={result}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
      <p className="text-zinc-500 text-sm uppercase tracking-wide">
        {label}
      </p>

      <p className="text-5xl font-bold mt-4">
        {value}
      </p>
    </div>
  );
}

function DomainCard({
  result,
}: {
  result: any;
}) {
  const score = result.score ?? 0;

  const scoreColor =
    score >= 80
      ? "text-green-400"
      : score >= 50
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition">
      <div className="flex justify-between gap-10">
        <div>
          <h2 className="font-bold text-4xl">
            {result.vendorDomain.domain}
          </h2>

          <p className="text-zinc-400 mt-3 text-lg leading-relaxed max-w-3xl">
            {result.reasoningSummary}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-7xl font-black ${scoreColor}`}>
            {score.toFixed(1)}
          </p>

          <p className="text-zinc-500 text-lg">
            /100
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 mt-10 text-sm">
        <Metric
          label="DR"
          value={result.vendorDomain.dr}
        />

        <Metric
          label="Traffic"
          value={result.vendorDomain.traffic}
        />

        <Metric
          label="Price"
          value={`$${result.vendorDomain.price}`}
        />

        <Metric
          label="Geo"
          value={result.vendorDomain.geo}
        />

        <Metric
          label="Link"
          value={result.vendorDomain.linkType}
        />
      </div>

      {result.breakdownJson && (
        <div className="mt-10 border-t border-zinc-800 pt-8">
          <h3 className="font-semibold mb-5 text-xl">
            Score Breakdown
          </h3>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {Object.entries(result.breakdownJson).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="bg-black border border-zinc-800 rounded-2xl px-5 py-4"
                >
                  <p className="text-zinc-500 capitalize">
                    {key.replaceAll("_", " ")}
                  </p>

                  <p className="font-bold text-3xl mt-2">
                    {Number(value).toFixed(1)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {result.disqualified ? (
        <p className="mt-6 text-red-400 text-lg">
          Disqualified: {result.disqualificationReason}
        </p>
      ) : (
        <form
          action={`/api/scored-domains/${result.id}/toggle`}
          method="POST"
          className="mt-8"
        >
          <button className="bg-white text-black hover:bg-zinc-200 px-5 py-3 rounded-2xl font-semibold transition">
            {result.included
              ? "Exclude Domain"
              : "Include Domain"}
          </button>
        </form>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="bg-black border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-500 uppercase tracking-wide text-xs">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value || "-"}
      </p>
    </div>
  );
}
