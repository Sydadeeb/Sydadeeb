'use client';
import * as THREE from 'three';
import { mulberry32 } from '@/lib/math';

/**
 * Procedural canvas textures for the baked goods and the engraved handi.
 * Generated once on the client — no network round-trips, tiny memory footprint.
 */
const cache = new Map<string, THREE.Texture>();

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function memo(key: string, make: () => THREE.Texture) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key)!;
}

/** Crumb / toasted-surface texture. `kind` changes the bake profile. */
export function bakeTexture(kind: 'roat' | 'biscuit' | 'cookie', bump = false) {
  return memo(`${kind}-${bump}`, () => {
    const S = 512;
    const [c, g] = canvas(S);
    const rnd = mulberry32(kind === 'roat' ? 11 : kind === 'biscuit' ? 23 : 37);
    const base = kind === 'roat' ? [196, 128, 58] : kind === 'biscuit' ? [222, 168, 92] : [176, 110, 52];
    const edge = kind === 'roat' ? [118, 62, 24] : kind === 'biscuit' ? [168, 104, 44] : [104, 54, 22];

    // radial bake: pale centre, caramelised rim
    const grad = g.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.5);
    const mid = base.map((v, i) => Math.round((v + edge[i]) / 2));
    if (bump) {
      grad.addColorStop(0, '#808080');
      grad.addColorStop(1, '#5a5a5a');
    } else {
      grad.addColorStop(0, `rgb(${base.map((v) => Math.min(255, v + 18))})`);
      grad.addColorStop(0.7, `rgb(${base})`);
      grad.addColorStop(0.9, `rgb(${mid})`);
      grad.addColorStop(1, `rgb(${edge})`);
    }
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);

    // crumb speckle
    for (let i = 0; i < 9000; i++) {
      const x = rnd() * S, y = rnd() * S, r = rnd() * 2.2 + 0.4;
      const l = rnd();
      g.fillStyle = bump
        ? `rgba(${l > 0.5 ? 255 : 0},${l > 0.5 ? 255 : 0},${l > 0.5 ? 255 : 0},${0.12 + rnd() * 0.18})`
        : l > 0.55
          ? `rgba(255,226,170,${0.08 + rnd() * 0.12})`
          : `rgba(90,44,16,${0.06 + rnd() * 0.14})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }

    if (kind === 'roat') {
      // the characteristic crackled top of dum ke roat
      g.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        let x = S / 2 + (rnd() - 0.5) * S * 0.7, y = S / 2 + (rnd() - 0.5) * S * 0.7;
        g.strokeStyle = bump ? 'rgba(0,0,0,0.85)' : `rgba(110,52,18,${0.45 + rnd() * 0.3})`;
        g.lineWidth = 1.5 + rnd() * 2.5;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (rnd() - 0.5) * 46;
          y += (rnd() - 0.5) * 46;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    }
    if (kind === 'biscuit') {
      // docking holes
      for (let yy = 0; yy < 5; yy++)
        for (let xx = 0; xx < 5; xx++) {
          const x = S * (0.22 + xx * 0.14), y = S * (0.22 + yy * 0.14);
          if (Math.hypot(x - S / 2, y - S / 2) > S * 0.34) continue;
          g.fillStyle = bump ? 'rgba(0,0,0,0.9)' : 'rgba(120,70,28,0.55)';
          g.beginPath();
          g.arc(x, y, 6, 0, Math.PI * 2);
          g.fill();
        }
    }
    // nut slivers pressed into the top
    const slivers = kind === 'roat' ? 18 : kind === 'cookie' ? 10 : 0;
    for (let i = 0; i < slivers; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * S * 0.33;
      const x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r;
      g.save();
      g.translate(x, y);
      g.rotate(rnd() * Math.PI);
      const pista = rnd() > 0.45;
      g.fillStyle = bump ? 'rgba(255,255,255,0.9)' : pista ? '#7fa24a' : '#ead7b4';
      g.beginPath();
      g.ellipse(0, 0, 12 + rnd() * 8, 4 + rnd() * 2, 0, 0, Math.PI * 2);
      g.fill();
      if (!bump && pista) {
        g.fillStyle = 'rgba(160,60,70,0.55)';
        g.fillRect(-10, -1, 20, 2);
      }
      g.restore();
    }
    return finish(c, !bump);
  });
}

/** Repoussé-style ornament bands for the antique handi (used as bump + roughness). */
export function engravingTexture() {
  return memo('engraving', () => {
    const W = 1024, H = 512;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    const rnd = mulberry32(7);
    g.fillStyle = '#808080';
    g.fillRect(0, 0, W, H);
    // patina / hammer marks
    for (let i = 0; i < 5000; i++) {
      const l = Math.floor(100 + rnd() * 60);
      g.fillStyle = `rgba(${l},${l},${l},0.25)`;
      g.beginPath();
      g.arc(rnd() * W, rnd() * H, 1 + rnd() * 5, 0, Math.PI * 2);
      g.fill();
    }
    const band = (y: number, h: number) => {
      g.fillStyle = '#c8c8c8';
      g.fillRect(0, y, W, 3);
      g.fillRect(0, y + h - 3, W, 3);
      const n = 24;
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * (W / n), cy = y + h / 2;
        // paisley-like teardrop
        g.save();
        g.translate(cx, cy);
        g.rotate(i % 2 ? 0.5 : -0.5);
        g.fillStyle = '#d8d8d8';
        g.beginPath();
        g.moveTo(0, -h * 0.32);
        g.bezierCurveTo(h * 0.3, -h * 0.2, h * 0.22, h * 0.32, 0, h * 0.3);
        g.bezierCurveTo(-h * 0.22, h * 0.32, -h * 0.14, -h * 0.05, 0, -h * 0.32);
        g.fill();
        g.fillStyle = '#5a5a5a';
        g.beginPath();
        g.arc(0, h * 0.08, h * 0.07, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    };
    band(H * 0.18, H * 0.14);
    band(H * 0.52, H * 0.2);
    // fine flutes
    for (let x = 0; x < W; x += 8) {
      g.fillStyle = 'rgba(210,210,210,0.35)';
      g.fillRect(x, H * 0.78, 3, H * 0.12);
    }
    const t = finish(c, false);
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

/** Soft round sprite used by dust and steam particles. */
export function spriteTexture() {
  return memo('sprite', () => {
    const [c, g] = canvas(128);
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return finish(c, false);
  });
}
