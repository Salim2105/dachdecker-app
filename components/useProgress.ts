"use client";
import { useSyncExternalStore } from "react";
import { progressStore } from "@/lib/progressStore";

export function useProgress() {
  const fortschritt = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );
  return { fortschritt, bewerte: progressStore.bewerte };
}
