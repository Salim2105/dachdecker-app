"use client";
import {useState} from "react";
import {appStorage} from "@/lib/lernSpeicher";
import {rechneAusdruck} from "@/lib/taschenrechner";
export function Taschenrechner(){
 const [text,setText]=useState(()=>appStorage.getItem("taschenrechner-entwurf")??""),[wert,setWert]=useState<number|null>(null),[fehler,setFehler]=useState("");
 function rechnen(){try{setWert(rechneAusdruck(text));setFehler("");}catch(e){setWert(null);setFehler(e instanceof Error?e.message:"Prüfe deinen Ausdruck.");}}
 return <section className="vorbereitung-taschenrechner" aria-label="Taschenrechner ohne Formelvorgaben"><h3>Taschenrechner</h3><p>Im App-Training zugelassen. Winkel in Grad; keine vorgegebenen fachlichen Lösungswege.</p><label>Rechenausdruck<input value={text} onChange={e=>{setText(e.target.value);appStorage.setItem("taschenrechner-entwurf",e.target.value);setWert(null);setFehler("");}} onKeyDown={e=>{if(e.key==="Enter")rechnen();}} placeholder="Zum Beispiel: sqrt(4^2 + 3^2)" autoComplete="off"/></label><button className="hauptaktion" onClick={rechnen}>Berechnen</button>{fehler&&<p role="alert">{fehler}</p>}{wert!==null&&<output aria-live="polite">{wert.toLocaleString("de-DE",{maximumSignificantDigits:12})}</output>}<details><summary>Rechenzeichen und Funktionen</summary><p>+ − * / · ( ) · Potenz ^ · Prozent % · pi · sqrt · sin, cos, tan und asin, acos, atan.</p></details></section>;
}
