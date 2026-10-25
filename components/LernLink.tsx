"use client";
import { useEffect,useRef,useState,type AnchorHTMLAttributes } from "react";
import { flushStorage } from "@/lib/lernSpeicher";
import { wechsleLernziel } from "@/lib/lernNavigation";

/** Some static lesson pages keep their selected unit in local state. Native
 * navigation opens the exact hash target, including a different task on the same
 * page; the original draft is durable before that page is replaced. */
export function LernLink({href,onClick,onNavigationReady,children,...props}:Omit<AnchorHTMLAttributes<HTMLAnchorElement>,"href">&{href:string;onNavigationReady?:()=>void}){
 const [busy,setBusy]=useState(false),[fehler,setFehler]=useState("");
 const pending=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 return <><a {...props} href={href} aria-busy={busy||undefined} onClick={async e=>{
   onClick?.(e);
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||props.target&&props.target!=="_self"||props.download)return;
   e.preventDefault();if(pending.current)return;
   pending.current=true;setBusy(true);setFehler("");
   try{await flushStorage();if(alive.current){onNavigationReady?.();wechsleLernziel(href);}}
   catch{if(alive.current){setFehler("Deine Eingaben konnten noch nicht dauerhaft gespeichert werden. Bitte den Speicherhinweis prüfen und den Lernschritt danach erneut öffnen.");pending.current=false;setBusy(false);}}
 }}>{children}</a>{fehler&&<p role="alert" className="mt-2 text-sm" style={{color:"var(--bad)"}}>{fehler}</p>}</>;
}
