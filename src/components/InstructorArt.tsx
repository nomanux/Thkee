// Stand-in illustrations drawn from the design screenshots until the original artwork is exported.
const ink = "#3f3d56";
const amber = "#ffb20d";
const skin = "#ffb8b8";
const line = "#e2e8f0";

function Person({ x, y, flip, top = amber, skinTone = skin }: { x: number; y: number; flip?: boolean; top?: string; skinTone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <circle cx="0" cy="0" r="15" fill={skinTone} />
      <path d="M-15-3c0-13 8-17 16-17s14 6 14 12c-8-1-11-5-13-8-3 6-9 10-17 13z" fill={ink} />
      <path d="M-20 62l3-38c1-7 7-10 17-10s16 3 17 10l3 38z" fill={top} />
      <path d="M-14 62l-5 62h13l7-48 7 48h13l-5-62z" fill={ink} />
    </g>
  );
}

export function LaptopsArt({ className }: { className?: string }) {
  const laptop = (x: number) => (
    <g transform={`translate(${x} 0)`}>
      <path d="M46 72c0-14 10-20 24-20s24 6 24 20z" fill={amber} />
      <rect x="26" y="76" width="88" height="56" rx="3" fill={ink} />
      <rect x="20" y="130" width="100" height="6" rx="3" fill={ink} />
      <circle cx="70" cy="98" r="5" fill="#fff" />
    </g>
  );
  return (
    <svg viewBox="0 0 350 150" className={className} fill="none" aria-hidden="true">
      <path d="M4 136h342" stroke={ink} strokeWidth="1.5" />
      {laptop(20)}
      {laptop(186)}
      <circle cx="90" cy="40" r="16" fill={skin} />
      <path d="M72 36c-2-16 10-22 20-20 9 1 16 9 14 20-8-1-16-3-20-9-3 5-8 8-14 9z" fill={ink} />
      <circle cx="256" cy="40" r="16" fill="#a0616a" />
      <path d="M236 48c-3-22 8-32 20-32s23 10 20 32h-6c1-8-2-14-14-14s-15 6-14 14z" fill={ink} />
      <path d="M306 112h26" stroke="#a0616a" strokeWidth="8" strokeLinecap="round" />
      <path d="M170 134c-2-12-4-18-10-22M170 134c2-9 5-14 10-18M170 134v-30" stroke={line} strokeWidth="3" strokeLinecap="round" />
      <path d="M156 124h28l-4 12h-20z" fill={line} />
    </svg>
  );
}

export function RecordingArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 230" className={className} fill="none" aria-hidden="true">
      <circle cx="64" cy="14" r="13" fill={line} />
      <circle cx="158" cy="44" r="15" fill={line} />
      <circle cx="22" cy="142" r="13" fill={line} />
      <path d="M12 166h200l34 44H24z" fill={line} />
      <rect x="24" y="52" width="128" height="96" rx="3" fill={ink} />
      <rect x="28" y="56" width="120" height="84" fill={amber} />
      <path d="M78 148h20v16H78z" fill={ink} />
      <rect x="52" y="164" width="72" height="6" rx="3" fill={ink} />
      <text x="88" y="108" textAnchor="middle" fontSize="20" fill="#fff" fontFamily="cursive">
        Text...
      </text>
      <path d="M152 186v-48l34-22" stroke={ink} strokeWidth="2" />
      <rect x="183" y="100" width="7" height="24" rx="3" fill={amber} />
      <rect x="140" y="184" width="26" height="5" rx="2" fill={ink} />
      <path d="M218 112c-22 8-44 34-58 42l6 12c20-6 44-18 62-36z" fill="#d1d5db" />
      <circle cx="160" cy="158" r="7" fill={skin} />
      <path d="M212 94l-6 44c-2 20 2 50 8 66h72c8-34 4-74-12-96-14-14-42-22-62-14z" fill="#d1d5db" />
      <circle cx="238" cy="72" r="24" fill={skin} />
      <path d="M212 76c-12-30 26-46 46-30 12 10 14 28 6 42-6 8-16 8-22 2 2-10 0-16-8-22-6 4-14 6-22 8z" fill={ink} />
      <path d="M222 214c-8-36 6-74 36-78 26-4 42 18 42 44 0 14-2 28-8 34-10 6-52 6-70 0z" fill={ink} />
    </svg>
  );
}

