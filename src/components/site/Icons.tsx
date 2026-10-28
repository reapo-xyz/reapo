/* Line icons drawn for this site: 24px grid, 2px stroke, round caps. */

type P = { size?: number; className?: string };

function Svg({ size = 16, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

export const ArrowUpRight = (p: P) => (
  <Svg {...p} className={`ob-up ${p.className ?? ""}`}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);
export const ArrowRight = (p: P) => (
  <Svg {...p} className={`ob-right ${p.className ?? ""}`}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ArrowDown = (p: P) => (
  <Svg {...p} className={`ob-down ${p.className ?? ""}`}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);
export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
export const CopyIcon = (p: P) => (
  <Svg {...p}>
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M4 16V5a1 1 0 0 1 1-1h11" />
  </Svg>
);
export const FileIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);
export const LogOutIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);
export const RefreshIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5" />
  </Svg>
);
export const WalletIcon = (p: P) => (
  <Svg {...p}>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4" />
    <path d="M3 5a2 2 0 0 0 2 2h15a1 1 0 0 1 1 1v4h-4a2 2 0 0 0 0 4h4a1 1 0 0 0 1-1v-3" />
  </Svg>
);
export const MenuIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const StopIcon = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </Svg>
);
export const PlayIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 5v14l11-7z" />
  </Svg>
);

/* Glyphs for this product (generic shapes, not anyone's logo). */
export const GlyphTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
);
export const GlyphStream = (p: P) => (
  <Svg {...p}>
    <path d="M3 7h12M3 12h18M3 17h8" />
    <circle cx="19" cy="7" r="1.5" />
    <circle cx="15" cy="17" r="1.5" />
  </Svg>
);
export const GlyphBell = (p: P) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
    <path d="M10 21h4" />
  </Svg>
);
export const GlyphLayers = (p: P) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </Svg>
);
export const GlyphGauge = (p: P) => (
  <Svg {...p}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="m12 18 4-6" />
  </Svg>
);
export const GlyphLock = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const TrashIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </Svg>
);
/** The X (formerly Twitter) letter mark, filled. */
export const XLogo = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.32l4.37 5.78zm-1.08 16.17h1.7L7.4 4.74H5.58z" />
  </svg>
);
