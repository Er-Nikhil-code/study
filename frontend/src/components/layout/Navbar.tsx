import Link from "next/link";

type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = "Codify.today" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-300">
            C
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              {title}
            </div>
            <div className="text-xs text-zinc-400">
              Competitive exam platform
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-white"
          >
            Home login
          </Link>
        </div>
      </div>
    </header>
  );
}
