'use client';
import * as THREE from 'three';
import { bakeTexture, engravingTexture } from './textures';
import { PALETTE } from '@/lib/brand';

/**
 * Shared geometries + materials. Everything is created once and reused by
 * instanced meshes and the collection displays, keeping draw calls and GPU
 * memory low.
 */
let shared: ReturnType<typeof build> | null = null;
export const getAssets = () => (shared ??= build());

const v2 = (x: number, y: number) => new THREE.Vector2(x, y);

/** planar top-down UVs so round bakes receive the round bake texture */
function planarUV(geo: THREE.BufferGeometry, radius: number) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / (radius * 2) + 0.5;
    uv[i * 2 + 1] = pos.getZ(i) / (radius * 2) + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function puck(radius: number, height: number, dome: number, noise = 0, seed = 1) {
  const h = height / 2;
  const pts = [
    v2(0, -h),
    v2(radius * 0.88, -h),
    v2(radius * 0.97, -h * 0.6),
    v2(radius, 0),
    v2(radius * 0.97, h * 0.6),
    v2(radius * 0.86, h),
    v2(radius * 0.55, h + dome * 0.7),
    v2(0, h + dome),
  ];
  const geo = new THREE.LatheGeometry(pts, 48);
  if (noise) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (y > 0) {
        const n = Math.sin(x * 23 + seed) * Math.cos(z * 19 - seed) + Math.sin((x + z) * 41) * 0.5;
        pos.setY(i, y + n * noise * (y / (h + dome)));
      }
    }
    geo.computeVertexNormals();
  }
  return planarUV(geo, radius);
}

function build() {
  // ── Handi (antique brass cooking pot) ────────────────────────────────
  const handiProfile = [
    v2(0, -1.45), v2(0.62, -1.45), v2(0.7, -1.4), v2(0.72, -1.32), v2(0.86, -1.26),
    v2(1.22, -1.08), v2(1.56, -0.66), v2(1.74, -0.12), v2(1.76, 0.18), v2(1.66, 0.6),
    v2(1.42, 0.98), v2(1.18, 1.26), v2(1.1, 1.38), v2(1.18, 1.47), v2(1.32, 1.54),
    v2(1.34, 1.6), v2(1.22, 1.6), v2(1.08, 1.5), v2(1.03, 1.3), v2(1.0, 1.05),
  ];
  const handi = new THREE.LatheGeometry(handiProfile, 96);
  const lidProfile = [
    v2(0, 0.66), v2(0.07, 0.66), v2(0.12, 0.6), v2(0.11, 0.52), v2(0.07, 0.47),
    v2(0.16, 0.42), v2(0.5, 0.36), v2(0.92, 0.22), v2(1.24, 0.08), v2(1.4, 0.02),
    v2(1.41, -0.03), v2(1.3, -0.02), v2(1.0, 0.1), v2(0.5, 0.22), v2(0, 0.26),
  ];
  const lid = new THREE.LatheGeometry(lidProfile, 96);
  const engraving = engravingTexture();
  const brass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9a441'),
    metalness: 1,
    roughness: 0.32,
    roughnessMap: engraving,
    bumpMap: engraving,
    bumpScale: 2.2,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    envMapIntensity: 1.25,
  });
  const brassPlain = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c9953a'),
    metalness: 1,
    roughness: 0.26,
    clearcoat: 0.4,
    envMapIntensity: 1.2,
  });
  const dough = new THREE.MeshStandardMaterial({ color: '#e3c79a', roughness: 0.95 });

  // ── Nuts & spices ────────────────────────────────────────────────────
  const pista = new THREE.SphereGeometry(1, 14, 10);
  {
    const pos = pista.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const shell = new THREE.Color('#d8c39a'), kernel = new THREE.Color('#86a83f'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      c.copy(shell).lerp(kernel, THREE.MathUtils.smoothstep(y, 0.35, 0.75));
      col.set([c.r, c.g, c.b], i * 3);
    }
    pista.setAttribute('color', new THREE.BufferAttribute(col, 3));
    pista.scale(0.16, 0.1, 0.1);
  }
  const cashew = new THREE.TorusGeometry(0.11, 0.055, 10, 18, Math.PI * 1.15);
  cashew.rotateZ(-Math.PI * 0.08);
  const almond = new THREE.SphereGeometry(1, 14, 10);
  {
    const pos = almond.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const taper = 1 - 0.45 * THREE.MathUtils.smoothstep(y, -0.2, 1);
      pos.setX(i, pos.getX(i) * taper);
      pos.setZ(i, pos.getZ(i) * taper);
    }
    almond.scale(0.08, 0.17, 0.045);
    almond.computeVertexNormals();
  }
  const nutMats = {
    pista: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#fff1c8') }),
    cashew: new THREE.MeshPhysicalMaterial({ color: '#ecd6a8', roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#fff4d8') }),
    almond: new THREE.MeshPhysicalMaterial({ color: '#94532a', roughness: 0.72, sheen: 0.4, sheenColor: new THREE.Color('#e2a16a') }),
  };

  const saffronCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.22, 0), new THREE.Vector3(0.03, -0.07, 0.01), new THREE.Vector3(-0.02, 0.08, -0.01), new THREE.Vector3(0.02, 0.22, 0),
  ]);
  const saffron = new THREE.TubeGeometry(saffronCurve, 12, 0.008, 5, false);
  const saffronMat = new THREE.MeshStandardMaterial({ color: PALETTE.saffron, emissive: '#7a1a05', emissiveIntensity: 0.6, roughness: 0.5 });

  // ── Baked goods ──────────────────────────────────────────────────────
  const roat = puck(0.5, 0.17, 0.05, 0.012, 3);
  const biscuit = puck(0.42, 0.08, 0.015, 0.004, 5);
  const cookie = puck(0.3, 0.12, 0.08, 0.02, 9);
  const bake = (kind: 'roat' | 'biscuit' | 'cookie', bumpScale: number) =>
    new THREE.MeshPhysicalMaterial({
      map: bakeTexture(kind),
      bumpMap: bakeTexture(kind, true),
      bumpScale,
      roughness: 0.78,
      sheen: 0.7,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color('#ffd79a'),
      envMapIntensity: 0.6,
    });
  const bakeMats = { roat: bake('roat', 3), biscuit: bake('biscuit', 2), cookie: bake('cookie', 3.5) };

  // ── Display props ────────────────────────────────────────────────────
  const plate = new THREE.LatheGeometry(
    [v2(0, 0), v2(0.9, 0), v2(1.02, 0.04), v2(1.1, 0.1), v2(1.08, 0.12), v2(0.98, 0.07), v2(0.85, 0.03), v2(0, 0.03)],
    72,
  );
  const ivoryPaper = new THREE.MeshPhysicalMaterial({ color: PALETTE.ivory, roughness: 0.62, sheen: 0.3, sheenColor: new THREE.Color('#ffffff') });
  const innerPaper = new THREE.MeshStandardMaterial({ color: '#2a1810', roughness: 0.9 });

  return { handi, lid, brass, brassPlain, dough, pista, cashew, almond, nutMats, saffron, saffronMat, roat, biscuit, cookie, bakeMats, plate, ivoryPaper, innerPaper };
}
