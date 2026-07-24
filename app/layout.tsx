import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dachdecker Gesellenprüfung",
  description: "Lernapp zur Vorbereitung auf die Dachdecker-Gesellenprüfung",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dachdecker", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f1011",
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
          className="sticky top-0 z-30 border-b"
          style={{
            background: "color-mix(in srgb, var(--surface) 82%, transparent)",
            borderColor: "var(--border-soft)",
            backdropFilter: "saturate(1.4) blur(14px)",
            WebkitBackdropFilter: "saturate(1.4) blur(14px)",
          }}
        >
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                style={{ background: "var(--accent-soft)" }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12L12 4l10 8"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 11v8h14v-8"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-semibold tracking-tight">Dachdecker</span>
                <span
                  className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-faint)" }}
                >
                  Gesellenprüfung
                </span>
              </span>
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">{children}</main>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
