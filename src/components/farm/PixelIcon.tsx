/*
 * Small pixel icons drawn from 12 x 12 character maps (our own art). Each character is a palette colour;
 * "." is empty. Rendered as SVG rects so they stay crisp at any size.
 */

const PALETTE: Record<string, string> = {
  k: "#1b130d", // outline
  g: "#5fae4f", // leaf
  G: "#2f6e3a", // dark leaf
  y: "#ffd24a", // gold
  Y: "#c98a14", // dark gold
  w: "#fff6dc", // paper
  b: "#a85d2c", // wood
  B: "#6b4d3a", // dark wood
  r: "#d9482e", // red
  s: "#8fc7ea", // sky
  p: "#efd6a2", // paper 2
};

const MAPS = {
  season: [
    "....kkkk....",
    "..kkyyyykk..",
    ".kyyyyyyyyk.",
    ".kyyYyyYyyk.",
    "kyyyyyyyyyyk",
    "kyyyyyyyyyyk",
    "kyyYyyyyYyyk",
    "kyyyYYYYyyyk",
    ".kyyyyyyyyk.",
    ".kyyyyyyyyk.",
    "..kkyyyykk..",
    "....kkkk....",
  ],
  quests: [
    "..kkkkkkkk..",
    ".kwwwwwwwwk.",
    ".kwkkwwwwwk.",
    ".kwkgwkkkwk.",
    ".kwwwwwwwwk.",
    ".kwkkwwwwwk.",
    ".kwkgwkkkwk.",
    ".kwwwwwwwwk.",
    ".kwkkwwwwwk.",
    ".kwkwwkkkwk.",
    ".kwwwwwwwwk.",
    "..kkkkkkkk..",
  ],
  board: [
    "............",
    "..........k.",
    ".........kgk",
    "........kgk.",
    "...k...kgk..",
    "..kgk.kgk...",
    ".kgkgkgk....",
    "kgk.kgk.....",
    "kk...k......",
    "kkkkkkkkkkkk",
    "kbbbbbbbbbbk",
    "kkkkkkkkkkkk",
  ],
  checkin: [
    ".....kk.....",
    "....kggk....",
    "...kgGggk...",
    "....kggk....",
    ".....kk.....",
    ".....kk.....",
    "..kk.kk.kk..",
    ".kggkkkkggk.",
    "..kGgkkgGk..",
    "...kkkkkk...",
    ".kbbbbbbbbk.",
    ".kkkkkkkkkk.",
  ],
  token: [
    "....kkkk....",
    "..kkYYYYkk..",
    ".kYyyyyyyYk.",
    ".kYyykkyyYk.",
    "kYyykyykyyYk",
    "kYyykyyyyyYk",
    "kYyykyyyyyYk",
    "kYyykyykyyYk",
    ".kYyykkyyYk.",
    ".kYyyyyyyYk.",
    "..kkYYYYkk..",
    "....kkkk....",
  ],
  guide: [
    "............",
    ".kkkkk.kkkkk",
    "kwwwwwkwwwwk",
    "kwkkwwkwkkwk",
    "kwwwwwkwwwwk",
    "kwkkkwkwkkwk",
    "kwwwwwkwwwwk",
    "kwkkwwkwkkwk",
    "kwwwwwkwwwwk",
    "kbbbbbkbbbbk",
    ".kkkkkkkkkk.",
    "............",
  ],
  sprout: [
    "............",
    "..kk....kk..",
    ".kggk..kggk.",
    ".kgGgkkgGgk.",
    "..kgGggGgk..",
    "...kkggkk...",
    ".....kk.....",
    ".....kk.....",
    "...kkkkkk...",
    "..kbbbbbbk..",
    "..kBbbbbBk..",
    "...kkkkkk...",
  ],
} as const;

export type PixelName = keyof typeof MAPS;

export function PixelIcon({ name, size = 24, title }: { name: PixelName; size?: number; title?: string }) {
  const rows = MAPS[name];
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== ".") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={PALETTE[c]} />);
    }),
  );
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {rects}
    </svg>
  );
}

export const PIXEL_MAPS = MAPS;
export const PIXEL_PALETTE = PALETTE;
