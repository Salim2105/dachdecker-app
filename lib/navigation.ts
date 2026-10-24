export const WERKSTATT_NAV = [
  { href: "/", label: "Meine Übersicht", kurz: "Übersicht", icon: "M3 11l9-8 9 8M5 10v10h14V10", hinweis: "Dein nächster Schritt" },
  { href: "/lernen", label: "Lernpfad", kurz: "Lernpfad", icon: "M4 5h16v14H4zM4 9h16M9 5v14", hinweis: "In kleinen Einheiten lernen" },
  { href: "/ueben", label: "Übungsraum", kurz: "Üben", icon: "M14 5l5 5M3 21l5-1L21 7a3 3 0 00-4-4L4 16z", hinweis: "Ausprobieren und verstehen" },
  { href: "/pruefung", label: "Prüfungsraum", kurz: "Prüfung", icon: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9", hinweis: "Trainieren und auswerten" },
] as const;

export function aktiverBereich(path: string): string {
  if (path.startsWith("/pruefung")) return "/pruefung";
  if (path.endsWith("/ueben") || ["/ueben", "/zeichnen", "/praxis", "/rechner"].some((p) => path.startsWith(p))) return "/ueben";
  if (path.startsWith("/lernen") || path.startsWith("/lernweg")) return "/lernen";
  return "/";
}
