/*
 * Every brand image path in one place. Since 27 Oct 2026 they are built from the owner's artwork (green pixel "R" mark,
 * "REAPO" word mark banner on yellow). Replace a file at the same path to change the art; no component needs to change.
 */
export const ASSETS = {
  /** Transparent owner R mark, trimmed (HUD, guide rail). */
  mark: "/brand/mark.webp",
  /** Owner R mark on the owner yellow, padded square (wallet/token avatar). */
  markSquare: "/brand/mark-square.webp",
  /** Square PNG served by Next from src/app/icon.png (structured data needs a PNG logo). */
  logoPng: "/icon.png",
  /** Share card served from src/app/opengraph-image.jpg. */
  og: "/opengraph-image.jpg",
  /** Smaller share preview (WebP) for in-page use. */
  share: "/brand/share.webp",
} as const;
