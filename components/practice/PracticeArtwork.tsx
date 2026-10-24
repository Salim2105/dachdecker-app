export type PracticeArt = "zuordnen" | "zeichnen" | "begriffe" | "rechnen" | "baustelle" | "wiederholen";

/** Eigene Vektorillustrationen: keine Buchgrafiken, alle Details rein dekorativ. */
export function PracticeArtwork({ art, compact = false }: { art: PracticeArt; compact?: boolean }) {
  const ink = "#24344e";
  const common = { fill: "none", stroke: ink, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg width={compact ? 160 : 260} height={compact ? 110 : 180} viewBox="0 0 260 180" fill="none" aria-hidden="true" className="h-auto max-w-full">
    <ellipse cx="134" cy="155" rx="82" ry="9" fill={ink} opacity=".08" />
    <circle cx="213" cy="33" r="8" fill="white" opacity=".65" /><path d="M40 38h12m-6-6v12M219 109h10m-5-5v10" stroke={ink} strokeWidth="2" opacity=".25" />
    {art === "zuordnen" && <>
      <rect x="48" y="34" width="65" height="44" rx="12" fill="white" stroke={ink} strokeWidth="3" /><rect x="146" y="48" width="65" height="44" rx="12" fill="#ffbd79" stroke={ink} strokeWidth="3" />
      <rect x="48" y="103" width="65" height="44" rx="12" fill="#ffc89b" stroke={ink} strokeWidth="3" /><rect x="146" y="116" width="65" height="36" rx="12" fill="white" stroke={ink} strokeWidth="3" />
      <path d="M114 56h14q9 0 9 13v51q0 12 9 12M114 125h10q7 0 7-15V82q0-12 14-12" stroke="#6a59b5" strokeWidth="3" strokeDasharray="5 6" />
      <path d="m64 58 16-13 17 13M70 57v10h22V57M164 67l8 8 14-17M67 126h27M67 119h18M164 134h29" {...common} />
    </>}
    {art === "zeichnen" && <>
      <path d="M63 28h109l22 22v99H63z" fill="white" stroke={ink} strokeWidth="3" /><path d="M172 28v23h22" {...common} />
      <path d="M77 70h99M77 89h99M77 108h99M89 57v73M110 57v73M131 57v73M152 57v73M173 57v73" stroke="#dde6ec" strokeWidth="1.5" />
      <path d="m79 109 46-35 45 35M88 105v25h73v-25M125 74v56M98 90l54 40M144 89l-54 40" {...common} />
      <g transform="rotate(32 188 106)"><path d="M180 57h16v79l-8 18-8-18z" fill="#ffb66b" stroke={ink} strokeWidth="3" /><path d="M180 75h16M180 135h16M188 75v60" {...common} /><path d="m184 145 4 9 4-9" fill={ink} /></g>
    </>}
    {art === "begriffe" && <>
      <path d="M42 40h122a13 13 0 0 1 13 13v55a13 13 0 0 1-13 13H88l-24 23v-23H42a13 13 0 0 1-13-13V53a13 13 0 0 1 13-13Z" fill="white" stroke={ink} strokeWidth="3" />
      <path d="m61 97 13-36 13 36M66 84h16M102 67h48M102 81h39M102 95h27" {...common} />
      <path d="M153 94h64a11 11 0 0 1 11 11v32a11 11 0 0 1-11 11h-8v16l-18-16h-38a11 11 0 0 1-11-11v-32a11 11 0 0 1 11-11Z" fill="#73d1c1" stroke={ink} strokeWidth="3" />
      <path d="m167 121 10 10 24-25" {...common} />
    </>}
    {art === "rechnen" && <>
      <rect x="79" y="24" width="106" height="131" rx="16" fill="#9d8cdd" stroke={ink} strokeWidth="3" /><rect x="94" y="38" width="77" height="34" rx="7" fill="white" stroke={ink} strokeWidth="2.5" />
      <path d="M140 49v14M153 49h9v7h-9v7h9M104 51h12M110 45v12" {...common} />
      {[0, 1, 2].map((row) => [0, 1, 2].map((col) => <rect key={`${row}-${col}`} x={95 + col * 27} y={86 + row * 20} width="19" height="13" rx="4" fill={col === 2 ? "#ffd294" : "white"} />))}
      <path d="m48 103 10 10 19-22M193 71h20M203 61v20" {...common} />
    </>}
    {art === "baustelle" && <>
      <path d="M53 93h148v55H53z" fill="#f6c785" stroke={ink} strokeWidth="3" /><path d="m41 94 86-63 87 63Z" fill="#ef8e6f" stroke={ink} strokeWidth="3" />
      <path d="M127 31v64M77 68l45 27M105 48l72 47M157 53l-45 41M183 72l-36 23" {...common} /><rect x="77" y="112" width="25" height="22" rx="4" fill="white" stroke={ink} strokeWidth="3" /><path d="M153 148v-36h23v36" {...common} />
      <circle cx="204" cy="125" r="26" fill="#fff8df" stroke={ink} strokeWidth="3" /><path d="m191 126 9 9 17-20" {...common} />
    </>}
    {art === "wiederholen" && <>
      <rect x="68" y="54" width="86" height="97" rx="12" transform="rotate(-10 68 54)" fill="#efd887" stroke={ink} strokeWidth="3" />
      <rect x="91" y="47" width="86" height="103" rx="12" transform="rotate(8 91 47)" fill="white" stroke={ink} strokeWidth="3" />
      <path d="M117 94a22 22 0 1 1 29 29M116 94l15-2M116 94l1 15" {...common} /><path d="m118 122 10 6 14-2" {...common} />
      <path d="m179 43 11-10 11 10M190 34v25M49 115l-12 10-10-11M37 124v-26" stroke="#9e7619" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </svg>;
}

export function ExamLevelArt({ level }: { level: number }) {
  const color = ["#82d2c2", "#ffb571", "#b4a2ec"][Math.min(2, level)];
  return <svg viewBox="0 0 180 115" width="180" height="115" fill="none" aria-hidden="true" className="h-auto max-w-full">
    <ellipse cx="90" cy="99" rx="57" ry="6" fill="#24344e" opacity=".09" />
    {[0, 1, 2].map((n) => <g key={n}><rect x={35 + n * 38} y={82 - (n <= level ? (n + 1) * 18 : 6)} width="29" height={n <= level ? (n + 1) * 18 : 6} rx="5" fill={n <= level ? color : "#dce0e7"} stroke="#24344e" strokeWidth="2" /></g>)}
    <path d={`m${43 + level * 38} ${48 - level * 18} 6-12 6 12 12 2-9 9 2 13-11-6-11 6 2-13-9-9Z`} fill="#fff8df" stroke="#24344e" strokeWidth="2" strokeLinejoin="round" />
    <path d="M25 43h9m-4-5v10M151 39h9m-4-5v10" stroke="#24344e" opacity=".3" strokeWidth="2" />
  </svg>;
}
