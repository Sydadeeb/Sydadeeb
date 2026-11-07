'use client';
import { create } from 'zustand';
import type { ProductId } from './products';

/**
 * High-frequency values (scroll progress, pointer, DOM slot rects) live in a
 * plain mutable object read inside useFrame, so they never trigger React renders.
 */
export const world = {
  /** raw ScrollTrigger progress of the story, 0..1 */
  target: 0,
  /** damped progress used by the 3D choreography */
  progress: 0,
  pointer: { x: 0, y: 0 },
  /** DOM elements the 3D collection products are anchored to */
  slots: {} as Partial<Record<ProductId, HTMLElement | null>>,
  /** per-product pointer position inside its card, -1..1 */
  tilt: {} as Partial<Record<ProductId, { x: number; y: number }>>,
};

type CartLine = { variantId: string; productId: ProductId; qty: number };

type UIState = {
  hovered: ProductId | null;
  setHovered: (id: ProductId | null) => void;
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  add: (productId: ProductId, variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  hydrate: (lines: CartLine[]) => void;
  ready: boolean;
  setReady: () => void;
  /** index into CHAPTERS of the beat currently on screen */
  chapter: number;
  setChapter: (i: number) => void;
  toast: { id: number; text: string } | null;
  notify: (text: string) => void;
};

export const useUI = create<UIState>((set) => ({
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
  cart: [],
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  add: (productId, variantId) =>
    set((s) => {
      const line = s.cart.find((l) => l.variantId === variantId);
      const cart = line
        ? s.cart.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty + 1 } : l))
        : [...s.cart, { productId, variantId, qty: 1 }];
      return { cart };
    }),
  setQty: (variantId, qty) =>
    set((s) => ({
      cart: qty <= 0 ? s.cart.filter((l) => l.variantId !== variantId) : s.cart.map((l) => (l.variantId === variantId ? { ...l, qty } : l)),
    })),
  hydrate: (cart) => set({ cart }),
  ready: false,
  setReady: () => set({ ready: true }),
  chapter: 0,
  setChapter: (chapter) => set({ chapter }),
  toast: null,
  notify: (text) => set({ toast: { id: Date.now(), text } }),
}));
