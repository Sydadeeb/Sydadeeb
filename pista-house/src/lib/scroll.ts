'use client';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/** the master story trigger, shared so navigation can jump to any beat */
let story: ScrollTrigger | null = null;
export const setStoryTrigger = (st: ScrollTrigger | null) => (story = st);

const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrollToProgress(p: number) {
  if (!story) return;
  window.scrollTo({ top: story.start + (story.end - story.start) * p, behavior: reduce() ? 'auto' : 'smooth' });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: reduce() ? 'auto' : 'smooth' });
}
