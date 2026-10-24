"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { aktiverBereich, WERKSTATT_NAV } from "@/lib/navigation";

export function BottomNav() {
  const aktiv = aktiverBereich(usePathname());
  return <nav className="mobile-nav" aria-label="Hauptnavigation mobil">
    {WERKSTATT_NAV.map((item) => <Link key={item.href} href={item.href} aria-current={aktiv === item.href ? "page" : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon} /></svg>
      <span>{item.kurz}</span>
    </Link>)}
  </nav>;
}
