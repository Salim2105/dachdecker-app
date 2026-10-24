import { useId } from "react";

type Motiv = "dach" | "wasser" | "quiz" | "zeichnen" | "pruefung" | "erfolg";

/** Eigene dekorative Illustrationen; alle wichtigen Informationen stehen im Text. */
export function LernIllustration({ motiv = "dach", className }: { motiv?: Motiv; className?: string }) {
  const id = useId().replace(/:/g, "");
  const ink = "#193747";
  if (motiv === "dach" || motiv === "wasser") return <svg className={className} viewBox="0 0 520 380" fill="none" aria-hidden="true">
    <defs><pattern id={`${id}-ziegel`} width="35" height="23" patternUnits="userSpaceOnUse" patternTransform="rotate(-2)"><path d="M0 0h35M0 23h35M17 0v23" stroke="#a94e35" strokeWidth="1.6" opacity=".55" /></pattern></defs>
    <circle cx="285" cy="170" r="150" fill="#315567" /><circle cx="415" cy="70" r="37" fill="#f4ce70" />
    <path d="M63 123c7-18 26-20 36-8 13-18 37-14 41 8H63ZM359 37c5-16 22-19 33-10 10-15 28-10 31 10h-64Z" fill="#d7ebe6" />
    <path d="m31 302 241-50 220 67-242 48L31 302Z" fill="#456a70" /><path d="m49 313 205 51 214-42" stroke="#87b1a9" strokeWidth="2" strokeDasharray="5 8" />
    <path d="M174 198v97l135 42V211l-135-13Z" fill="#f8e7bf" /><path d="m309 211 123-47v126l-123 47V211Z" fill="#e0cda7" />
    <path d="m153 187 137-114 163 82-143 87-157-55Z" fill="#ff9e69" /><path d="m153 187 137-114 163 82-143 87-157-55Z" fill={`url(#${id}-ziegel)`} />
    <path d="m290 73-51 135 71 34 143-87-163-82Z" fill="#d96849" /><path d="m290 73-51 135 71 34 143-87-163-82Z" fill={`url(#${id}-ziegel)`} />
    <path d="m142 191 151-128 174 87" stroke="#ffe2ac" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m151 198 158 55 146-88" stroke="#9de2d6" strokeWidth="9" strokeLinecap="round" /><path d="M309 251v70q0 20 22 20h17" stroke="#79c9c4" strokeWidth="8" strokeLinecap="round" />
    <path d="m185 226 41 13v45l-41-13v-45Z" fill="#315d70" /><path d="m204 232 1 45m-19-28 39 13" stroke="#f7e7bd" strokeWidth="4" />
    <path d="m344 227 44-18v49l-44 17v-48Z" fill="#315d70" /><path d="m366 218 1 48m-22-22 43-17" stroke="#f7e7bd" strokeWidth="4" />
    <path d="m267 262 24 8v60l-24-7v-61Z" fill="#a36b52" />
    <path d="m338 101 2-39 28 14 1 41" fill="#a1c3b7" /><path d="m338 62 28 14 17-8-27-14-18 8Z" fill="#d6e7ce" /><path d="m366 76 17-8v39l-14 10-3-41Z" fill="#6d9991" />
    <path d="m94 283 39-76m-22 83 37-77m-48 55 18 6m-11-20 19 5m-12-20 19 6m-12-20 18 5" stroke="#f4cf69" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="85" cy="323" rx="34" ry="9" fill="#193747" opacity=".4" /><path d="M80 316v-57" stroke="#c9ad7a" strokeWidth="6" /><path d="M80 291c-31-1-39-30-17-42-10-27 21-44 36-25 24-1 33 30 13 42 2 16-13 28-32 25Z" fill="#70bbaa" /><path d="m81 279 11-22m-12 29-12-15" stroke="#328b7d" strokeWidth="3" />
    <g transform="translate(390 230)"><path d="m0 64 45 14 24-13-45-15L0 64Z" fill="#274957" /><path d="M18 35v27m18-30 2 34" stroke="#203e52" strokeWidth="11" strokeLinecap="round" /><path d="m12 13 23-5 11 28-34 7V13Z" fill="#f7975a" /><path d="m18 16 9 22 11-25" stroke="#fae1a2" strokeWidth="4" /><circle cx="24" cy="1" r="13" fill="#deb28e" /><path d="M9 1c-1-21 29-24 31-3H9Z" fill="#f4cf69" /><path d="m6 2 36-3" stroke="#f4cf69" strokeWidth="5" strokeLinecap="round" /><path d="m38 20 15-7m-39 10L2 10" stroke="#deb28e" strokeWidth="8" strokeLinecap="round" /></g>
    <g transform="rotate(-9 132 102)"><rect x="80" y="55" width="88" height="64" rx="17" fill="#f8efda" /><path d="m116 116 9 14 12-14" fill="#f8efda" /><circle cx="125" cy="85" r="19" fill="#6ac4ad" /><path d="m115 85 7 7 14-16" stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></g>
    <path d="m465 229 5 9 10 2-7 7 1 10-9-5-9 5 2-10-8-7 11-2 4-9ZM209 34l4 7 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1 4-7Z" fill="#f4cf69" />
    {motiv === "wasser" && <g stroke="#70dcdf" strokeWidth="5" strokeLinecap="round"><path d="m219 115 15 7m12-24 15 7m-51 35 15 7m12-24 15 7m65 141v29m24 43h24" /><path d="m215 81-3 9m34-18-3 9m30-13-3 9" /></g>}
  </svg>;
  if (motiv === "erfolg") return <svg className={className} viewBox="0 0 280 220" fill="none" aria-hidden="true">
    <circle cx="140" cy="103" r="82" fill="#f6d67e" opacity=".35" /><path d="m99 136-14 64 41-20 14 31 14-74" fill="#b5a3ee" /><path d="m139 139 18 63 18-26 35 9-28-63" fill="#8978c9" />
    <path d="m141 20 15 15 21-2 8 20 19 10-5 21 10 20-15 16-1 22-22 4-14 17-20-8-21 6-12-18-22-6 1-22-12-18 12-18 2-22 22-3 16-14 18 6Z" fill="#f4ca64" stroke="#d8a442" strokeWidth="3" /><circle cx="141" cy="92" r="41" fill="#fff2be" /><path d="m120 93 14 14 29-33" stroke={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /><path d="m46 44 8 13m169 19 17-7M37 132l17-4m165 21 10 13" stroke="#ed9770" strokeWidth="6" strokeLinecap="round" /><circle cx="74" cy="26" r="5" fill="#68cbb4" /><circle cx="225" cy="32" r="6" fill="#a596dc" />
  </svg>;
  if (motiv === "zeichnen") return <svg className={className} viewBox="0 0 280 220" fill="none" aria-hidden="true"><rect x="40" y="40" width="180" height="135" rx="13" transform="rotate(-9 40 40)" fill="#b2a1ed" /><rect x="57" y="44" width="180" height="135" rx="13" transform="rotate(5 57 44)" fill="#fff9e9" /><path d="m80 127 51-52 58 58m-95-17v38h80v-41m-39-38v76" stroke="#42677a" strokeWidth="3" strokeLinejoin="round" /><path d="m72 145 118 10m-109 9 70 6" stroke="#b0c7ca" strokeWidth="2" /><g transform="rotate(34 211 98)"><path d="M201 29h19v125l-9 23-10-23V29Z" fill="#ff9e69" /><path d="m201 154 10 23 9-23" fill="#f2d9a7" /><path d="m207 168 4 9 4-9" fill={ink} /><path d="M201 41h19" stroke={ink} strokeWidth="3" /></g><path d="m21 169 98 27 4-15-98-27-4 15Z" fill="#f4cf69" /><path d="m37 158-3 9m17-5-2 8m17-4-3 9m17-5-2 8" stroke="#b28637" strokeWidth="2" /></svg>;
  if (motiv === "pruefung") return <svg className={className} viewBox="0 0 280 220" fill="none" aria-hidden="true"><circle cx="143" cy="104" r="85" fill="#9ce1d0" opacity=".6" /><rect x="66" y="30" width="137" height="166" rx="15" transform="rotate(-6 66 30)" fill={ink} /><rect x="79" y="41" width="111" height="140" rx="5" transform="rotate(-6 79 41)" fill="#fff7e5" /><path d="m111 25 40-4 1 18-40 4-1-18Z" fill="#f4cf69" /><g stroke="#719b9b" strokeWidth="4" strokeLinecap="round"><path d="m99 76 9 7 13-18m-20 43 9 7 13-18m-20 43 9 7 13-18M136 77l30-3m-27 34 30-3m-27 34 21-2" /></g><circle cx="206" cy="152" r="38" fill="#f4cf69" /><path d="m188 153 13 12 24-29" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg className={className} viewBox="0 0 280 220" fill="none" aria-hidden="true"><rect x="37" y="36" width="129" height="154" rx="19" transform="rotate(-12 37 36)" fill="#d0c0f5" /><rect x="101" y="22" width="136" height="162" rx="19" transform="rotate(10 101 22)" fill="#ffb488" /><path d="M156 65c0-26 44-26 44 0 0 18-24 18-24 36" stroke={ink} strokeWidth="10" strokeLinecap="round" /><circle cx="177" cy="121" r="6" fill={ink} /><rect x="123" y="146" width="71" height="10" rx="5" transform="rotate(10 123 146)" fill="#e08b5b" /><circle cx="73" cy="160" r="35" fill="#74c9b6" /><path d="m58 160 10 11 21-24" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><path d="m237 192 6-10m-9-139 12-4M34 94l-13-4" stroke="#f4cf69" strokeWidth="6" strokeLinecap="round" /></svg>;
}
