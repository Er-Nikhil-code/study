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
    <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl lg:block overflow-x-auto hide-scrollbar">
      <div className="hidden lg:block mb-4 px-3 pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
          Navigation
        </div>
      </div>

      <nav className="flex space-x-2 lg:space-x-0 lg:space-y-1 lg:flex-col min-w-max lg:min-w-0">
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

// Ensure the scrollbar is hidden while still allowing scroll
const styles = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = styles;
  document.head.appendChild(style);
}
