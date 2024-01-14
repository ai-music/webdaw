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
 * Timeout before we switch from click to drag mode.
 */
export const CLICK_TO_DRAG_TIMEOUT_MS = 200;

/**
 * Library JSON file. This is temporary until we have proper workspace and project mamanagement.
 *
 * The file is created using https://www.npmjs.com/package/directory-tree, and then written to disk
 * using `writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');`
 */
export const LIBRARY_JSON = 'library.json';

/**
 * The ID of the region area.
 */
export const REGION_AREA_ID = 'region-area';

/**
 * The ID of the region scroll view containing the area.
 */
export const REGION_SCROLL_VIEW_ID = 'region-scroll-view';

/**
 * The ID of the region placeholder box for dragging new regions into the arrangement.
 */
export const REGION_PLACEHOLDER_ID = 'region-placeholder';

/**
 * The list of colors we are using for tracks and regions.
 *
 * We extracted this list from https://github.com/uiwjs/react-color/blob/main/packages/color-compact/src/index.tsx.
 */
export const COLORS = [
  '#4D4D4D',
  '#999999',
  '#FFFFFF',
  '#F44E3B',
  '#FE9200',
  '#FCDC00',
  '#DBDF00',
  '#A4DD00',
  '#68CCCA',
  '#73D8FF',
  '#AEA1FF',
  '#FDA1FF',
  '#333333',
  '#808080',
  '#cccccc',
  '#D33115',
  '#E27300',
  '#FCC400',
  '#B0BC00',
  '#68BC00',
  '#16A5A5',
  '#009CE0',
  '#7B64FF',
  '#FA28FF',
  '#000000',
  '#666666',
  '#B3B3B3',
  '#9F0500',
  '#C45100',
  '#FB9E00',
  '#808900',
  '#194D33',
  '#0C797D',
  '#0062B1',
  '#653294',
  '#AB149E',
];
