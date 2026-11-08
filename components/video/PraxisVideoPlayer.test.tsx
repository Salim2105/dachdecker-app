import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PraxisVideoPlayer } from "./PraxisVideoPlayer";
import type { PraxisVideo } from "@/lib/praxisVideoTypen";
import { appStorage, retryStorageWrites } from "@/lib/lernSpeicher";
import { ladePraxisVideoEinstellungen, ladePraxisVideoPosition, speicherePraxisVideoEinstellungen, speicherePraxisVideoPosition } from "@/lib/praxisVideoStand";
import { getWerkstattPraxisVideo } from "@/lib/praxisVideoInhalte";
import { ladePraxisVideoPaket, loeschePraxisVideoPaket, praxisVideoPaketStatus } from "@/lib/praxisVideoDownloads";

const medienStand = vi.hoisted(() => ({ download: false, assets: [
  { id: "werkstatt-falzziegel-schnitt.mp4", url: "/praxisvideos/v1/werkstatt-falzziegel-schnitt.mp4", bytes: 1048576, sha256: "1234567890abcdef".repeat(4), typ: "video" as const },
  { id: "werkstatt-falzziegel-schnitt.vtt", url: "/praxisvideos/v1/werkstatt-falzziegel-schnitt.vtt", bytes: 300, sha256: "234567890abcdef1".repeat(4), typ: "untertitel" as const },
  { id: "werkstatt-falzziegel-schnitt.webp", url: "/praxisvideos/v1/werkstatt-falzziegel-schnitt.webp", bytes: 1000, sha256: "34567890abcdef12".repeat(4), typ: "bild" as const },
] }));
vi.mock("@/lib/praxisVideoMedien", () => ({
  praxisVideoMedien: (video: PraxisVideo) => ({ video: { url: `/praxisvideos/v1/${video.id}.mp4` }, untertitel: { url: `/praxisvideos/v1/${video.id}.vtt` }, poster: { url: `/praxisvideos/v1/${video.id}.webp` }, assets: medienStand.download ? medienStand.assets : [] }),
  praxisVideoClipPaket: () => ({ id: "clip-werkstatt-falzziegel-schnitt", titel: "Schnitt anzeichnen", bytes: medienStand.assets.reduce((summe, asset) => summe + asset.bytes, 0), assets: medienStand.assets }), praxisVideoDachPaket: () => ({ assets: [] }),
}));
vi.mock("@/lib/praxisVideoDownloads", () => ({
  ladePraxisVideoPaket: vi.fn(), loeschePraxisVideoPaket: vi.fn(), praxisVideoPaketStatus: vi.fn(),
  subscribePraxisVideoDownloads: () => () => {},
}));
const vorlage = getWerkstattPraxisVideo("falzziegel", "schnitt")!;
const clip: PraxisVideo = { ...vorlage, titel: "Schnitt am Modell anzeichnen",
  kapitel: [{ id: "bezug", titel: "Bezug festlegen", start: 0, ende: 20, text: "Lege die Bezugskante fest." }, { id: "markierung", titel: "Schnitt markieren", start: 20, ende: vorlage.dauer, text: "Markiere das Nutzstück." }], transkript: "Bezug prüfen. Schnitt anzeichnen. Nutzstück kontrollieren." };
type TrackList = TextTrackList & { dispatchEvent(event: Event): boolean };
let tracks: WeakMap<HTMLMediaElement, TrackList>;
beforeEach(() => {
  medienStand.download = false;
  vi.mocked(ladePraxisVideoPaket).mockReset().mockResolvedValue(undefined);
  vi.mocked(loeschePraxisVideoPaket).mockReset().mockResolvedValue({ speicherFreigegeben: true });
  vi.mocked(praxisVideoPaketStatus).mockReset().mockResolvedValue({ status: "fehlt", bytes: 0 });
  appStorage.clear(); tracks = new WeakMap();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLMediaElement.prototype, "textTracks", "get").mockImplementation(function(this: HTMLMediaElement) {
    if (!tracks.has(this)) {
      const track = { kind: "captions", mode: "disabled" };
      tracks.set(this, Object.assign(new EventTarget(), { 0: track, length: 1, [Symbol.iterator]: function* () { yield track; } }) as unknown as TrackList);
    }
    return tracks.get(this)!;
  });
});
afterEach(async () => { cleanup(); vi.restoreAllMocks(); await retryStorageWrites(); });
const film = () => screen.getByLabelText(clip.titel) as HTMLVideoElement;
function metadata(video = film()) { Object.defineProperty(video, "duration", { value: clip.dauer, configurable: true }); fireEvent.loadedMetadata(video); }

