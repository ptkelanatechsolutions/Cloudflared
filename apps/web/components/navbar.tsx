"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CloudflareIcon, GithubIcon } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { VersionNotification } from "@/components/version-notification";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const REPO_URL = "https://github.com/ptkelanatechsolutions/Cloudflared";

/**
 * Floating "island" navbar: glass effect intensifies on scroll, always visible.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const handleScroll = () => {
      setScrolled(main.scrollTop > 40);
    };

    main.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0, filter: "blur(8px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.65, ease: EASE }}
      className={cn(
        "sticky top-5 z-50 mt-6 flex w-full items-center justify-between gap-2 rounded-full border p-1.5 pl-4 shadow-sm backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        scrolled ? "border-border/80 bg-card/85 shadow-md" : "border-border bg-card/70 shadow-sm",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <CloudflareIcon size={20} />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight text-foreground">Cloudflared</span>
          <VersionNotification />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <motion.a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.96 }}
          className="group/repo flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent hover:text-foreground"
        >
          <GithubIcon
            size={16}
            className="transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/repo:-translate-y-px group-hover/repo:scale-110"
          />
          <span className="hidden sm:inline">Repository</span>
        </motion.a>

        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

        <ThemeToggle />
      </div>
    </motion.nav>
  );
}
