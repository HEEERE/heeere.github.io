/** Shared motion timings so the CSS, the opening overlay and hover effects stay in step. */
export const motion = {
  opening: {
    /** Logo, wordmark and rule resolve before the final decode pass. */
    hold: 1180,
    /** Decode the English caption, then briefly hold the restored text. */
    decode: 620,
    /** Curtain lift; overlay is unmounted right after. */
    exit: 380,
    get total() {
      return this.hold + this.decode + this.exit;
    },
    /** Reduced motion: one very short fade instead of the sequence. */
    reduced: 240,
  },
  decode: {
    /** A single right-to-left decode pass. */
    duration: 460,
    /** Frame interval; ~48ms keeps the glyph flicker readable, not frantic. */
    step: 44,
  },
} as const;
