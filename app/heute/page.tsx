"use client";
import { useState, useSyncExternalStore } from "react";
import { appStorage } from "@/lib/lernSpeicher";
import { Tagesrunde } from "@/components/review/Tagesrunde";
import { PruefungsPlanHinweis } from "@/components/pruefung/PruefungsFahrplan";
import AlteTagesrunde from "@/components/review/AlteTagesrunde";

const subscribe = () => () => {};
const subscribeRoute=(cb:()=>void)=>{window.addEventListener("popstate",cb);return()=>window.removeEventListener("popstate",cb);};
const routeSnapshot=()=>window.location.search;
export default function HeutePage() {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  return client ? <HeuteAufGeraet /> : <p>Deine Tagesrunde wird geöffnet …</p>;
}
function HeuteAufGeraet() {
  const [alt, setAlt] = useState(() => !!appStorage.getItem("dd-session-heute") && appStorage.getItem("tagesrunde-alt-beendet") !== "1");
  const route=useSyncExternalStore(subscribeRoute,routeSnapshot,()=>"");
  const parameter=new URLSearchParams(route),planId=parameter.get("plan"),runde=parameter.get("runde");
  if(planId!==null)return <><PruefungsPlanHinweis/><Tagesrunde planId={planId}/></>;
  if(runde==="alles" || runde==="kurz" || runde==="tief")return <><PruefungsPlanHinweis/><Tagesrunde runde={runde}/></>;
  if (!alt) return <><PruefungsPlanHinweis/><Tagesrunde /></>;
  return <div><PruefungsPlanHinweis/><section className="werkstatt-karte mb-5"><h1>Deine bisherige Tagesrunde</h1><p>Du kannst deine angefangenen Aufgaben fertig bearbeiten. Die neue gemeinsame Tagesrunde verbindet anschließend Fachwissen, Mathe und Sprache.</p><button className="min-h-11 underline" onClick={() => { appStorage.setItem("tagesrunde-alt-beendet", "1"); setAlt(false); }}>Zur gemeinsamen Tagesrunde →</button></section><AlteTagesrunde /></div>;
}
