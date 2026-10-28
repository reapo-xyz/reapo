/*
 * The Reapo farm, drawn in code as pixel art (our own art, no image files). One world unit = one art pixel;
 * the canvas scales it up with smoothing off. Quest plots grow when their quest is done.
 */

export const WORLD = { w: 320, h: 200 } as const;

export type PlotState = "done" | "open" | "waiting" | "unknown";

/** Plot rectangles in world units, one per quest, two rows of five in the middle field. */
export function plotRects(n: number) {
  const out: { x: number; y: number; w: number; h: number }[] = [];
  const pw = 24;
  const ph = 18;
  const gap = 6;
  const cols = 5;
  const rows = Math.ceil(n / cols);
  const totalW = cols * pw + (cols - 1) * gap;
  const x0 = Math.round((WORLD.w - totalW) / 2);
  const y0 = 92 - Math.round((rows * ph + (rows - 1) * gap) / 2) + 6;
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({ x: x0 + c * (pw + gap), y: y0 + r * (ph + gap), w: pw, h: ph });
  }
  return out;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function tree(c: Ctx, x: number, y: number, big = false) {
  const s = big ? 1.3 : 1;
  R(c, x - 1, y + 6 * s, 3, 5 * s, "#6b4423");
  R(c, x - 6 * s, y + 1 * s, 13 * s, 7 * s, "#2f6e3a");
  R(c, x - 5 * s, y - 2 * s, 11 * s, 4 * s, "#3f8a3a");
  R(c, x - 3 * s, y - 4 * s, 7 * s, 3 * s, "#4fa040");
  R(c, x - 3 * s, y - 1 * s, 3 * s, 2 * s, "#7cc95a");
  R(c, x - 6 * s, y + 8 * s, 13 * s, 1, "#1f4d22");
}

function pine(c: Ctx, x: number, y: number) {
  R(c, x - 1, y + 9, 2, 3, "#6b4423");
  for (let i = 0; i < 4; i++) R(c, x - 1 - i * 1.5, y + i * 2.4, 2 + i * 3, 3, i % 2 ? "#3d7d36" : "#4f9a43");
  R(c, x - 6, y + 9, 12, 1, "#1f4d22");
}

function chicken(c: Ctx, x: number, y: number) {
  R(c, x, y, 4, 3, "#ffffff");
  R(c, x + 3, y - 1, 2, 2, "#ffffff");
  R(c, x + 4, y - 2, 1, 1, "#d9482e");
  R(c, x + 5, y, 1, 1, "#f4b62c");
  R(c, x + 1, y + 3, 1, 1, "#f4b62c");
  R(c, x + 3, y + 3, 1, 1, "#f4b62c");
}

function fence(c: Ctx, x: number, y: number, len: number) {
  R(c, x, y + 1, len, 1, "#a85d2c");
  R(c, x, y + 3, len, 1, "#a85d2c");
  for (let i = 0; i <= len; i += 4) R(c, x + i, y, 1, 5, "#6b4423");
}

function barn(c: Ctx, x: number, y: number) {
  R(c, x, y + 10, 34, 20, "#b8352a");
  R(c, x + 2, y + 12, 30, 1, "#d9482e");
  for (let i = 0; i < 10; i++) R(c, x - 2 + i * 1.5, y + 10 - i, 38 - i * 3, 1, i % 3 === 0 ? "#5a2a20" : "#7a3324");
  R(c, x + 12, y + 18, 10, 12, "#f3ece0");
  R(c, x + 13, y + 19, 8, 11, "#8a3a26");
  R(c, x + 13, y + 19, 8, 1, "#f3ece0");
  R(c, x + 16, y + 19, 1, 11, "#f3ece0");
  R(c, x + 4, y + 16, 5, 4, "#f3ece0");
  R(c, x + 25, y + 16, 5, 4, "#f3ece0");
  R(c, x, y + 30, 34, 1, "#3a2410");
}

function house(c: Ctx, x: number, y: number) {
  R(c, x, y + 9, 26, 16, "#efd6a2");
  R(c, x, y + 9, 26, 1, "#c9a876");
  for (let i = 0; i < 9; i++) R(c, x - 2 + i, y + 9 - i, 30 - i * 2, 1, i % 2 ? "#4a6fa5" : "#3a5a8a");
  R(c, x + 10, y + 15, 6, 10, "#8a4f1c");
  R(c, x + 3, y + 13, 5, 5, "#8fc7ea");
  R(c, x + 18, y + 13, 5, 5, "#8fc7ea");
  R(c, x + 20, y - 1, 3, 6, "#7a5a44");
  R(c, x, y + 25, 26, 1, "#3a2410");
}

function pond(c: Ctx, x: number, y: number) {
  R(c, x + 3, y, 26, 2, "#3f86c9");
  R(c, x, y + 2, 32, 9, "#3f86c9");
  R(c, x + 3, y + 11, 26, 2, "#3f86c9");
  R(c, x + 5, y + 3, 8, 1, "#9fd4f5");
  R(c, x + 18, y + 7, 6, 1, "#9fd4f5");
  R(c, x - 1, y + 2, 1, 9, "#2c6a2a");
}

const CROPS = [
  { leaf: "#4fa040", fruit: "#f4b62c" }, // wheat-like
  { leaf: "#3f8a3a", fruit: "#d9482e" }, // tomato-like
  { leaf: "#4f9a43", fruit: "#ff9f43" }, // carrot-like
  { leaf: "#3d7d36", fruit: "#b18cff" }, // eggplant-like
  { leaf: "#5fae4f", fruit: "#ffd24a" }, // corn-like
];

