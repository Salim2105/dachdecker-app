import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dachdecker Gesellenprüfung",
  description: "Lernapp zur Vorbereitung auf die Dachdecker-Gesellenprüfung",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dachdecker", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#23262b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const noFlashTheme = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';localStorage.setItem('theme',t);}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-screen">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="flex items-center gap-2 text-sm font-medium tracking-wide">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M2 12L12 4l10 8"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M5 11v8h14v-8"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            Dachdecker
          </span>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
