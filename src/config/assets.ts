/*
 * Every brand image path in one place. All of them are drawn by referensi/tools/make-brand.mjs (our own pixel art).
 * To use the owner's logo: replace public/brand/mark.webp (transparent, square) and run
 * `node referensi/tools/make-brand.mjs --from-mark` from the project folder; icons and the square mark follow.
 * No code edits needed.
 */
export const ASSETS = {
  /** Transparent mark (HUD, guide rail). */
  mark: "/brand/mark.webp",
  /** Square mark on a wood plate (wallet/token avatar). */
  markSquare: "/brand/mark-square.webp",
  /** Square PNG served by Next from src/app/icon.png (structured data needs a PNG logo). */
  logoPng: "/icon.png",
  /** Share card served from src/app/opengraph-image.jpg. */
  og: "/opengraph-image.jpg",
  /** Smaller share preview (WebP) for in-page use. */
  share: "/brand/share.webp",
} as const;
