/**
 * Height of a track in pixels. This is without any automation lanes.
 */
export const TRACK_HEIGHT_PX = 80;

/**
 * Scale factor for the timeline.
 */
export const TIMELINE_FACTOR_PX = 16;

/**
 * Height of region boxes in pixels.
 */
export const REGION_HEIGHT_PX = 64;

/**
 * Height of region renderings in pixels.
 */
export const REGION_RENDERING_HEIGHT_PX = 48;

/**
 * Dimensions of a scroll bar. This is really browser-specific, but for now we are simply hardwiring those values.
 * May may investigate a more robust solution later, which may rely on browser-specific CSS extensions (such as
 * `::-webkit-scrollbar). See also the design note on scrolling.
 */
export const SCROLLBAR_DIMENSIONS_PX = 15;

/**
 * The scaling factor we apply to the pan value to convert it to a UX value.
 */
export const UX_PAN_SCALE = 50;

/**
 * Initial width when we open the browser/library view.
 */
export const BROWSER_WIDTH_INITIAL = 250;

/**
 * Minimum width of the browser/library view.
 */
export const BROWSER_WIDTH_MIN = 40;

/**
 * Maximum width of the browser/library view.
 */
export const BROWSER_WIDTH_MAX = 500;

/**
 * Library JSON file. This is temporary until we have proper workspace and project mamanagement.
 *
 * The file is created using https://www.npmjs.com/package/directory-tree, and then written to disk
 * using `writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');`
 */
export const LIBRARY_JSON = 'library.json';