function plot(c: Ctx, p: { x: number; y: number; w: number; h: number }, state: PlotState, i: number) {
  R(c, p.x - 1, p.y - 1, p.w + 2, p.h + 2, "#5a3a20");
  R(c, p.x, p.y, p.w, p.h, state === "waiting" ? "#8a6a4a" : "#7a4f2c");
  for (let r = 0; r < p.h; r += 4) R(c, p.x, p.y + r + 2, p.w, 1, "#6a4225");
  const crop = CROPS[i % CROPS.length];
  for (let cy = 0; cy < 3; cy++)
    for (let cx = 0; cx < 4; cx++) {
      const x = p.x + 3 + cx * 6;
      const y = p.y + 3 + cy * 5;
      if (state === "done") {
        R(c, x, y + 1, 1, 3, crop.leaf);
        R(c, x - 1, y + 1, 1, 1, crop.leaf);
        R(c, x + 1, y + 2, 1, 1, crop.leaf);
        R(c, x, y - 1, 2, 2, crop.fruit);
      } else if (state === "open") {
        R(c, x, y + 2, 1, 1, "#7cc95a");
      } else if (state === "waiting") {
        R(c, x, y + 2, 1, 1, "#a8865a");
      }
    }
  // marker post with the plot number in dots
  R(c, p.x + p.w - 3, p.y - 6, 1, 6, "#6b4423");
  R(c, p.x + p.w - 6, p.y - 8, 7, 4, state === "done" ? "#ffd24a" : "#efd6a2");
}

/** Draws the whole farm into `c` at world scale. `sky` adds the sky band used behind the welcome card. */
export function drawWorld(c: Ctx, plots: PlotState[], opts: { sky?: boolean; t?: number } = {}) {
  const rand = rng(7);
  const { w, h } = WORLD;
  c.imageSmoothingEnabled = false;
  R(c, 0, 0, w, h, "#5bb33d");
  for (let i = 0; i < 900; i++) R(c, rand() * w, rand() * h, 1, 1, rand() > 0.5 ? "#4fa040" : "#6cc04a");
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    R(c, x, y, 1, 1, ["#fff6dc", "#ffd24a", "#d9482e", "#b18cff"][Math.floor(rand() * 4)]);
  }
  // path
  for (let y = 0; y < h; y++) R(c, 148 + Math.round(Math.sin(y / 18) * 6), y, 12, 1, y % 3 ? "#c9a876" : "#b8955f");
  // field border fences
  const rects = plotRects(plots.length);
  if (rects.length) {
    const minX = Math.min(...rects.map((r) => r.x)) - 8;
    const maxX = Math.max(...rects.map((r) => r.x + r.w)) + 8;
    const minY = Math.min(...rects.map((r) => r.y)) - 14;
    const maxY = Math.max(...rects.map((r) => r.y + r.h)) + 6;
    R(c, minX, minY, maxX - minX, maxY - minY, "#6cbf48");
    fence(c, minX, minY - 2, maxX - minX);
    fence(c, minX, maxY, maxX - minX);
  }
  rects.forEach((r, i) => plot(c, r, plots[i] ?? "unknown", i));
  barn(c, 18, 130);
  house(c, 268, 140);
  pond(c, 250, 40);
  fence(c, 14, 168, 50);
  chicken(c, 60, 150);
  chicken(c, 70, 158);
  chicken(c, 52, 160);
  chicken(c, 236, 170);
  const trees: [number, number, boolean][] = [
    [20, 30, true], [44, 22, false], [72, 36, false], [16, 70, false], [40, 92, true], [96, 170, false], [120, 182, false],
    [220, 24, false], [290, 22, true], [306, 66, false], [292, 100, false], [214, 180, true], [252, 186, false], [8, 190, false],
  ];
  for (const [x, y, big] of trees) tree(c, x, y, big);
  for (const [x, y] of [[100, 18], [128, 10], [190, 14], [206, 34], [84, 60], [228, 90], [310, 140], [6, 120]] as const) pine(c, x, y);
  if (opts.sky) {
    // sky band over the top third, a far tree line, a sun and clouds
    const skyH = 64;
    const steps = ["#2f7fd0", "#3d8ad6", "#4c96dc", "#5ba2e2", "#6aaee6", "#7bbaea", "#8cc4ee", "#9dcef2"];
    steps.forEach((col, i) => R(c, 0, (i * skyH) / steps.length, w, skyH / steps.length + 1, col));
    for (let x = 0; x < w; x += 6) {
      const th = 4 + Math.round((Math.sin(x * 0.37) + 1) * 2);
      R(c, x, skyH - th, 7, th, "#3f8a3a");
      R(c, x + 1, skyH - th - 1, 5, 1, "#4fa040");
    }
    R(c, 0, skyH, w, 2, "#2f6e3a");
    const t = opts.t ?? 0;
    R(c, 272, 18, 12, 12, "#fff2a8");
    R(c, 270, 20, 16, 8, "#fff2a8");
    R(c, 274, 16, 8, 16, "#fff2a8");
    R(c, 275, 21, 6, 6, "#ffe066");
    for (const [cx, cy, sp] of [[30, 26, 1], [140, 44, 0.6], [214, 30, 0.8]] as const) {
      const x = ((cx + t * sp * 4) % (w + 40)) - 20;
      R(c, x, cy, 16, 3, "#ffffff");
      R(c, x + 3, cy - 2, 9, 2, "#ffffff");
      R(c, x + 2, cy + 3, 14, 1, "#d8ecfa");
    }
  }
}
