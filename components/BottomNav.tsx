"use client";
import { LernLink } from "@/components/LernLink";
import { usePathname } from "next/navigation";
import { aktiverBereich,MOBILE_NAV,WERKSTATT_NAV } from "@/lib/navigation";

export function BottomNav({onBereiche,menueOffen}:{onBereiche:()=>void;menueOffen:boolean}) {
  const aktiv = aktiverBereich(usePathname());
  return <nav className="mobile-nav" aria-label="Hauptnavigation mobil">
    {MOBILE_NAV.map(item=>item.href===null?<button key="bereiche" type="button" onClick={onBereiche} aria-controls="bereiche-menue" aria-expanded={menueOffen} className={aktiv&&!['/','/heute','/fortschritt'].includes(aktiv)?"anderer-bereich-aktiv":""}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg><span>Bereiche</span></button>:<LernLink key={item.href} href={item.href} aria-current={aktiv===item.href?"page":undefined}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={WERKSTATT_NAV.find(e=>e.href===item.href)!.icon}/></svg><span>{item.label}</span></LernLink>)}
  </nav>;
}
