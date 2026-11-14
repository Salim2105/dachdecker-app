"use client";
import { useRef,useState,useSyncExternalStore } from "react";
import { Glossar } from "@/components/Glossar";
const subscribeHash=(change:()=>void)=>{window.addEventListener("hashchange",change);window.addEventListener("popstate",change);return()=>{window.removeEventListener("hashchange",change);window.removeEventListener("popstate",change);};};
const begriffAusAdresse=()=>{try{return decodeURIComponent(window.location.hash.slice(1));}catch{return "";}};
export function FachbegriffeSeite(){
 const hash=useSyncExternalStore(subscribeHash,begriffAusAdresse,()=>"");
 const [auswahl,setAuswahl]=useState<{hash:string;id?:string}>({hash:""});const inhalt=useRef<HTMLDivElement>(null);
 const id=auswahl.hash===hash?auswahl.id:hash||undefined;
 function waehlen(id:string){setAuswahl({hash,id});requestAnimationFrame(()=>{const titel=inhalt.current?.querySelector<HTMLHeadingElement>("article h3");if(titel){titel.tabIndex=-1;titel.focus();}});}
 return <div className="fachbegriffe-seite"><header className="bereichs-einstieg"><span>DEIN WÖRTERBUCH FÜRS HANDWERK</span><h1>Fachbegriffe verstehen.</h1><p>Suche ein Wort und entdecke seine einfache Bedeutung, ein Baustellenbeispiel und passende Skizzen.</p></header><div ref={inhalt} className="werkstatt-karte mt-6"><Glossar begriffId={id} onBegriff={waehlen}/></div></div>;
}
