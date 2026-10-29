import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { WerkstattAufgabe } from "@/components/werkstatt/WerkstattAufgabe";
import { WerkstattSzene } from "@/components/werkstatt/WerkstattSzene";
import { WERKSTATT_SYSTEMKARTEN, getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { bewerteWerkstattAufgabe, emptyWerkstattAntwort } from "@/lib/werkstattStand";
import type { WerkstattAufgabe as Aufgabe, WerkstattAntwort } from "@/lib/werkstattTypen";

afterEach(cleanup);
const system = WERKSTATT_SYSTEMKARTEN.falzziegel;
function Harness({ task, initial }: {task:Aufgabe; initial?:WerkstattAntwort}) {
  const [answer, setAnswer] = useState(initial ?? emptyWerkstattAntwort(task));
  const [checked, setChecked] = useState(false);
  return <WerkstattAufgabe aufgabe={task} systemkarte={system} antwort={answer} geprueft={checked} bewertung={checked ? bewerteWerkstattAufgabe(task, answer) : undefined} onChange={a=>{setAnswer(a);setChecked(false);}} onPruefen={()=>setChecked(true)} onHilfe={()=>{}}/>;
}
const task = (slug:string) => getWerkstattEinheit(`werkstatt-falzziegel-${slug}`)!.aufgaben[0];

describe("Werkstatt: tatsächlich bedienbare Zeichenübungen", () => {
  it("behält einen falschen Anriss, zeigt die Vergleichslinie erst nach Abgabe und lässt nacharbeiten", () => {
    const a = task("schnitt");
    if(a.typ!=="anzeichnen")throw Error("fixture");
    const {container} = render(<Harness task={a}/>);
    expect(container.querySelector('[data-vergleich]')).toBeNull();
    const field = screen.getByRole("group",{name:"Zwei Bezugspunkte für deine Linie wählen"});
    const points = within(field).getAllByRole("button");
    points[0].focus();expect(document.activeElement).toBe(points[0]);
    fireEvent.click(points[0]);fireEvent.click(points[2]);
    fireEvent.click(screen.getByRole("button",{name:"Rechtes Stück behalten"}));
    expect(container.querySelector('[data-anriss]')?.getAttribute('d')).toBe(`M${a.punkte[0].x} ${a.punkte[0].y}L${a.punkte[2].x} ${a.punkte[2].y}`);
    expect(screen.getByText("NUTZSTÜCK")).toBeTruthy();expect(screen.getByText("RESTSTÜCK")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Meine Lösung prüfen"}));
    expect(screen.getByRole("status").textContent).toContain("0 von 3");
    expect(container.querySelector('[data-vergleich]')).toBeTruthy();
    expect(points.every(p=>(p as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"Noch einmal bearbeiten"}));
    expect(container.querySelector('[data-vergleich]')).toBeNull();
    expect(container.querySelector('[data-anriss]')).toBeTruthy();
    expect(screen.getByRole("button",{name:"Rechtes Stück behalten"}).getAttribute("aria-pressed")).toBe("true");
  });
  it("zeichnet kein Raster für unvollständige Angaben und verwendet den Startversatz in Anzeige und Bewertung gleich", () => {
    const original=task("laengen");if(original.typ!=="einteilen")throw Error("fixture");
    const a={...original,strecke:214,zielVersatz:10};
    const {container}=render(<Harness task={a}/>);
    const count=screen.getByRole("textbox",{name:"Anzahl der Abstände"});
    const offset=screen.getByRole("textbox",{name:"Startversatz (cm)"});
    fireEvent.change(count,{target:{value:"6"}});fireEvent.change(offset,{target:{value:"12abc"}});
    expect(container.querySelectorAll('[data-raster]')).toHaveLength(0);
    expect((screen.getByRole("button",{name:"Meine Lösung prüfen"}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(offset,{target:{value:"10"}});
    expect(container.querySelectorAll('[data-raster]')).toHaveLength(7);
    expect(screen.getByText("34 cm")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Meine Lösung prüfen"}));
    expect(screen.getByRole("status").textContent).toContain("3 von 3");
  });
  it("setzt Ziegel per nummerierter Liste, erhält falsche Plätze und bewertet erst nach Abschluss", () => {
    const a=task("verlegen");if(a.typ!=="verlegen")throw Error("fixture");
    render(<Harness task={a}/>);
    const pieces=screen.getByRole("group",{name:"1. Ein Teil wählen"});
    const choosePiece=(i:number)=>fireEvent.click(within(pieces).getAllByRole("button")[i]);
    const chooseTarget=(i:number)=>{const targets=screen.getAllByRole("group").find(g=>g.querySelector("legend")?.textContent?.startsWith("2. Einen Platz"))!;const button=within(targets).getAllByRole("button")[i];button.focus();expect(document.activeElement).toBe(button);fireEvent.click(button);};
    choosePiece(0);chooseTarget(1);choosePiece(1);chooseTarget(0);choosePiece(2);chooseTarget(2);choosePiece(3);chooseTarget(3);
    const order=screen.getByRole("list",{name:"Deine Verlegereihenfolge"});
    expect(within(order).getAllByRole("listitem")[0].textContent).toContain(a.ziele[1].label);
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Meine Lösung prüfen"}));
    expect(screen.getByRole("status").textContent).toContain("3 von 5");
    expect(screen.getByRole("list",{name:"Deine Verlegereihenfolge"}).textContent).toContain(a.ziele[1].label);
    fireEvent.click(screen.getByRole("button",{name:"Noch einmal bearbeiten"}));
    fireEvent.click(screen.getByRole("button",{name:"Deckfeld leeren"}));
    expect(screen.queryByRole("list",{name:"Deine Verlegereihenfolge"})).toBeNull();
  });
  it("schützt auch nummerierte Ziele und Bildklicks bei gesperrter Bearbeitung", () => {
    const a=task("schnitt");const changed=vi.fn();
    const {container}=render(<WerkstattAufgabe aufgabe={a} systemkarte={system} antwort={emptyWerkstattAntwort(a)} geprueft={false} disabled onChange={changed} onPruefen={()=>{}} onHilfe={()=>{}}/>);
    fireEvent.click(container.querySelector('svg circle')!);
    expect(changed).not.toHaveBeenCalled();
    expect(within(screen.getByRole("group",{name:"Zwei Bezugspunkte für deine Linie wählen"})).getAllByRole("button").every(b=>(b as HTMLButtonElement).disabled)).toBe(true);
    expect((screen.getByRole("button",{name:"Hinweis ansehen"}) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Werkstatt: unterschiedliche und inhaltlich beschriftete Ansichten",()=>{
  it("wechselt für dieselbe Einheit wirklich zwischen Draufsicht, Schnitt und Einzelziegel",()=>{
    const {container,rerender}=render(<WerkstattSzene systemkarte={system} szene="verlegen" ansicht="draufsicht"/>);
    expect(container.querySelector('[data-scene="dachfeld"]')).toBeTruthy();
    rerender(<WerkstattSzene systemkarte={system} szene="verlegen" ansicht="schnitt"/>);
    expect(container.querySelector('[data-scene="laengsschnitt"]')).toBeTruthy();
    expect(container.querySelector('[data-scene="dachfeld"]')).toBeNull();
    rerender(<WerkstattSzene systemkarte={system} szene="verlegen" ansicht="einzelziegel"/>);
    expect(container.querySelector('[data-scene="einzelziegel"]')).toBeTruthy();
  });
  it("trennt Biber-Höhenüberdeckung von benachbarter Überlappung und vergleicht Reihen je Latte",()=>{
    const biber=WERKSTATT_SYSTEMKARTEN["biber-doppel"];
    const {rerender}=render(<WerkstattSzene systemkarte={biber} szene="laengen" ansicht="schnitt"/>);
    expect(screen.getByText("15 cm Reihenabstand")).toBeTruthy();
    expect(screen.getByText("8 cm Höhenüberdeckung über zwei Reihenabstände")).toBeTruthy();
    expect(screen.getByText("23 cm Überlappung direkt benachbarter Reihen")).toBeTruthy();
    rerender(<WerkstattSzene systemkarte={biber} szene="kronenvergleich" ansicht="schnitt"/>);
    expect(screen.getByText("Eine Reihe an jeder Latte")).toBeTruthy();
    expect(screen.getByText("Zwei Reihen an einer Latte")).toBeTruthy();
  });
  it("öffnet eine lesbare eigene Bildkopie und gibt nach dem Schließen den Fokus zurück",()=>{
    const proto=HTMLDialogElement.prototype;
    Object.defineProperty(proto,"showModal",{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute("open","");}});
    Object.defineProperty(proto,"close",{configurable:true,value:function(this:HTMLDialogElement){this.removeAttribute("open");this.dispatchEvent(new Event("close"));}});
    try {
      render(<WerkstattSzene systemkarte={system} szene="messen"/>);
      const opener=screen.getByRole("button",{name:"Zeichnung vergrößern"});opener.focus();fireEvent.click(opener);
      const dialog=screen.getByRole("dialog");
      const image=within(dialog).getByRole("img") as HTMLImageElement;
      expect(image.src).toMatch(/^data:image\/svg\+xml/);
      expect(decodeURIComponent(image.src)).toContain('width="640"');
      expect(decodeURIComponent(image.src)).toContain("Bezug finden und Maß übertragen");
      fireEvent.click(within(dialog).getByRole("button",{name:"Zeichnung schließen"}));
      expect(screen.queryByRole("dialog")).toBeNull();expect(document.activeElement).toBe(opener);
    } finally {
      delete (proto as unknown as Record<string,unknown>).showModal;
      delete (proto as unknown as Record<string,unknown>).close;
    }
  });
  it("zeigt die Wasserwege schrittweise und benennt getrennte Ebenen",()=>{
    const {container,rerender}=render(<WerkstattSzene systemkarte={system} szene="wasser" ansicht="schnitt" wasser={0} schritt={0}/>);
    const initial=container.querySelector('[data-scene="schichten"]')!.innerHTML;
    rerender(<WerkstattSzene systemkarte={system} szene="wasser" ansicht="schnitt" wasser={4} schritt={3}/>);
    expect(container.querySelector('[data-scene="schichten"]')!.innerHTML).not.toBe(initial);
    expect(screen.getByText("Zum vorgesehenen Traufanschluss")).toBeTruthy();
    expect(screen.getByRole("img").querySelector("desc")?.textContent).toContain("Schnitt");
  });
});
