import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: { default: "HypoText · your site, readable by AI", template: "%s · HypoText" },
  description:
    "HypoText sits in front of your website. People get your normal pages; AI agents like ChatGPT, Claude and Perplexity get a small, accurate JSON version of the same page.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

// Set the theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen text-[15px] leading-7">
        <div className="mx-auto max-w-[640px] px-5 pb-24 pt-12 sm:pt-16">
          <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <Link href="/" className="block">
              <div className="font-medium">hypotext</div>
              <div className="text-sm text-muted">your site, readable by AI</div>
            </Link>
            <nav className="flex items-center gap-3 text-sm text-muted sm:gap-4">
              <Link href="/demo" className="hover:text-fg">demo</Link>
              <Link href="/docs" className="hover:text-fg">docs</Link>
              <Link href="/dashboard" className="hover:text-fg">dashboard</Link>
              <ThemeToggle />
            </nav>
          </header>
          <main>{children}</main>
          <footer className="mt-20 flex justify-between border-t border-line pt-6 text-xs text-faint">
            <span>hypotext · the web has two readers now</span>
            <Link href="/docs" className="hover:text-fg">docs</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
