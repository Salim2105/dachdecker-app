"use client";
import {useEffect,useState} from "react";
import {Fortschritt} from "./Fortschritt";
import {KompetenzUebersicht} from "./KompetenzUebersicht";
export function LernstandWerkstatt(){
 const [kompetenzen,setKompetenzen]=useState(()=>typeof window!=="undefined"&&window.location.hash==="#kompetenzen");
 useEffect(()=>{const neu=()=>setKompetenzen(window.location.hash==="#kompetenzen");window.addEventListener("hashchange",neu);window.addEventListener("popstate",neu);return()=>{window.removeEventListener("hashchange",neu);window.removeEventListener("popstate",neu);};},[]);
 function wechseln(k:boolean){setKompetenzen(k);window.history.replaceState(null,"",`/fortschritt${k?"#kompetenzen":""}`);}
 return <div>{kompetenzen&&<h1>Deine Prüfungsvorbereitung im Blick</h1>}<nav className="vorbereitung-tabs" aria-label="Lernstand auswählen"><button aria-current={kompetenzen?"page":undefined} onClick={()=>wechseln(true)}>Kompetenzübersicht</button><button aria-current={!kompetenzen?"page":undefined} onClick={()=>wechseln(false)}>Fachwissen &amp; Sicherungen</button></nav>{kompetenzen?<KompetenzUebersicht/>:<Fortschritt/>}</div>;
}
