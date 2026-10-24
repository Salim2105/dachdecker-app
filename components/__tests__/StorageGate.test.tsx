import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const memory = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let status = { phase: "idle", backend: "local", error: null as string | null, pending: 0 };
  return {
    listeners,
    get: () => status,
    publish: (change: Partial<typeof status>) => { status = { ...status, ...change }; listeners.forEach((listener) => listener()); },
    initialize: vi.fn<() => Promise<void>>(), retry: vi.fn<() => Promise<void>>(), getItem: vi.fn(),
  };
});
vi.mock("@/lib/lernSpeicher", () => ({
  getStorageStatus: memory.get,
  subscribeStorageStatus: (listener: () => void) => { memory.listeners.add(listener); return () => { memory.listeners.delete(listener); }; },
  initializeStorage: memory.initialize, retryStorageWrites: memory.retry, appStorage: { getItem: memory.getItem },
}));
import { StorageGate } from "@/components/StorageGate";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  memory.listeners.clear();
  memory.publish({ phase: "idle", backend: "local", error: null, pending: 0 });
  memory.initialize.mockReset(); memory.retry.mockReset(); memory.getItem.mockReset();
  document.documentElement.dataset.theme = "dark";
});
afterEach(cleanup);

describe("StorageGate", () => {
  it("montiert Aufgaben erst nach dem Laden und übernimmt das gespeicherte Theme", async () => {
    const loading = deferred();
    memory.initialize.mockReturnValue(loading.promise);
    memory.getItem.mockReturnValue("light");
    render(<StorageGate><input aria-label="Aufgabenantwort" defaultValue="gespeichert" /></StorageGate>);
    expect(screen.queryByLabelText("Aufgabenantwort")).toBeNull();
    await act(async () => { memory.publish({ phase: "ready", backend: "indexeddb" }); loading.resolve(); });
    expect((screen.getByLabelText("Aufgabenantwort") as HTMLInputElement).value).toBe("gespeichert");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("behält Eingaben bei einem späteren Speicherfehler und erlaubt erneutes Speichern", async () => {
    memory.initialize.mockResolvedValue();
    memory.retry.mockResolvedValue();
    render(<StorageGate><input aria-label="Aufgabenantwort" /></StorageGate>);
    const input = await screen.findByLabelText("Aufgabenantwort");
    fireEvent.change(input, { target: { value: "Regenrinne" } });
    act(() => memory.publish({ phase: "error", backend: "indexeddb", error: "Speicher voll." }));
    expect(screen.getByRole("alert").textContent).toContain("Speicher voll.");
    expect((screen.getByLabelText("Aufgabenantwort") as HTMLInputElement).value).toBe("Regenrinne");
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    await act(async () => {});
    expect(memory.retry).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Aufgabenantwort")).toBe(input);
  });

  it("warnt beim Schließen, solange Schreibvorgänge laufen oder fehlgeschlagen sind", async () => {
    memory.initialize.mockResolvedValue();
    render(<StorageGate><p>Inhalt</p></StorageGate>);
    await screen.findByText("Inhalt");
    act(() => memory.publish({ pending: 1 }));
    const pending = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(pending);
    expect(pending.defaultPrevented).toBe(true);
    act(() => memory.publish({ pending: 0, phase: "ready", error: null }));
    const saved = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(saved);
    expect(saved.defaultPrevented).toBe(false);
  });
});
