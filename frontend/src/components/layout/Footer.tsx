"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const isAdminPage = pathname.startsWith("/admin");

  return (
    <footer className="w-full py-6 mt-auto border-t border-white/5 bg-zinc-950/50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center text-zinc-500 text-xs tracking-wider font-light">
        <span>© {new Date().getFullYear()} Codify. All rights reserved.</span>
        {!isAdminPage && (
          <>
            <span className="hidden md:inline mx-3">•</span>
            <a 
              href="mailto:support@codify.today" 
              className="mt-2 md:mt-0 hover:text-white transition-colors duration-200"
            >
              support@codify.today
            </a>
          </>
        )}
      </div>
    </footer>
  );
}
