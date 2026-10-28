"use client";

import { useEffect, useRef, useState } from "react";
import { WORLD, drawWorld, plotRects, type PlotState } from "@/components/farm/world";

/*
 * Canvas view of the farm. "welcome" fills the screen behind the start card (sky, drifting clouds);
 * "play" can be dragged and zoomed (wheel, pinch, the + − ⤢ ⌂ buttons) and a click on a plot opens its quest.
 */

type View = { zoom: number; x: number; y: number };

export function FarmCanvas({ mode, plots, onPlot }: { mode: "welcome" | "play"; plots: PlotState[]; onPlot?: (i: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<HTMLCanvasElement | null>(null);
  const [view, setView] = useState<View | null>(null);
  const viewRef = useRef<View | null>(null);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const plotKey = plots.join(",");

  // Size the canvas to its box and pick a "fit" view.
  const fit = (cover: boolean): View | null => {
    const el = canvas.current;
    if (!el) return null;
    const { width, height } = el.getBoundingClientRect();
    const z = cover ? Math.max(width / WORLD.w, height / WORLD.h) : Math.min(width / WORLD.w, height / WORLD.h);
    const zoom = Math.max(1, cover ? Math.ceil(z) : Math.max(1, Math.floor(z * 10) / 10));
    return { zoom, x: (width - WORLD.w * zoom) / 2, y: (height - WORLD.h * zoom) / 2 };
  };

  useEffect(() => {
    const onResize = () => setView(fit(mode === "welcome" || window.innerWidth < 760));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  // Draw the world once per plot change (and per frame on the welcome scene for the clouds).
  useEffect(() => {
    let raf = 0;
    let t = 0;
    const paint = () => {
      const el = canvas.current;
      const v = viewRef.current;
      if (!el || !v) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = el.getBoundingClientRect();
      if (el.width !== Math.round(width * dpr) || el.height !== Math.round(height * dpr)) {
        el.width = Math.round(width * dpr);
        el.height = Math.round(height * dpr);
      }
      if (!world.current) world.current = document.createElement("canvas");
      const w = world.current;
      w.width = WORLD.w;
      w.height = WORLD.h;
      const wc = w.getContext("2d");
      if (!wc) return;
      drawWorld(wc, plots, { sky: mode === "welcome", t });
      const c = el.getContext("2d");
      if (!c) return;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.imageSmoothingEnabled = false;
      c.fillStyle = mode === "welcome" ? "#5bb33d" : "#4f9a43";
      c.fillRect(0, 0, width, height);
      c.drawImage(w, Math.round(v.x), Math.round(v.y), WORLD.w * v.zoom, WORLD.h * v.zoom);
    };
    paint();
    if (mode === "welcome" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let last = performance.now();
      const loop = (now: number) => {
        if (now - last > 120) {
          t += (now - last) / 1000;
          last = now;
          paint();
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotKey, view, mode]);

  const zoomBy = (factor: number, cx?: number, cy?: number) => {
    const el = canvas.current;
    const v = viewRef.current;
    if (!el || !v) return;
    const r = el.getBoundingClientRect();
    const px = cx ?? r.width / 2;
    const py = cy ?? r.height / 2;
    const zoom = Math.min(12, Math.max(1, v.zoom * factor));
    const k = zoom / v.zoom;
    setView({ zoom, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
  };

  const home = () => {
    const el = canvas.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const zoom = Math.min(12, Math.max(2, Math.floor(Math.min(r.width / 170, r.height / 90))));
    const rects = plotRects(plots.length);
    const cx = (Math.min(...rects.map((p) => p.x)) + Math.max(...rects.map((p) => p.x + p.w))) / 2;
    const cy = (Math.min(...rects.map((p) => p.y)) + Math.max(...rects.map((p) => p.y + p.h))) / 2;
    setView({ zoom, x: r.width / 2 - cx * zoom, y: r.height / 2.4 - cy * zoom });
  };

  const hit = (clientX: number, clientY: number) => {
    const el = canvas.current;
    const v = viewRef.current;
    if (!el || !v || !onPlot) return;
    const r = el.getBoundingClientRect();
    const wx = (clientX - r.left - v.x) / v.zoom;
    const wy = (clientY - r.top - v.y) / v.zoom;
    const i = plotRects(plots.length).findIndex((p) => wx >= p.x - 2 && wx <= p.x + p.w + 2 && wy >= p.y - 8 && wy <= p.y + p.h + 2);
    if (i >= 0) onPlot(i);
  };

  const play = mode === "play";
  return (
    <>
      <canvas
        ref={canvas}
        aria-label={play ? "Your farm: one plot per quest. Plots with grown crops are quests you have cleared." : "A pixel farm with fields, a barn and a pond under a blue sky."}
        role="img"
        onWheel={
          play
            ? (e) => {
                const r = e.currentTarget.getBoundingClientRect();
                zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
              }
            : undefined
        }
        onPointerDown={
          play
            ? (e) => {
                const v = viewRef.current;
                if (!v) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y, moved: false };
              }
            : undefined
        }
        onPointerMove={
          play
            ? (e) => {
                const d = drag.current;
                const v = viewRef.current;
                if (!d || !v) return;
                const dx = e.clientX - d.x;
                const dy = e.clientY - d.y;
                if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
                if (d.moved) setView({ ...v, x: d.vx + dx, y: d.vy + dy });
              }
            : undefined
        }
        onPointerUp={
          play
            ? (e) => {
                const d = drag.current;
                drag.current = null;
                if (d && !d.moved) hit(e.clientX, e.clientY);
              }
            : undefined
        }
      />
      {play ? (
        <div className="zoom-ui" aria-label="View">
          <button type="button" title="Zoom in (mouse wheel)" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
            +
          </button>
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
            −
          </button>
          <button type="button" title="See the whole farm" aria-label="See the whole farm" onClick={() => setView(fit(false))}>
            ⤢
          </button>
          <button type="button" title="Focus the quest field" aria-label="Focus the quest field" onClick={home}>
            ⌂
          </button>
        </div>
      ) : null}
    </>
  );
}
