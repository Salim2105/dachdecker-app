import { bewerteAktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { leseDezimalzahl } from "@/lib/zahlen";
import type { AufbauAufgabe, AufbauAntwort, AufbauErgebnis } from "@/lib/matheAufbau";
import type { MatheAufgabe, MatheErgebnis } from "@/lib/matheGrundlagen";
import type { BauProjekt, ProjektRechnung, ProjektTransfer } from "@/lib/bauprojekte";
import type { BildAufgabe } from "@/lib/bildtraining";
import type { LernHinweis, LernKategorie } from "@/lib/lernHinweise";
import { pruefungsTransferFamilie, pruefungsTransferRef, PRUEFUNGS_TRANSFER_ROUTE } from "@/lib/pruefungsTransfer";
import { getWerkstattWiederholung, werkstattWiederholungRoute } from "@/lib/werkstattWiederholung";

export function aufbauNacharbeit(a:AufbauAufgabe,antworten:Record<string,AufbauAntwort>,r:AufbauErgebnis):LernHinweis[]{
 const basis={lernzielId:a.einheitId,route:`/grundlagen/mathe#${a.einheitId}`,thema:a.titel};
 if(r.richtig)return [{...basis,kategorie:"rechenweg",richtig:true,hinweis:"Alle Rechenschritte und Einheiten passen."}];
 const gruppen=new Map<LernKategorie,string[]>();
 for(const s of a.schritte){if(r.schritte[s.id]?.richtig)continue;const v=antworten[s.id];
  const einheit=v?.einheit!==s.einheit;
  const k:LernKategorie=einheit?"einheiten":a.einheitId==="aufbau-formeln"?"formel":"rechenweg";
  const h=einheit?`Bei „${s.label}“ hast du ${v?.einheit||"keine Einheit"} gewählt. Gesucht ist ${s.einheit}.`:
   s.ganzzahl&&!Number.isInteger(leseDezimalzahl(v?.wert??"")??0)?`„${s.label}“ braucht eine ganze Anzahl. Prüfe das geforderte Aufrunden am Ende.`:`Prüfe bei „${s.label}“ den Ansatz ${s.formel} und die eingesetzten Größen.`;
  gruppen.set(k,[...(gruppen.get(k)??[]),h]);
 }
 return [...gruppen].map(([kategorie,hinweise])=>({...basis,kategorie,richtig:false,hinweis:hinweise.join(" ").slice(0,1200)}));
}
export function basisNacharbeit(a:MatheAufgabe,ziel:string,titel:string,r:MatheErgebnis):LernHinweis[]{return [{kategorie:r.kategorie,lernzielId:ziel,route:`/grundlagen/mathe#${ziel}`,thema:titel,richtig:r.richtig,hinweis:r.hinweis}];}
const zahlenZiele:Record<string,Record<string,string>>={
 ziegeldach:{schraege:"laengen",flaeche:"flaechen",deckbedarf:"bedarf",menge:"bedarf"},
 flachdach:{flaeche:"flaechen",menge:"bedarf",hoehe:"gefaelle"},sanierung:{widerstand:"waerme",uwert:"waerme",volumen:"masse"},
 schiefer:{flaeche:"flaechen",grundbedarf:"bedarf",bestellung:"bedarf"},metalldach:{bahnen:"bedarf",laenge:"bedarf"},fassade:{netto:"flaechen",grundbedarf:"bedarf",bestellung:"bedarf"},
};
export function projektZahlNacharbeit(p:BauProjekt,r:ProjektRechnung,richtig:boolean):LernHinweis[]{
 const ziel=zahlenZiele[p.id]?.[r.id];
 return [{kategorie:"rechenweg",lernzielId:ziel?`aufbau-${ziel}`:`werkstatt-${p.id}-bewegung`,route:ziel?`/grundlagen/mathe#aufbau-${ziel}`:`/bildtraining#bild-${p.id}-fehler`,thema:p.titel,richtig,hinweis:richtig?`„${r.frage}“: Der Rechenwert passt.`:`„${r.frage}“: ${r.tipp}`}];
}
export function projektAktivNacharbeit(p:BauProjekt,key:keyof BauProjekt["aktivitaeten"],antwort:AktivitaetAntwort):LernHinweis[]{
 const a=p.aktivitaeten[key],r=bewerteAktivitaet(a,antwort);
 const auftrag=key==="auftrag",ablauf=key==="ablauf";
 const kategorie:LernKategorie=auftrag?"leseverstehen":ablauf?"ablauf":p.id==="sanierung"?"befund":p.id==="metalldach"?"fachwissen":"wasserweg";
 const route=auftrag?"/sprache/deutsch#auftrag":`/bildtraining#bild-${p.id}-${ablauf?"folge":key==="befund"?"fehler":"massnahme"}`;
 return [{kategorie,lernzielId:auftrag?"deutsch-auftrag":`werkstatt-${p.id}-${ablauf?"ablauf":"zusammenhang"}`,route,thema:p.titel,richtig:r.richtig,
  hinweis:r.richtig?`„${a.titel}“ wurde richtig bearbeitet.`:`Bei „${a.titel}“ passen ${r.erreicht} von ${r.moeglich} bewerteten Zusammenhängen. ${auftrag?"Trenne gegebene Angaben, gesuchte Leistung und noch offene Fragen.":ablauf?"Ordne Prüfen und Planen vor der Ausführung ein; schließe mit der Kontrolle ab.":a.erklaerung}`}];
}
export function bildNacharbeit(a:BildAufgabe,antwort:AktivitaetAntwort):LernHinweis[]{
 const werkstatt=getWerkstattWiederholung(a.id),werkstattRoute=werkstattWiederholungRoute(a.id);
 if(werkstatt&&werkstattRoute){
  const r=bewerteAktivitaet(a.aktivitaet,antwort);
  const slug=a.id.replace(/^werkstatt-(falzziegel|biber-doppel)-/,"").replace(/-wiederholung$/,"");
  const kategorien:Record<string,LernKategorie>={messen:"rechenweg",ziegel:"begriffe",laengen:"rechenweg",breiten:"rechenweg",wasser:"wasserweg",verlegen:"ablauf",schnitt:"fachwissen",bearbeiten:"ablauf",befestigen:"fachwissen",kontrolle:"befund"};
  return [{kategorie:kategorien[slug]??"fachwissen",lernzielId:a.lernzielIds[0],route:werkstattRoute,thema:a.titel,richtig:r.richtig,hinweis:r.richtig?"Den dargestellten Werkstattschritt richtig wiedererkannt.":a.aktivitaet.erklaerung}];
 }
 const r=bewerteAktivitaet(a.aktivitaet,antwort),folge=a.art==="folge",bauteile=a.art==="bauteile";
 const kategorie:LernKategorie=folge?"ablauf":bauteile?"schichten":a.art==="massnahme"?"befund":a.projektId==="sanierung"?"schichten":a.projektId==="metalldach"?"fachwissen":"wasserweg";
 let hinweis=r.richtig?"Die dargestellten Zusammenhänge passen.":a.aktivitaet.erklaerung;
 if(!r.richtig&&a.aktivitaet.typ==="zuordnen"){
  const offen=a.aktivitaet.paare.filter(p=>antwort.zuordnung[p.id]!==p.id).map(p=>p.links);
  hinweis=`Prüfe ${offen.join(", ")}: Welche Funktion hat die jeweilige Ebene? Vergleiche die Lage mit der Beschreibung der Skizze.`;
 }
 if(!r.richtig&&a.aktivitaet.typ==="reihenfolge"){
  const index=a.aktivitaet.schritte.findIndex((s,i)=>antwort.reihenfolge[i]!==s.id);
  hinweis=`Ab Position ${index+1} weicht deine Folge ab. Prüfen und Abstimmen kommen vor dem Einbau; Kontrolle und Dokumentation schließen den Ablauf ab.`;
 }
 const art=a.art==="fehler"?"massnahme":a.art==="massnahme"?"fehler":a.art;
 return [{kategorie,lernzielId:`werkstatt-${a.projektId}-${folge?"ablauf":bauteile?"schichten":"zusammenhang"}`,route:`/bildtraining#bild-${a.projektId}-${art}`,thema:a.titel,richtig:r.richtig,hinweis}];
}
export function transferNacharbeit(a:ProjektTransfer,richtig:boolean,einheit:string):LernHinweis[]{
 const familie=pruefungsTransferFamilie(a.id);
 if(familie)return [{kategorie:einheit!==a.einheit?"einheiten":"rechenweg",lernzielId:pruefungsTransferRef(familie).lernzielIds[0],route:PRUEFUNGS_TRANSFER_ROUTE,thema:a.titel,richtig:richtig&&einheit===a.einheit,
  hinweis:einheit!==a.einheit?`Du hast ${einheit||"keine Einheit"} gewählt. Gesucht ist ${a.einheit}.`:richtig?"Rechenwert und Einheit passen im veränderten Auftrag.":`Prüfe den veränderten Auftrag und seine Bezugsgrößen. ${a.erklaerung}`}];
 const ziel:Record<string,string>={ziegeldach:"flaechen",flachdach:"gefaelle",sanierung:"waerme",schiefer:"bedarf",fassade:"flaechen"};
 const unit=ziel[a.projektId];
 return [{kategorie:einheit!==a.einheit?"einheiten":"rechenweg",lernzielId:unit?`aufbau-${unit}`:`werkstatt-${a.projektId}-bewegung`,route:unit?`/grundlagen/mathe#aufbau-${unit}`:`/bildtraining#bild-${a.projektId}-fehler`,thema:a.titel,richtig,
  hinweis:einheit!==a.einheit?`Du hast ${einheit} gewählt. Gesucht ist ${a.einheit}.`:richtig?"Rechenwert und Einheit passen.":`Gehe die gegebenen Größen und den Rechenansatz nochmals durch. ${a.erklaerung}`}];
}
