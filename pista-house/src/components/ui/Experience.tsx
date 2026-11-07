'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { world, useUI } from '@/lib/store';
import { Story } from './Story';
import { CollectionSection, CartDrawer } from './Shop';
import { Nav, ChapterRail, Loader, Toast, Footer } from './Chrome';
import { FallbackBackdrop } from './Fallback';
import type { Tier } from '../three/Scene';

const Scene = dynamic(() => import('../three/Scene'), { ssr: false });

type Mode = 'pending' | '3d' | 'static';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const CART_KEY = 'pista-house-bag';

export function Experience() {
  const [mode, setMode] = useState<Mode>('pending');
  const [tier, setTier] = useState<Tier>('high');
  const ready = useUI((s) => s.ready);
  const atCollection = useUI((s) => s.chapter === 6);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    let pref: string | null = null;
    try {
      pref = localStorage.getItem('pista-house-motion');
    } catch {}
    setTier(small || cores <= 4 ? 'low' : 'high');
    setMode(!hasWebGL() ? 'static' : pref === '3d' ? '3d' : pref === 'static' || reduce ? 'static' : '3d');
    const t = setTimeout(() => setTimedOut(true), 6000);

    const onMove = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // the bag survives reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) useUI.getState().hydrate(JSON.parse(saved));
    } catch {}
    return useUI.subscribe((s, prev) => {
      if (s.cart !== prev.cart)
        try {
          localStorage.setItem(CART_KEY, JSON.stringify(s.cart));
        } catch {}
    });
  }, []);

  const switchMode = (m: Mode) => {
    try {
      localStorage.setItem('pista-house-motion', m);
    } catch {}
    setMode(m);
  };

  return (
    <>
      <Loader show={mode === 'pending' || (mode === '3d' && !ready && !timedOut)} />
      {mode === '3d' && (
        <div className="canvas-layer" aria-hidden>
          <Scene tier={tier} />
        </div>
      )}
      {mode === 'static' && <FallbackBackdrop />}
      <div className="grain" aria-hidden />
      <Nav />
      <ChapterRail />
      <main className="content">
        <Story compact={mode === 'static'} />
        <CollectionSection show3D={mode === '3d'} />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
      {mode !== 'pending' && (
        <button className="motion-toggle" data-hidden={atCollection} onClick={() => switchMode(mode === '3d' ? 'static' : '3d')}>
          {mode === '3d' ? 'Reduce motion' : 'Play the 3D film'}
        </button>
      )}
    </>
  );
}
