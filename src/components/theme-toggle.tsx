"use client";

export function ThemeToggle() {
  const toggle = () => {
    const el = document.documentElement;
    const next = el.dataset.theme === "dark" ? "light" : "dark";
    el.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="grid h-7 w-7 place-items-center rounded-md border border-line hover:bg-soft">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}
