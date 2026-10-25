import { beforeEach, describe, expect, it } from "vitest";
import { appStorage } from "@/lib/lernSpeicher";
import { FEEDBACK_KEY, feedbackBereich, feedbackFehler, feedbackHref, feedbackKontext, feedbackPayload, feedbackText, ladeFeedback, leseFeedback, merkeFeedbackAktion, neuerFeedbackEntwurf, speichereFeedback, wechsleFeedbackEntwurf } from "@/lib/feedback";
beforeEach(() => appStorage.clear());
describe("Lokale Rückmeldungen", () => {
  it("akzeptiert nur lokale Bereiche und begrenzte Aufgabenbezüge", () => {
    for (const value of ["https://fremd.de", "//fremd.de", "/../privat", "/lernen?token=geheim", "javascript:alert(1)"]) expect(feedbackBereich(value)).toBe("/");
    const href=feedbackHref("/lernen/lf08#lf08-l01-e01", "lf08-042", "Dachfläche bestimmen?");
    expect(feedbackKontext(href.split("?")[1])).toEqual({ bereich:"/lernen/lf08#lf08-l01-e01",aufgabeId:"lf08-042",aufgabeText:"Dachfläche bestimmen?" });
    expect(feedbackKontext("bereich=%2Flernen&aufgabe=..%2Fprivat")).toEqual({bereich:"/lernen"});
  });
  it("teilt ausschließlich ausgewählte Bogenangaben und hängt den Aufgabentext nur nach Einwilligung an", () => {
    const d={...neuerFeedbackEntwurf({bereich:"/grundlagen/mathe#laengen",aufgabeId:"laenge-1",aufgabeText:"Wie viele Zentimeter?"}),beobachtung:"  Einheit unklar  ",erwartet:"  Ein Beispiel  ",privateNotiz:"Nicht weitergeben"};
    expect(feedbackPayload(d)).toMatchObject({beobachtung:"Einheit unklar",erwartet:"Ein Beispiel"});
    expect(JSON.stringify(feedbackPayload(d))).not.toContain("Nicht weitergeben");
    expect(feedbackText(d)).not.toContain("Wie viele Zentimeter?");
    expect(feedbackText({...d,aufgabeAnhaengen:true})).toContain("Wie viele Zentimeter?");
    expect(feedbackFehler({...d,erwartet:" "})).toContain("erwartet");
  });
  it("bewahrt ungeteilte Entwürfe beim Wechsel und protokolliert mehrfaches Teilen ohne Doppelzeile", () => {
    let s=ladeFeedback()!;const original={...s.entwurf,beobachtung:"Mein offener Entwurf",erwartet:"Hilfe"};s={...s,entwurf:original};
    const neu=neuerFeedbackEntwurf({bereich:"/zeichnen"});s=wechsleFeedbackEntwurf(s,neu);
    expect(s.entwuerfe).toEqual([original]);
    s=wechsleFeedbackEntwurf(s,original);expect(s.entwurf.beobachtung).toBe("Mein offener Entwurf");
    s=merkeFeedbackAktion(s,"kopiert",100);s=merkeFeedbackAktion(s,"geteilt",200);speichereFeedback(s);
    expect(ladeFeedback()?.eintraege).toHaveLength(1);expect(ladeFeedback()?.eintraege[0].aktion).toBe("geteilt");
    expect(ladeFeedback()?.entwurf).toEqual(original);
  });
  it("überschreibt beschädigte Daten beim Lesen nicht", () => {
    const raw='{"version":1,"entwurf":{"bereich":"https://fremd.de"},"eintraege":[]}';appStorage.setItem(FEEDBACK_KEY,raw);
    expect(ladeFeedback()).toBeNull();expect(appStorage.getItem(FEEDBACK_KEY)).toBe(raw);
    expect(leseFeedback("[]")).toBeNull();
  });
});
