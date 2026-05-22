import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConfigPage() {
  const configs = await prisma.scoringConfig.findMany({
    orderBy: {
      version: "desc",
    },
  });

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
              className="text-white"
            >
              Config
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-emerald-400 text-sm tracking-[0.25em] uppercase mb-3">
              BlueTree Internal Tool
            </p>

            <h1 className="text-5xl font-bold tracking-tight">
              Scoring Configuration
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="border border-zinc-700 hover:border-zinc-500 px-5 py-3 rounded-2xl text-sm transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="space-y-6">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-3xl">
                    {config.name}
                  </h2>

                  <p className="text-zinc-400 mt-2">
                    Version {config.version}
                  </p>
                </div>

                <div>
                  {config.isActive ? (
                    <span className="bg-emerald-500 text-black px-4 py-2 rounded-2xl font-semibold">
                      Active
                    </span>
                  ) : (
                    <form
                      action={`/api/config/${config.id}/activate`}
                      method="POST"
                    >
                      <button className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-2xl font-semibold transition">
                        Activate
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold mb-4 text-xl">
                  Weights
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(
                    config.weightsJson as Record<
                      string,
                      number
                    >
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-black border border-zinc-800 rounded-2xl px-5 py-4 flex justify-between items-center"
                    >
                      <span className="capitalize text-zinc-400">
                        {key.replaceAll("_", " ")}
                      </span>

                      <span className="font-bold text-xl">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold mb-4 text-xl">
                  Rules
                </h3>

                <pre className="bg-black border border-zinc-800 rounded-2xl p-6 text-sm overflow-x-auto text-zinc-300">
                  {JSON.stringify(
                    config.rulesJson,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}