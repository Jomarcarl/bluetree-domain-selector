import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Domain Selector
          </Link>

          <nav className="flex gap-3 text-sm">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/10 hover:text-white">
              Dashboard
            </Link>
            <Link href="/campaigns/new" className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/10 hover:text-white">
              New Campaign
            </Link>
            <Link href="/config" className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/10 hover:text-white">
              Config
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
