/**
 * Brand asset slots.
 *
 * The experience never invents Pista House packaging or redraws the logo.
 * Drop the official files into /public and point these paths at them:
 *
 *   logo        – official logo (SVG/PNG). Until it is set, the nav shows the
 *                 brand name as plain set type, not an imitation of the mark.
 *   packaging.* – flat front-face artwork / photography of the real packaging.
 *                 When a path is set it is mapped onto the matching 3D box face;
 *                 otherwise the box renders as an unbranded presentation box.
 *   models.*    – optional Blender-exported GLB files that replace the
 *                 procedural meshes (see README → "Blender GLB models").
 */
export const BRAND_ASSETS: {
  logo: string | null;
  packaging: Record<'hamper' | 'roat' | 'biscuits' | 'cookies', string | null>;
  models: Record<'handi' | 'roat' | 'biscuit' | 'cookie' | 'hamper', string | null>;
} = {
  logo: null,
  packaging: {
    hamper: null,
    roat: null,
    biscuits: null,
    cookies: null,
  },
  models: {
    handi: null,
    roat: null,
    biscuit: null,
    cookie: null,
    hamper: null,
  },
};

export const PALETTE = {
  emerald: '#073D2B',
  emeraldDeep: '#03180F',
  gold: '#D6A84B',
  ivory: '#F4EBDD',
  brown: '#24140F',
  saffron: '#C8411B',
} as const;
