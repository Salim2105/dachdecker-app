import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(()=>{vi.resetModules();localStorage.clear();vi.stubGlobal("indexedDB",new IDBFactory());vi.stubGlobal("Blob",NodeBlob);});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});

describe("Vollständige Werkstattsicherung",()=>{
  it("stellt beide Praxiswege, einen begonnenen digitalen Versuch und private Bildbytes wieder her",async()=>{
    const storage=await import("@/lib/lernSpeicher");
    const backup=await import("@/lib/backup");
    const praxis=await import("@/lib/praxisVorbereitung");
    const werkstatt=await import("@/lib/werkstattStand");
    const {WERKSTATT_PFADE}=await import("@/lib/werkstattInhalte");
    await storage.initializeStorage();
    const ids=["werkstatt-falzziegel","werkstatt-biber-doppel"];
    const original:Record<string,string>={};
    for(const id of ids){
      const s=praxis.neuePraxisVorbereitung(id,1000);
      s.notiz=`Eigene Notiz: ${id}`;
      s.zeichnung="teilweise";
      praxis.speicherePraxisVorbereitung(s);
      original[praxis.praxisVorbereitungKey(id)]=JSON.stringify(s);
      const key=`drawing:photo:${s.id}`;
      await storage.writeBlob(key,new Blob([new Uint8Array([0,13,254,255])],{type:"image/png"}));
      storage.appStorage.setItem(`drawing:draft:${s.id}`,JSON.stringify({photoKey:key}));
    }
    const e=WERKSTATT_PFADE[0].einheiten.find(e=>e.slug==="laengen")!;
    const s=werkstatt.neuerWerkstattStand(e,1000);
    s.antworten[e.aufgaben[0].id].anzahl="0,";
    werkstatt.speichereWerkstattStand(s);
    const digital=JSON.stringify(s);
    const snapshot=backup.pruefeArchiv(await backup.exportiereArchiv())!;
    expect(snapshot.dateien.size).toBe(2);
    for(const [k,v]of Object.entries(original))expect(snapshot.daten[k]).toBe(v);
    expect(snapshot.daten[werkstatt.werkstattKey(e.id)]).toBe(digital);
    for(const key of Object.keys(storage.appStorage))storage.appStorage.removeItem(key);
    for(const key of snapshot.dateien.keys())await storage.deleteBlob(key);
    await backup.importiereArchiv(snapshot);
    for(const [k,v]of Object.entries(original))expect(storage.appStorage.getItem(k)).toBe(v);
    expect(werkstatt.ladeWerkstattStand(e.id)).toEqual(s);
    for(const key of snapshot.dateien.keys())expect(new Uint8Array(await (await storage.readBlob(key))!.arrayBuffer())).toEqual(new Uint8Array([0,13,254,255]));
  });
});
