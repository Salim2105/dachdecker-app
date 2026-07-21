"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Start", icon: "M3 11l9-8 9 8M5 10v10h14V10" },
  { href: "/lernen", label: "Lernen", icon: "M4 5h16v14H4zM4 9h16M9 5v14" },
  { href: "/zeichnen", label: "Zeichnen", icon: "M3 21l4-1 11-11a2 2 0 00-3-3L4 17l-1 4zM14 5l3 3" },
  { href: "/pruefung", label: "Prüfung", icon: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18" },
  { href: "/rechner", label: "Rechner", icon: "M6 3h12v18H6zM9 7h6M8 11h1m3 0h1m3 0h1M8 15h1m3 0h1m3 0h1" },
  { href: "/fortschritt", label: "Fortschritt", icon: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderColor: "var(--border-soft)",
        backdropFilter: "saturate(1.4) blur(14px)",
        WebkitBackdropFilter: "saturate(1.4) blur(14px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl justify-around">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 px-0.5 pt-2 text-[10px] font-medium leading-tight transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
            >
              <span
                className="flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200"
                style={{
                  background: active ? "var(--accent-soft)" : "transparent",
                }}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={item.icon} />
                </svg>
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
