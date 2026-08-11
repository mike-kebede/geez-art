// Shared sizing/timing constants (L22). Kept in one place so the rationale —
// and the memory/perf/CSP consequences — is documented once, not repeated as
// bare literals across modules.

/** Long-edge cap for any decoded source (photos AND video frames). Decode-time
 *  resize via createImageBitmap keeps a 12MP phone photo from ever materializing
 *  at full resolution (~48MB transient), and the mosaic grid only needs detail
 *  up to the cell count — beyond this is pure waste on low-end phones. */
export const MAX_SOURCE_EDGE = 1600;

/** Video-FRAME long edge — the video grid is clamped to ~140 cols, so 512px is
 *  plenty of detail and cuts the per-frame getImageData readback ~10× (F6). */
export const VIDEO_FRAME_EDGE = 512;

/** Debounce for slider re-renders: long enough to coalesce drag events, short
 *  enough that the preview feels live. */
export const RENDER_DEBOUNCE_MS = 250; // M1: coalesce slider drags harder (INP)

/** Reject files above this size before createObjectURL (L7) — the app is
 *  client-side, so nothing would be uploaded, but a multi-GB file would pin
 *  memory and hang the tab for no gain. */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
