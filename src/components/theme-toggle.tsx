"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Sun-with-dots toggle (adapted from Skiper UI, skiper4 #3).
// The sun's rays fade out and a shadow slides over it to form a moon.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // The real theme is set before paint by a script in layout.tsx; sync to it.
  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const apply = () => {
      document.documentElement.dataset.theme = next ? "dark" : "light";
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    };
    // The new theme wipes in from the bottom (skiper26). See globals.css.
    // Browsers without View Transitions just switch instantly.
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  };

  const transition = { ease: "easeInOut" as const, duration: 0.35 };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="size-8 rounded-full border border-line bg-bg p-1.5 text-fg transition-transform active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" strokeLinecap="round" viewBox="0 0 32 32">
        <clipPath id="theme-toggle-clip">
          <motion.path
            animate={{ y: isDark ? 14 : 0, x: isDark ? -11 : 0 }}
            transition={transition}
            d="M0-11h25a1 1 0 0017 13v30H0Z"
          />
        </clipPath>
        <g clipPath="url(#theme-toggle-clip)">
          <motion.circle animate={{ r: isDark ? 10 : 8 }} transition={transition} cx="16" cy="16" />
          <motion.g animate={{ scale: isDark ? 0.5 : 1, opacity: isDark ? 0 : 1 }} transition={transition}>
            <path d="M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z" />
          </motion.g>
        </g>
      </svg>
    </button>
  );
}