export function PresentingArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 225" className={className} fill="none" aria-hidden="true">
      <circle cx="130" cy="44" r="44" fill="#f8fafc" stroke={line} />
      <circle cx="130" cy="42" r="6" fill={amber} />
      <path d="M121 58c0-6 18-6 18 0z" fill={amber} />
      <rect x="84" y="68" width="92" height="30" rx="2" fill="#fff" stroke="#cbd5e1" />
      <path d="M104 76h24" stroke={amber} strokeWidth="2" />
      <path d="M104 83h52M104 89h52" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="124" y="106" width="18" height="4" rx="2" fill={amber} />
      <path d="M2 222h256" stroke={line} />
      <Person x={46} y={76} />
      <Person x={204} y={76} flip top={ink} skinTone="#a0616a" />
      <rect x="196" y="92" width="16" height="44" fill="#d1d5db" />
      <path d="M190 104l-20-8" stroke="#a0616a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ChecklistArt({ className }: { className?: string }) {
  const row = (y: number, done: boolean) => (
    <g key={y}>
      <rect x="30" y={y} width="15" height="15" rx="2" fill={done ? "#1e293b" : "#fff7e6"} stroke={done ? "#1e293b" : "#fdce7c"} />
      {done && <path d={`M34 ${y + 8}l3 3 5-6`} stroke="#fff" strokeWidth="2" />}
      <path d={`M54 ${y + 3}h64M54 ${y + 11}h28`} stroke="#d1d5db" strokeWidth="3" />
    </g>
  );
  return (
    <svg viewBox="0 0 280 280" className={className} fill="none" aria-hidden="true">
      <rect x="10" y="12" width="142" height="206" rx="6" fill="#e5e7eb" stroke="#cbd5e1" />
      <rect x="18" y="20" width="126" height="190" fill="#fff" />
      <rect x="50" y="6" width="66" height="22" rx="3" fill="#283541" />
      <path d="M46 40h70" stroke="#fdce7c" strokeWidth="6" />
      {row(58, true)}
      {row(84, true)}
      {row(110, true)}
      {row(140, false)}
      {row(168, false)}
      <circle cx="10" cy="86" r="11" fill="#fff" stroke="#cbd5e1" />
      <path d="M6 86l3 3 5-6" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="184" cy="26" r="17" fill="#fff" stroke="#cbd5e1" />
      <path d="M184 16v10h8" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="170" y="64" width="54" height="46" fill="#f8fafc" />
      <path d="M180 76h34M180 84h34M180 92h34" stroke="#d1d5db" strokeWidth="2" strokeDasharray="2 3" />
      <path d="M8 200h240" stroke="#374f5e" strokeWidth="6" />
      <path d="M22 200v76M204 200v76" stroke="#374f5e" strokeWidth="5" />
      <path d="M4 278h262" stroke={line} />
      <circle cx="226" cy="128" r="15" fill="#a0616a" />
      <path d="M210 126c-4-16 22-22 30-12 4 6 2 12 0 14-8-6-20-8-30-2z" fill="#283541" />
      <path d="M212 144l28 4 2 56h-40z" fill="#fdce7c" />
      <path d="M202 204l-30 66h16l38-60 16-6z" fill="#283541" />
      <path d="M212 160l-34 28" stroke="#a0616a" strokeWidth="6" strokeLinecap="round" />
      <path d="M254 142l-12 62h-36M252 204l10 72" stroke="#374f5e" strokeWidth="5" />
      <path d="M170 172l6 28" stroke="#1e293b" strokeWidth="2" />
      <path d="M96 276v-14h24v14z" fill={amber} />
      <path d="M108 262c-2-20-10-32-18-34 10 0 16 6 18 14 2-12 8-20 18-22-6 8-14 22-18 42z" fill="#3f7f73" />
    </svg>
  );
}

const orange = "#ffb20d";
const violet = "#6d28d9";

export function TeachIcon() {
  return (
    <svg viewBox="0 0 60 60" className="size-[60px]" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="10" r="4" stroke={orange} />
      <path d="M6 22h12l14-4v5l-9 5v24h-5V40h-3v12H10V30H6z" stroke={orange} />
      <path d="M22 13h34v26H26" stroke={violet} />
      <path d="M40 39l-11 15M40 39l11 15M36 45h9" stroke={violet} />
    </svg>
  );
}

export function InspireIcon() {
  return (
    <svg viewBox="0 0 60 60" className="size-[60px]" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M30 6l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke={violet} />
      <path d="M12 8l3 4M48 8l-3 4M6 22h5M49 22h5M12 34l3-3M48 34l-3-3" stroke={violet} />
      <path d="M21 56v-7c-3-3-3-7-3-9 0-2 1-3 3-3v-3c0-2 3-2 3 0v-1c0-2 3-2 3 0v-1c0-2 3-2 3 0v1c0-2 3-2 3 0v5c2 0 4 1 4 4 0 4-2 6-4 8v6" stroke={orange} />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg viewBox="0 0 60 60" className="size-[60px]" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 6h26v14c0 8-6 14-13 14s-13-6-13-14z" stroke={orange} />
      <path d="M17 10H8c0 10 3 16 11 18M43 10h9c0 10-3 16-11 18M30 34v8M22 42h16v6H22zM12 54h36" stroke={orange} />
      <path d="M30 11l2.4 5 5.6.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.6-.7z" stroke={violet} />
    </svg>
  );
}
