import { LernLink as Link } from "@/components/LernLink";
import type { LernHinweis } from "@/lib/lernHinweise";
export function Nacharbeit({hinweise,hilfen=[]}:{hinweise?:LernHinweis[];hilfen?:string[]}){
 const offen=(hinweise??[]).filter(h=>!h.richtig||hilfen.length>0);
 if(!offen.length)return null;
 return <aside className="my-5 rounded-xl border p-4" aria-label="Gezielt weiterüben" style={{borderColor:"var(--border)",background:"var(--surface)"}}><h3 className="font-semibold">Dein nächster Übungsschritt</h3><ul className="mt-3 space-y-4">{offen.map((h,i)=><li key={`${h.lernzielId}:${h.kategorie}:${i}`}><p className="text-sm leading-relaxed">{h.richtig?"Du hast eine Hilfe genutzt. Festige diesen Zusammenhang später mit einer weiteren Aufgabe.":h.hinweis}</p><Link className="mt-2 inline-flex min-h-11 items-center underline" href={h.route}>Passende Erklärung und Übung öffnen →</Link></li>)}</ul><Link href="/lernhilfe" className="mt-3 inline-flex min-h-11 items-center text-sm underline">Alle persönlichen Lernhinweise ansehen →</Link></aside>;
}
