import Link from "next/link";
import Logo from "@/components/ui/Logo";

type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = "Codify.today" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="md" />
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
