"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CloudflareIcon, GithubIcon } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { VersionNotification } from "@/components/version-notification";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const REPO_URL = "https://github.com/ptkelanatechsolutions/Cloudflared";

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
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(
        "sticky top-4 z-50 mx-auto flex w-full max-w-[88rem] items-center justify-between gap-2 rounded-2xl border px-4 py-2 shadow-xs backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-500",
        scrolled
          ? "border-border/60 bg-card/85 shadow-sm"
          : "border-transparent bg-card/50 shadow-none",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <CloudflareIcon size={22} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">Cloudflared</span>
          <VersionNotification />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <motion.a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Repository"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <GithubIcon size={16} />
          <span className="hidden sm:inline">Repository</span>
        </motion.a>

        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

        <ThemeToggle />
      </div>
    </motion.nav>
  );
}
