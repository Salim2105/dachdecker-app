"use client";
import { useRef,useState } from "react";
import { Glossar } from "@/components/Glossar";
export function FachbegriffeSeite(){
 const [id,setId]=useState<string>();const inhalt=useRef<HTMLDivElement>(null);
 function waehlen(id:string){setId(id);requestAnimationFrame(()=>{const titel=inhalt.current?.querySelector<HTMLHeadingElement>("article h3");if(titel){titel.tabIndex=-1;titel.focus();}});}
 return <div className="fachbegriffe-seite"><header className="bereichs-einstieg"><span>DEIN WÖRTERBUCH FÜRS HANDWERK</span><h1>Fachbegriffe verstehen.</h1><p>Suche ein Wort und entdecke seine einfache Bedeutung, ein Baustellenbeispiel und passende Skizzen.</p></header><div ref={inhalt} className="werkstatt-karte mt-6"><Glossar begriffId={id} onBegriff={waehlen}/></div></div>;
}
