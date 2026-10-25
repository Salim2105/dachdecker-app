"use client";
import { useEffect,useRef } from "react";
import { NAV_GRUPPEN,SERVICE_NAV,navigationsZiel } from "@/lib/navigation";
import { LernLink } from "@/components/LernLink";

export function BereichsNavigation({aktiv,mobil=false,onNavigationReady}:{aktiv:string|null;mobil?:boolean;onNavigationReady?:()=>void}){
 return <nav aria-label={mobil?"Alle Lernbereiche":"Hauptnavigation"} className="bereichs-navigation">
  {NAV_GRUPPEN.map(g=><section key={g.id} aria-labelledby={`${mobil?"mobil":"desktop"}-${g.id}`}><h2 id={`${mobil?"mobil":"desktop"}-${g.id}`}>{g.label}</h2><ul>{g.eintraege.map(e=><li key={e.href}><LernLink href={navigationsZiel(e)} aria-current={aktiv===e.href?"page":undefined} onNavigationReady={onNavigationReady}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={e.icon}/></svg><span>{e.label}</span></LernLink></li>)}</ul></section>)}
  <section className="navigation-service" aria-labelledby={`${mobil?"mobil":"desktop"}-service`}><h2 id={`${mobil?"mobil":"desktop"}-service`}>Service</h2><ul>{SERVICE_NAV.map(e=><li key={e.href}><LernLink href={e.href} aria-current={aktiv===e.href?"page":undefined} onNavigationReady={onNavigationReady}>{e.label}</LernLink></li>)}</ul></section>
 </nav>;
}
export function BereicheMenue({aktiv,onSchliessen,onNavigationReady}:{aktiv:string|null;onSchliessen:()=>void;onNavigationReady:()=>void}){
 const dialog=useRef<HTMLDivElement>(null),titel=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const alt=document.body.style.overflow;document.body.style.overflow="hidden";titel.current?.focus();
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();onSchliessen();}};
  window.addEventListener("keydown",escape);
  return()=>{document.body.style.overflow=alt;window.removeEventListener("keydown",escape);};
 },[onSchliessen]);
 return <div className="bereiche-overlay"><button type="button" className="bereiche-hintergrund" aria-label="Bereiche-Menü schließen" tabIndex={-1} onClick={onSchliessen}/><div id="bereiche-menue" ref={dialog} className="bereiche-dialog" role="dialog" aria-modal="true" aria-labelledby="bereiche-titel" onKeyDown={e=>{
  if(e.key!=="Tab")return;
  const alle=[...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select')??[])].filter(n=>n.getClientRects().length>0);
  const erstes=alle[0],letztes=alle.at(-1);
  if(e.shiftKey&&(document.activeElement===erstes||document.activeElement===titel.current)){e.preventDefault();letztes?.focus();}
  else if(!e.shiftKey&&document.activeElement===letztes){e.preventDefault();erstes?.focus();}
 }}><header><div><span>DEINE LERNWERKSTATT</span><h2 id="bereiche-titel" ref={titel} tabIndex={-1}>Alle Bereiche</h2></div><button type="button" onClick={onSchliessen} aria-label="Bereiche schließen">✕</button></header><div className="bereiche-inhalt"><BereichsNavigation aktiv={aktiv} mobil onNavigationReady={onNavigationReady}/></div></div></div>;
}