describe("Praxisvideo mit unabhängigen Ton- und Untertitelspuren", () => {
  it("zeigt auch bei einem Fehler des source-Elements den Hinweis und erhält den Sprechertext", () => {
    render(<PraxisVideoPlayer video={clip} />);
    fireEvent(film().querySelector("source")!, new Event("error", { bubbles: false }));
    expect(screen.getByRole("status").textContent).toContain("Der Film kann gerade nicht geladen werden.");
    fireEvent.click(screen.getByText("Kapitel und vollständigen Text öffnen"));
    expect(screen.getByText(clip.transkript)).toBeDefined();
  });
  it("verwendet native Bedienelemente, lädt erst auf Wunsch und startet keine Wiedergabe selbst", () => {
    const onPlay = vi.fn(); render(<PraxisVideoPlayer video={clip} onPlay={onPlay} />);
    const video = film();
    expect(video.controls).toBe(true); expect(video.playsInline).toBe(true); expect(video.preload).toBe("none"); expect(video.autoplay).toBe(false);
    expect(video.querySelector("source")?.getAttribute("src")).toBe(`/praxisvideos/v1/${clip.id}.mp4`);
    expect(video.querySelector("track")?.getAttribute("kind")).toBe("captions");
    expect(video.querySelector("track")?.getAttribute("src")).toBe(`/praxisvideos/v1/${clip.id}.vtt`);
    expect(onPlay).not.toHaveBeenCalled(); expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    fireEvent.play(video); expect(onPlay).toHaveBeenCalledExactlyOnceWith(clip);
  });

  it("erlaubt alle vier Kombinationen ohne Seek, Neustart oder Austausch des Films", () => {
    render(<PraxisVideoPlayer video={clip} />); const video = film(); metadata(video); video.currentTime = 42;
    const captions = video.textTracks[0];
    expect(video.muted).toBe(false); expect(captions.mode).toBe("showing");
    fireEvent.click(screen.getByRole("button", { name: "Sprecher: An" }));
    expect(video.muted).toBe(true); expect(captions.mode).toBe("showing");
    fireEvent.click(screen.getByRole("button", { name: "Untertitel: An" }));
    expect(video.muted).toBe(true); expect(captions.mode).toBe("disabled");
    fireEvent.click(screen.getByRole("button", { name: "Sprecher: Aus" }));
    expect(video.muted).toBe(false); expect(captions.mode).toBe("disabled");
    fireEvent.click(screen.getByRole("button", { name: "Untertitel: Aus" }));
    expect(video.muted).toBe(false); expect(captions.mode).toBe("showing");
    expect(film()).toBe(video); expect(video.currentTime).toBe(42); expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(ladePraxisVideoEinstellungen()).toEqual({ sprecher: true, untertitel: true });
  });

  it("übernimmt native Lautstärke- und Untertitelschalter und stellt die Geräteeinstellung wieder her", () => {
    render(<PraxisVideoPlayer video={clip} />); const video = film(); metadata(video);
    video.muted = true; fireEvent.volumeChange(video);
    video.textTracks[0].mode = "disabled";
    act(() => { (video.textTracks as TrackList).dispatchEvent(new Event("change")); });
    expect(screen.getByRole("button", { name: "Sprecher: Aus" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Untertitel: Aus" }).getAttribute("aria-pressed")).toBe("false");
    cleanup(); render(<PraxisVideoPlayer video={clip} />);
    expect(film().muted).toBe(true); expect(film().textTracks[0].mode).toBe("disabled");
  });

  it("stellt die versionierte Position wieder her, erhält sie vor Metadaten und sichert bei Hintergrund, Navigation und Unmount", () => {
    speicherePraxisVideoPosition(clip.id, 13);
    const first = render(<PraxisVideoPlayer video={clip} />); first.unmount();
    expect(ladePraxisVideoPosition(clip.id)?.position).toBe(13);
    const view = render(<PraxisVideoPlayer video={clip} />); const video = film(); metadata(video);
    expect(video.currentTime).toBe(13);
    video.currentTime = 18;
    vi.spyOn(document, "hidden", "get").mockReturnValue(true); fireEvent(document, new Event("visibilitychange"));
    expect(ladePraxisVideoPosition(clip.id)?.position).toBe(18);
    video.currentTime = 21; fireEvent(window, new Event("popstate")); expect(ladePraxisVideoPosition(clip.id)?.position).toBe(21);
    video.currentTime = 23; view.unmount(); expect(ladePraxisVideoPosition(clip.id)).toMatchObject({ videoVersion: 1, position: 23 });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("bietet Tempo, Kapitel und den lesbaren Sprechertext ohne Autoplay an", () => {
    render(<PraxisVideoPlayer video={clip} />); const video = film(); metadata(video);
    fireEvent.change(screen.getByRole("combobox", { name: "Tempo" }), { target: { value: "0.75" } }); expect(video.playbackRate).toBe(.75);
    expect(Array.from(screen.getByRole("combobox", { name: "Tempo" }).querySelectorAll("option")).map(option => option.value)).toEqual(["0.5", "0.75", "1", "1.25"]);
    fireEvent.click(screen.getByText("Kapitel und vollständigen Text öffnen"));
    fireEvent.click(screen.getByRole("button", { name: "0:20 Schnitt markieren" }));
    expect(video.currentTime).toBe(20); expect(ladePraxisVideoPosition(clip.id)?.position).toBe(20);
    expect(screen.getByText(clip.transkript)).toBeDefined(); expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("synchronisiert zwei eingebettete Filme mit derselben Geräteeinstellung", () => {
    render(<><PraxisVideoPlayer video={clip} /><PraxisVideoPlayer video={{ ...clip, id: "werkstatt-falzziegel-verlegen", slug: "verlegen", titel: "Verlegen" }} /></>);
    act(() => { speicherePraxisVideoEinstellungen({ sprecher: false, untertitel: true }); });
    expect(screen.getAllByRole("button", { name: "Sprecher: Aus" })).toHaveLength(2);
    expect(film().muted).toBe(true);
  });
  it.each([
    { sprecher: true, untertitel: true }, { sprecher: false, untertitel: true },
    { sprecher: true, untertitel: false }, { sprecher: false, untertitel: false },
  ])("stellt die Geräteeinstellung $sprecher / $untertitel auch vor Wiedergabe wieder her", einstellungen => {
    speicherePraxisVideoEinstellungen(einstellungen);
    render(<PraxisVideoPlayer video={clip} />);
    metadata();
    expect(film().muted).toBe(!einstellungen.sprecher);
    expect(film().textTracks[0].mode).toBe(einstellungen.untertitel ? "showing" : "disabled");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it("stoppt einen Film bei gesperrter Bearbeitung und erfasst im Hintergrund keinen PLAY-Hinweis", () => {
    const onPlay = vi.fn(); const view = render(<PraxisVideoPlayer video={clip} onPlay={onPlay} />);
    metadata(); film().currentTime = 17;
    view.rerender(<PraxisVideoPlayer video={clip} onPlay={onPlay} disabled />);
    expect(ladePraxisVideoPosition(clip.id)?.position).toBe(17);
    fireEvent.play(film()); expect(onPlay).not.toHaveBeenCalled();
    view.rerender(<PraxisVideoPlayer video={clip} onPlay={onPlay} />);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent.play(film()); expect(onPlay).not.toHaveBeenCalled();
  });
  it("lädt erst auf ausdrücklichen Wunsch ein Paket und zeigt einen fehlgeschlagenen Download verständlich an", async () => {
    medienStand.download = true;
    vi.mocked(ladePraxisVideoPaket).mockRejectedValue(new Error("Der Gerätespeicher ist voll."));
    render(<PraxisVideoPlayer video={clip} />);
    expect(ladePraxisVideoPaket).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Video offline speichern" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Der Gerätespeicher ist voll.");
    expect(screen.getByRole("button", { name: "Video offline speichern" })).toBeDefined();
  });
  it("erklärt nach dem Entfernen eines Pakets zurückbehaltene Videodaten bei fehlender Fenstersperre", async () => {
    medienStand.download = true;
    vi.mocked(praxisVideoPaketStatus).mockResolvedValue({ status: "gespeichert", bytes: 1024 * 1024 });
    vi.mocked(loeschePraxisVideoPaket).mockResolvedValue({ speicherFreigegeben: false });
    render(<PraxisVideoPlayer video={clip} />);
    fireEvent.click(await screen.findByRole("button", { name: "Offline-Videopaket löschen" }));
    expect(await screen.findByText(/Videodaten bleiben vorerst im Gerätespeicher/)).toBeDefined();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Offline-Videopaket löschen" })).toBeNull());
    expect(screen.getByRole("button", { name: "Video offline speichern" })).toBeDefined();
  });
});
