/** Decorative chapter illustrations. All essential information is in the card text. */
export function LearningArtwork({ variant = 0, className }: { variant?: number; className?: string }) {
  const art = ((variant % 6) + 6) % 6;
  const ink = "#172b44";
  return (
    <svg className={className} viewBox="0 0 240 180" fill="none" aria-hidden="true" focusable="false">
      <circle cx="123" cy="86" r="75" fill={art % 2 === 0 ? "#f8e9d5" : "#e4efea"} />
      <circle cx="207" cy="45" r="5" fill="#f2a65a" />
      <circle cx="31" cy="121" r="4" fill="#a8a2ef" />
      <path d="M25 46h10m-5-5v10M204 136h10m-5-5v10" stroke={ink} strokeWidth="2" opacity=".35" strokeLinecap="round" />
      <ellipse cx="123" cy="159" rx="82" ry="7" fill={ink} opacity=".08" />

      {art === 0 && <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M48 92v57h133V92l-66-50-67 50Z" fill="#fffaf0" />
        <path d="m35 91 80-61 82 61h-32l-50-38-50 38H35Z" fill="#f2a65a" />
        <path d="m67 66 63 1m-44-15 63 1m-41-15 63 1M56 78l14 12m8-28 29 29m-6-45 48 45m-26-48 47 48" opacity=".45" />
        <path d="M54 96h128v9c0 5-6 7-12 7H65c-7 0-11-3-11-8v-8Z" fill="#5ec6b0" />
        <path d="M171 111v34c0 8 5 10 12 10h13" strokeWidth="8" />
        <path d="M171 111v34c0 8 5 10 12 10h13" stroke="#5ec6b0" strokeWidth="4" />
        <path d="M83 123h22v26H83z" fill="#e1e6f5" />
        <path d="M126 123h26v19h-26zM139 123v19m-13-10h26" fill="#e1e6f5" />
        <path d="M181 38c0-9 12-10 15-3 10-3 14 10 5 14h-31c-9-3-5-15 4-13 0-8 5-11 7-11" fill="#fffaf0" strokeWidth="2" />
        <path d="m176 58-4 8m19-8-4 8m-12 6-4 8" stroke="#519fca" strokeWidth="3" />
      </g>}

      {art === 1 && <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M44 58 157 36l38 22-113 23-38-23Z" fill="#f2a65a" />
        <path d="m44 58 38 23v30c0 20 40 20 40-1V73l73-15v25c0 19-32 30-53 35l-29 6c-27 6-69-3-69-27V58Z" fill="#f7c18c" />
        <path d="m82 81 113-23m-73 15v36c0 8-6 13-13 15" />
        <path d="m44 58 38 23v25c0 13 26 14 29 2l1-26" stroke="#fff8e9" strokeWidth="5" />
        <path d="m59 117 96-20 30 18-96 21-30-19Z" fill="#a8a2ef" />
        <path d="m59 117 30 19v13c0 8 20 8 20 0v-17l76-17v13c0 12-19 17-30 20l-49 10c-19 4-47-3-47-17v-24Z" fill="#d1cef5" />
        <path d="M157 45v23m-20-19v24" stroke="#e8ad73" strokeWidth="4" />
        <rect x="37" y="28" width="30" height="16" rx="5" fill="#5ec6b0" strokeWidth="2" transform="rotate(-11 37 28)" />
        <path d="m192 98 10 6-1 12m-8-11 8-1 7-5" stroke="#519fca" />
      </g>}

      {art === 2 && <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="43" y="46" width="155" height="105" rx="12" fill="#fffaf0" />
        <path d="M58 66h125M58 84h125M58 102h125M58 120h125M76 59v78M99 59v78M122 59v78M145 59v78M168 59v78" stroke="#dfe5df" strokeWidth="1" />
        <path d="m64 108 43-42 68 18-44 44-67-20Z" fill="#5ec6b0" />
        <path d="m107 66 24 62m-67-20 67 20 44-44" stroke="#288c7f" />
        <path d="m57 118 69 21 54-51" strokeDasharray="3 5" strokeWidth="1.5" />
        <path d="M107 94h13m-10-5-4 12m13-12 4 12" stroke="#fffaf0" strokeWidth="2" />
        <path d="M147 26c-4-11-19-9-21 1-11-2-15 13-5 17h43c10-4 6-18-4-16-1-11-11-13-13-2Z" fill="#a8a2ef" />
        <path d="m128 51-4 8m19-8-4 8m19-8-4 8" stroke="#519fca" strokeWidth="3" />
        <circle cx="185" cy="129" r="23" fill="#f2a65a" />
        <path d="M190 133a9 9 0 1 0-7 4m1-5 10 10" strokeWidth="3" />
        <path d="m31 83 8-4m162-13 8-4" stroke="#f2a65a" strokeWidth="3" />
      </g>}

      {art === 3 && <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M47 86h141v65H47V86Z" fill="#fffaf0" />
        <path d="M39 61h16v30h124V61h16v42H39V61Z" fill="#d1cef5" />
        <path d="M55 78h124v13H55z" fill="#5ec6b0" stroke="none" />
        <path d="M55 77h125" stroke="#288c7f" strokeWidth="2" />
        <path d="M114 92v44c0 7 6 11 13 11h10" strokeWidth="10" />
        <path d="M114 92v44c0 7 6 11 13 11h10" stroke="#5ec6b0" strokeWidth="5" />
        <path d="M177 81h22v37" strokeWidth="9" />
        <path d="M177 81h22v37" stroke="#f2a65a" strokeWidth="4" />
        <path d="m194 112 5 8 6-8" stroke="#f2a65a" strokeWidth="3" />
        <path d="M61 115h20v21H61zM151 115h20v21h-20z" fill="#e1e6f5" />
        <path d="M64 126h14m79-7v12" strokeWidth="1.5" />
        <path d="M87 37c0-10 16-10 17 0 9-4 17 9 6 14H76c-11-3-6-17 4-14 0-7 6-12 7-12" fill="#fffaf0" strokeWidth="2" />
        <path d="m79 58-3 7m15-7-3 7m15-7-3 7" stroke="#519fca" strokeWidth="3" />
        <path d="m106 112 16 15m0-15-16 15" stroke="#f2a65a" strokeWidth="3" />
      </g>}

      {art === 4 && <g stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="m37 90 127-30 39 27-127 30-39-27Z" fill="#d1cef5" />
        <path d="m37 90 39 27v22l-39-25V90Zm39 27 127-30v24L76 139v-22Z" fill="#5ec6b0" />
        <path d="m56 101 3 27m30-14 2 25m31-33 2 25m32-33 3 26m29-33 3 24" opacity=".45" />
        <path d="m111 80 16 11v35l-17 4V95L95 84l16-4Z" fill="#fffaf0" />
        <path d="m75 59-27 7 7-10m-7 10 11 5M153 39l28-7-7 10m7-10-11-5" stroke="#e59a49" strokeWidth="4" />
        <path d="m65 63 23-6m51-12 22-6" stroke="#e59a49" strokeWidth="3" strokeDasharray="3 7" />
        <circle cx="190" cy="48" r="14" fill="#f2a65a" />
        <path d="M190 25v-5m0 56v-5m23-23h6m-58 0h6m7-17-4-4m37 38 4 4m-37-4-4 4m37-38 4-4" stroke="#e59a49" strokeWidth="2" />
        <path d="M47 142v10h147" strokeDasharray="3 5" strokeWidth="1.5" opacity=".55" />
      </g>}

      {art === 5 && <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M49 31h129l16 17v100H49V31Z" fill="#213d5b" stroke={ink} strokeWidth="2.5" />
        <path d="M178 31v18h16" fill="#a8a2ef" stroke={ink} strokeWidth="2.5" />
        <path d="M61 56h117M61 78h117M61 100h117M61 122h117M76 43v91M98 43v91M120 43v91M142 43v91M164 43v91" stroke="#fffaf0" opacity=".11" />
        <path d="m72 93 43-38 46 38M80 87v35h72V87m-37-31v67M80 106h72m-72-19 72 35m-47-56 47 41m-72 14 60-48" stroke="#fffaf0" strokeWidth="2" />
        <path d="M69 132h95m-95-3v6m95-6v6M64 82v41m-3-41h6m-6 41h6" stroke="#5ec6b0" strokeWidth="1.5" />
        <path d="m164 131 38-84 10 5-39 85-12 10 3-16Z" fill="#f2a65a" stroke={ink} strokeWidth="2.5" />
        <path d="m164 131 9 6m29-90 10 5m-48 79-3 16 12-10" stroke={ink} strokeWidth="2" />
        <path d="m169 131 37-79" stroke="#fffaf0" strokeWidth="2" />
        <path d="M40 150h133v12H40z" fill="#5ec6b0" stroke={ink} strokeWidth="2.5" />
        <path d="M51 150v6m12-6v4m12-4v6m12-6v4m12-4v6m12-6v4m12-4v6m12-6v4m12-4v6m12-6v4" stroke={ink} strokeWidth="1.5" />
      </g>}
    </svg>
  );
}
