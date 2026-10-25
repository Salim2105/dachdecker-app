import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const { flush } = vi.hoisted(() => ({ flush: vi.fn() }));
vi.mock("@/lib/lernSpeicher", () => ({ flushStorage: flush }));
class Worker extends EventTarget {
  state = "installed";
  scriptURL = "http://localhost:3200/sw.js";
  postMessage = vi.fn();
}
function registration(waiting: Worker | null, scope = "http://localhost:3200/") {
  return Object.assign(new EventTarget(), { waiting, active: waiting, installing: null, scope, update: vi.fn(async () => {}), unregister: vi.fn(async () => true) });
}
const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
let worker: Worker;
let reg: ReturnType<typeof registration>;
let container: EventTarget & { controller: Worker | null; register: ReturnType<typeof vi.fn>; getRegistrations: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  flush.mockReset(); flush.mockResolvedValue(undefined);
  worker = new Worker(); reg = registration(worker);
  container = Object.assign(new EventTarget(), { controller: new Worker(), register: vi.fn(async () => reg), getRegistrations: vi.fn(async () => [reg]) });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Safari");
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals();
  if (original) Object.defineProperty(navigator, "serviceWorker", original);
  else Reflect.deleteProperty(navigator, "serviceWorker");
});
describe("Ein Update unterbricht keine offene Aufgabe", () => {
  it("bietet ein wartendes Update an und aktiviert erst nach Klick und dauerhaftem Speichern", async () => {
    let fertig!: () => void;
    flush.mockReturnValue(new Promise<void>(resolve => { fertig = resolve; }));
    render(<ServiceWorkerRegister />);
    await screen.findByRole("button", { name: "Speichern und aktualisieren" });
    expect(flush).not.toHaveBeenCalled(); expect(worker.postMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Speichern und aktualisieren" }));
    expect(flush).toHaveBeenCalledOnce(); expect(worker.postMessage).not.toHaveBeenCalled();
    await act(async () => { fertig(); });
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ quelle: "dachdecker-app", typ: "UPDATE_AKTIVIEREN" });
  });
  it("lässt bei Speicherfehlern die Aufgabe offen und erlaubt einen erneuten Versuch", async () => {
    flush.mockRejectedValueOnce(new Error("Speicher voll"));
    render(<ServiceWorkerRegister />);
    fireEvent.click(await screen.findByRole("button", { name: "Speichern und aktualisieren" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("dauerhaft gespeichert"));
    expect(worker.postMessage).not.toHaveBeenCalled();
    const erneut = screen.getByRole("button", { name: "Speichern und aktualisieren" }) as HTMLButtonElement;
    expect(erneut.disabled).toBe(false);
    fireEvent.click(erneut);
    await waitFor(() => expect(worker.postMessage).toHaveBeenCalledOnce());
  });
  it("erzwingt bei Aktivierung in einem anderen Tab keinen Wechsel dieser offenen Aufgabe", async () => {
    reg.waiting = null;
    render(<ServiceWorkerRegister />);
    await waitFor(() => expect(container.register).toHaveBeenCalledOnce());
    const andererTab = new Worker(); andererTab.state = "activated";
    await act(async () => { container.controller = andererTab; container.dispatchEvent(new Event("controllerchange")); });
    expect(await screen.findByRole("button", { name: "Speichern und aktualisieren" })).toBeTruthy();
    expect(flush).not.toHaveBeenCalled(); expect(andererTab.postMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Später" }));
    expect(screen.queryByRole("button", { name: "Speichern und aktualisieren" })).toBeNull();
    expect(flush).not.toHaveBeenCalled();
  });
  it("entfernt in Electron nur die eigenen Registrierungen und Offline-Caches", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Dachdecker Electron");
    const fremderWorker = new Worker(); fremderWorker.scriptURL = "http://localhost:3200/andere-app/sw.js";
    const fremd = registration(fremderWorker, "http://localhost:3200/andere-app/");
    container.getRegistrations.mockResolvedValue([reg, fremd]);
    const caches = { keys: vi.fn(async () => ["dachdecker-10", "dachdecker-lernwerkstatt-root-20-abc", "andere-app", "dachdecker-fremd"]), delete: vi.fn(async () => true) };
    vi.stubGlobal("caches", caches);
    render(<ServiceWorkerRegister />);
    await waitFor(() => expect(caches.delete).toHaveBeenCalledTimes(2));
    expect(reg.unregister).toHaveBeenCalledOnce(); expect(fremd.unregister).not.toHaveBeenCalled();
    expect(caches.delete).toHaveBeenCalledWith("dachdecker-10");
    expect(caches.delete).not.toHaveBeenCalledWith("andere-app");
    expect(container.register).not.toHaveBeenCalled();
  });
});
