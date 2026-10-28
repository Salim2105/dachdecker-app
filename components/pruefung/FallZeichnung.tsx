"use client";
import {useState} from "react";
import {ZeichenFlaeche} from "@/components/zeichnen/ZeichenFlaeche";
import {PapierZeichnung} from "@/components/zeichnen/PapierZeichnung";
import {ladeZeichenEntwurf,speichereZeichenEntwurf} from "@/lib/zeichenSpeicher";
import type {ZeichenEntwurf} from "@/lib/zeichenEntwurf";
export function FallZeichnung({id,titel,abgegeben=false}:{id:string;titel:string;abgegeben?:boolean}){
 const [e,setE]=useState(()=>ladeZeichenEntwurf(id)),[fehler,setFehler]=useState("");
 function speichern(n:ZeichenEntwurf){if(abgegeben)return false;try{speichereZeichenEntwurf(n);setE(n);setFehler("");return true;}catch{setFehler("Deine Zeichnung konnte nicht gespeichert werden. Bitte den Speicherhinweis beachten.");return false;}}
 return <div><p>Digital oder auf Papier. Der Vergleich ist deine Selbsteinschätzung.</p><div className="vorbereitung-aktionen" role="group" aria-label="Zeichenweg">{([['digital','Direkt zeichnen'],['papier','Auf Papier zeichnen']] as const).map(([modus,label])=><button key={modus} disabled={abgegeben} aria-pressed={e.modus===modus} onClick={()=>speichern({...e,modus})}>{label}</button>)}</div>{abgegeben&&<p>Dein abgegebener Entwurf bleibt erhalten. Für eine neue Zeichnung beginnst du einen neuen Versuch.</p>}<fieldset disabled={abgegeben} inert={abgegeben}>{e.modus==="digital"?<ZeichenFlaeche entwurf={e} titel={titel} onChange={speichern}/>:<PapierZeichnung aufgabenId={id} foto={e.foto} onChange={foto=>speichern({...e,foto})}/>}</fieldset>{fehler&&<p role="alert">{fehler}</p>}</div>;
}
