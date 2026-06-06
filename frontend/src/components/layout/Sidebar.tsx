import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  items: NavItem[];
  activeHref?: string;
};

export default function Sidebar({ items, activeHref }: SidebarProps) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
      <div className="mb-4 px-3 pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
          Navigation
        </div>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-2xl px-3 py-2 text-sm transition",
                active
                  ? "border border-red-500/20 bg-red-500/10 text-red-200"
                  : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
