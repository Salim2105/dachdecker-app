import { Fortschritt } from "@/components/fortschritt/Fortschritt";

import { KompetenzUebersicht } from "@/components/fortschritt/KompetenzUebersicht";

export const metadata = { title: "Fortschritt" };

export default function FortschrittPage() {
  return <><section id="kompetenzen"><KompetenzUebersicht/></section><Fortschritt /></>;
}
