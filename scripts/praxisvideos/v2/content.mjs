import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const work=path.join(root,'.praxisvideo-production/v2');fs.mkdirSync(work,{recursive:true});
const compiled=ts.transpileModule(fs.readFileSync(path.join(root,'lib/werkstattInhalte.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const authored={exports:{}};new Function('module','exports',compiled)(authored,authored.exports);
const units=authored.exports.WERKSTATT_PFADE.find(p=>p.id==='falzziegel').einheiten;
const original=JSON.parse(fs.readFileSync(path.join(root,'content/praxisvideos-inhalte.json'))).videos;
const texts={
 schnitt:[
  'Wir planen ein Falzziegel-Passstück am bodennahen Schulmodell. Zuerst legen wir Bezug, Anriss und Nutzstück fest. Die spätere Maschinenbedienung gehört zur Unterweisung am tatsächlichen Übungsplatz.',
  'Der Modellziegel ist zweiundvierzig Zentimeter lang und achtundzwanzig Zentimeter breit. Falz und Aufhängung müssen nach einem Zuschnitt gesondert beurteilt werden. Hier siehst du den Bezug an der Anschlusskante.',
  'Die Schablone liegt in derselben Orientierung wie das spätere Passstück. Lege sie an den vereinbarten Bezug. Prüfe obere und untere Anschlussmarke, bevor du die Verbindung einzeichnest.',
  'Der Stift verbindet die beiden bestätigten Anschlussmarken. Seine Spitze bleibt am Werkstück. Ein feiner, eindeutiger Strich macht sichtbar, welche Kontur später bearbeitet werden soll.',
  'Links liegt das benötigte Stück, rechts das Reststück. Kennzeichne beide Seiten ausdrücklich. Die Schnittlinie alleine sagt nicht, welches Stück nach der Bearbeitung erhalten bleiben muss.',
  'Kontrolliere die übertragene Form noch einmal mit der Schablone. Betrachte außerdem die verbleibende Aufhängung und die Falzbereiche. Eine passende Kontur bestätigt nicht automatisch die Eignung des Passstücks.',
  'Ein falscher Bezug verschiebt den gesamten Anriss. Entferne die ungeprüfte Markierung und übertrage die Anschlusskante erneut. Erst nach der Kontrolle von Linie, Nutzstück und Funktion folgt die Bearbeitung.'
 ],
 bearbeiten:[
  'Dieses Schulmodell zeigt den Ablauf einer stationär geführten Ziegelbearbeitung. Es erklärt Auflage, Anriss und Kontrolle. Einstellungen und Bedienung des echten Geräts werden am Übungsplatz unterwiesen.',
  'Das Werkstück liegt auf vorgesehenen Auflagen. Der Schnittbereich bleibt zugänglich, beide Seiten werden abgestützt. Das dargestellte Verfahren und seine Schutzeinrichtung gehören zu diesem Lehrmodell.',
  'Vergleiche Material und Anriss mit dem freigegebenen Auftrag. Prüfe die vorgesehene Schutzhaube und den Arbeitsbereich. Beginne erst, wenn das konkrete Verfahren mit der Betreuung geklärt ist.',
  'Lege den Ziegel am Bezug an und sichere seine vorgesehene Lage. Der geplante Schnitt verläuft durch den freien Bearbeitungsbereich. Die Auflagen dürfen weder kippen noch den Schnittweg versperren.',
  'Jetzt folgt der geführte Modell-Schnitt entlang des Anrisses. Die Werkzeugbewegung bleibt nachvollziehbar, das Werkstück bleibt abgestützt. Der Schnitt wird vollständig beendet, bevor das Reststück abgenommen wird.',
  'Nach dem Stillsetzen und Freigeben des Bearbeitungsbereichs wird das Reststück entfernt. Prüfe die Kontur mit dem Bezug und kontrolliere Kante, Risse und die verbleibenden Funktionsbereiche.',
  'Eine beschädigte Kante wird nicht einfach verdeckt eingebaut. Zeige die betroffene Stelle, kläre die Eignung und korrigiere den Befund. Kontrolliere anschließend dieselben Kriterien noch einmal.'
 ],
 verlegen:[
  'Wir verlegen vier Falzziegel im ausdrücklich vorgegebenen Schulmodell. Die Reihenfolge wird am kleinen Übungsfeld gezeigt. Sie ist keine allgemeine Verlegerichtung für jedes Produkt und jedes Dach.',
  'Unterscheide Aufhängung, Auflage und Falz. Die Ziegel hängen an den Traglatten, ihre seitlichen Bereiche greifen passend zusammen. Im Modell gelten vierunddreißig Zentimeter Decklänge und vierundzwanzig Zentimeter Deckbreite.',
  'A und B gehören in die untere Reihe, C und D in die obere. Behalte diese Zuordnung im Blick. Vor dem Einsetzen prüfst du die vorgesehene Lage der Latten und Bezugslinien.',
  'Setze zuerst A und danach B in ihre vorgegebenen Positionen. Führe die Aufhängung an die Traglatte und kontrolliere die Auflage. Der Nachbarziegel darf beim Zusammenfügen nicht hochgedrückt werden.',
  'Ergänze nun C und danach D in der oberen Reihe. Die Kopfüberdeckung und die seitliche Verbindung werden gemeinsam betrachtet. Jeder Ziegel wird in seine vorgesehene Lage geführt und anschließend kontrolliert.',
  'Betrachte die Verbindung aus der Nähe. Aufhängung, Auflage und Falzschluss müssen gleichzeitig passen. Vergleiche außerdem die Reihen mit den Bezugslinien, bevor du das Übungsfeld weiterdeckst.',
  'Hier sitzt ein Ziegel auf dem Nachbarfalz und steht hoch. Nimm das betroffene Teil zurück, führe es passend ein und kontrolliere erneut. Die Korrektur ist erst nach der zweiten Prüfung abgeschlossen.'
 ]
};
const checkpoints={schnitt:['schritt-2','a'],bearbeiten:['schritt-3','b'],verlegen:['schritt-1','a']};
const videos=Object.entries(texts).map(([slug,scripts])=>{
 const id=`werkstatt-falzziegel-${slug}`,old=original.find(v=>v.id===id);let time=0;
 const kapitel=old.kapitel.map((k,i)=>{const start=time;time+=scripts[i].split(/\s+/).length/2.3;return {...k,text:scripts[i],start:+start.toFixed(3),ende:+time.toFixed(3)};});
 const [kapitelId,suffix]=checkpoints[slug];
 return {...old,version:2,dauer:+time.toFixed(3),kapitel,transkript:scripts.join('\n\n'),lernpunkte:[{id:`${id}-mitmachen`,kapitelId,einheitId:id,aufgabeId:`${id}-${suffix}`}]};
});
const target=path.join(work,'content.json');let previous;
try{previous=JSON.parse(fs.readFileSync(target));}catch{}
for(const v of videos){const old=previous?.videos?.find(x=>x.id===v.id&&x.transkript===v.transkript);if(old){v.dauer=old.dauer;v.kapitel=v.kapitel.map((k,i)=>({...k,start:old.kapitel[i].start,ende:old.kapitel[i].ende}));}}
fs.writeFileSync(target,JSON.stringify({version:1,videos},null,2)+'\n');
fs.writeFileSync(path.join(work,'system.json'),JSON.stringify({systemkarte:authored.exports.WERKSTATT_SYSTEMKARTEN.falzziegel,einheiten:units.filter(u=>Object.keys(texts).includes(u.slug))},null,2)+'\n');
console.log(target);
