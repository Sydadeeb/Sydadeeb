/**
 * The single scroll timeline every layer (camera, 3D props, DOM copy) reads.
 * Values are fractions of the story ScrollTrigger progress.
 */
export const BEATS = {
  opening: [0.0, 0.12],
  reveal: [0.12, 0.26],
  explosion: [0.26, 0.4],
  transition: [0.4, 0.52],
  journey: [0.52, 0.76],
  product: [0.76, 0.89],
  collection: [0.89, 1.0],
} as const;

export type BeatKey = keyof typeof BEATS;

export const CHAPTERS: { key: BeatKey; index: string; label: string }[] = [
  { key: 'opening', index: 'I', label: 'The Handi' },
  { key: 'reveal', index: 'II', label: 'The Dum' },
  { key: 'explosion', index: 'III', label: 'The Bloom' },
  { key: 'transition', index: 'IV', label: 'The Spiral' },
  { key: 'journey', index: 'V', label: 'The Bakery' },
  { key: 'product', index: 'VI', label: 'The Gift' },
  { key: 'collection', index: 'VII', label: 'The Collection' },
];

/** world-space anchors shared by camera + props */
export const WORLD = {
  handiMouthY: 1.55,
  tunnelY: 3.2,
  tunnelStart: -3,
  tunnelEnd: -40,
  revealZ: -52,
  /** collection stage: camera looks straight down -Z at this plane */
  stageCamera: [0, 3, -46] as const,
  stageZ: -56,
  fov: 38,
};
