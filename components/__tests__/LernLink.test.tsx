import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {LernLink} from "@/components/LernLink";
import {flushStorage} from "@/lib/lernSpeicher";
import {wechsleLernziel} from "@/lib/lernNavigation";
vi.mock("@/lib/lernSpeicher",()=>({flushStorage:vi.fn()}));
vi.mock("@/lib/lernNavigation",()=>({wechsleLernziel:vi.fn()}));
beforeEach(()=>vi.clearAllMocks());afterEach(cleanup);
describe("Sprung zur passenden Übung",()=>{
 it("merkt die letzte Eingabe vor dem Speichern und öffnet erst danach die genaue Einheit",async()=>{
  let fertig!:()=>void;vi.mocked(flushStorage).mockReturnValue(new Promise<void>(r=>{fertig=r;}));
  const eingabe=vi.fn();render(<LernLink href="/grundlagen/mathe#aufbau-laengen" onClick={eingabe}>Passende Übung</LernLink>);
  fireEvent.click(screen.getByRole("link"));expect(eingabe).toHaveBeenCalledOnce();expect(flushStorage).toHaveBeenCalledOnce();expect(wechsleLernziel).not.toHaveBeenCalled();
  expect(eingabe.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(flushStorage).mock.invocationCallOrder[0]);
  fertig();await waitFor(()=>expect(wechsleLernziel).toHaveBeenCalledWith("/grundlagen/mathe#aufbau-laengen"));
 });
 it("bleibt bei einem Speicherfehler auf der bisherigen Aufgabe und erlaubt einen erneuten Versuch",async()=>{
  vi.mocked(flushStorage).mockRejectedValueOnce(new Error("Speicher voll"));render(<LernLink href="/bildtraining#bild-flachdach-massnahme">Übung öffnen</LernLink>);
  fireEvent.click(screen.getByRole("link"));await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("nicht dauerhaft gespeichert"));
  expect(wechsleLernziel).not.toHaveBeenCalled();expect(screen.getByRole("link").getAttribute("aria-busy")).toBeNull();
 });
 it("lässt eine begonnene Navigation nicht nachträglich eine inzwischen andere Seite ersetzen",async()=>{
  let fertig!:()=>void;vi.mocked(flushStorage).mockReturnValue(new Promise<void>(r=>{fertig=r;}));const v=render(<LernLink href="/projekte#ziegeldach">Projekt</LernLink>);
  fireEvent.click(screen.getByRole("link"));v.unmount();fertig();await Promise.resolve();expect(wechsleLernziel).not.toHaveBeenCalled();
 });
});
