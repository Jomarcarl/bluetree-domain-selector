import Link from "next/link";

export default function NewCampaignPage() {
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
              className="text-white"
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

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-emerald-400 text-sm tracking-[0.25em] uppercase mb-3">
              BlueTree Internal Tool
            </p>

            <h1 className="text-5xl font-bold tracking-tight">
              Create Campaign
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="border border-zinc-700 hover:border-zinc-500 px-5 py-3 rounded-2xl text-sm transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <form
          action="/api/campaigns"
          method="POST"
          className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-5"
        >
          <input
            name="clientName"
            placeholder="Client name"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <input
            name="clientNiche"
            placeholder="Client niche"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <input
            name="budgetPerLink"
            placeholder="Budget per link"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <input
            name="geoFocus"
            placeholder="Geo focus"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <select
            name="followPreference"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          >
            <option value="either">
              Either
            </option>

            <option value="dofollow_only">
              Dofollow only
            </option>
          </select>

          <input
            name="minDr"
            defaultValue="50"
            placeholder="Minimum DR"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <input
            name="minTraffic"
            defaultValue="3000"
            placeholder="Minimum traffic"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <input
            name="linkCountGoal"
            placeholder="Link count goal"
            className="bg-black border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
          />

          <div className="bg-black border border-zinc-800 rounded-3xl p-6">
            <h2 className="font-bold text-2xl mb-5">
              Target Page
            </h2>

            <input
              name="targetUrl"
              placeholder="Target URL"
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 w-full mb-4 focus:outline-none focus:border-zinc-600"
            />

            <input
              name="primaryKeyword"
              placeholder="Primary keyword"
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 w-full focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button className="bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-2xl font-semibold transition">
            Create Campaign
          </button>
        </form>
      </div>
    </main>
  );
}