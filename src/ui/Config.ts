/**
 * Height of a track in pixels. This is without any automation lanes.
 */
export const TRACK_HEIGHT_PX = 80;

/**
 * Scale factor for the timeline.
 */
export const TIMELINE_FACTOR_PX = 16;

/**
 * Dimensions of a scroll bar. This is really browser-specific, but for now we are simply hardwiring those values.
 * May may investigate a more robust solution later, which may rely on browser-specific CSS extensions (such as
 * `::-webkit-scrollbar). See also the design note on scrolling.
 */
export const SCROLLBAR_DIMENSIONS_PX = 15;
