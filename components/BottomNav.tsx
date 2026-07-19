"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Start", icon: "M3 11l9-8 9 8M5 10v10h14V10" },
  { href: "/lernen", label: "Lernen", icon: "M4 5h16v14H4zM4 9h16M9 5v14" },
  { href: "/rechner", label: "Rechner", icon: "M6 3h12v18H6zM9 7h6M8 11h1m3 0h1m3 0h1M8 15h1m3 0h1m3 0h1" },
  { href: "/fortschritt", label: "Fortschritt", icon: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 pt-2 text-xs"
            style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
