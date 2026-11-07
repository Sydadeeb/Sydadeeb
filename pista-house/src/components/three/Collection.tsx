'use client';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DISPLAY } from './Displays';
import { world, useUI } from '@/lib/store';
import { PRODUCTS, type ProductId } from '@/lib/products';
import { range, smooth, smoother, easeOutExpo, lerp, damp } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';

const REVEAL = new THREE.Vector3(0, 2.75, WORLD.revealZ);
/** where the three other products burst to around the opened box */
const GATHER: Record<ProductId, [number, number, number]> = {
  roat: [-2.6, 0.3, -0.6],
  biscuits: [2.6, 0.3, -0.6],
  cookies: [0, 1.9, -1.4],
  hamper: [0, 0, 0],
};

const _slot = new THREE.Vector3();
const _pos = new THREE.Vector3();

/**
 * Converts a DOM slot (the transparent stage area of a product card) into a
 * world position on the collection plane, as seen from the final camera pose.
 * This keeps the 3D products locked to their cards on every screen size and
 * lets them scroll with the page.
 */
function slotToWorld(el: HTMLElement, w: number, h: number, fov: number, out: THREE.Vector3) {
  const r = el.getBoundingClientRect();
  const [cx, cy, cz] = WORLD.stageCamera;
  const dist = cz - WORLD.stageZ;
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const halfW = halfH * (w / h);
  const nx = ((r.left + r.width / 2) / w) * 2 - 1;
  const ny = -(((r.top + r.height / 2) / h) * 2 - 1);
  out.set(cx + nx * halfW, cy + ny * halfH, WORLD.stageZ);
  const perPx = (halfH * 2) / h;
  return (Math.min(r.width, r.height * 1.15) * perPx) / 2.6;
}

function ProductPiece({ id, index }: { id: ProductId; index: number }) {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const lidOpen = useRef(0);
  const state = useRef({ spin: index * 1.3, hover: 0, tx: 0, ty: 0 });
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const isHamper = id === 'hamper';

  useFrame(({ clock }, dt) => {
    const p = world.progress;
    const t = clock.elapsedTime;
    const s = state.current;
    const hovered = useUI.getState().hovered === id;
    s.hover = damp(s.hover, hovered ? 1 : 0, 6, dt);

    // 1 — emergence beside / as the hero box
    let scale: number;
    if (isHamper) {
      const rise = smoother(range(p, BEATS.product[0], BEATS.product[0] + 0.08));
      _pos.set(REVEAL.x, lerp(-4.5, REVEAL.y, rise), REVEAL.z);
      scale = 1.05 * smooth(range(p, BEATS.product[0] - 0.02, BEATS.product[0] + 0.04));
      lidOpen.current = smooth(range(p, BEATS.product[0] + 0.06, BEATS.product[1] - 0.01));
    } else {
      const e = easeOutExpo(range(p, BEATS.product[0] + 0.08 + index * 0.012, BEATS.product[1] + 0.03));
      const g = GATHER[id];
      _pos.set(REVEAL.x + g[0] * e, REVEAL.y + g[1] * e, REVEAL.z + g[2] * e);
      scale = 0.6 * e;
    }

    // 2 — settle into the product card it belongs to
    const settle = smoother(range(p, BEATS.product[1] - 0.01, BEATS.collection[1]));
    const el = world.slots[id];
    if (el && settle > 0) {
      const slotScale = slotToWorld(el, size.width, size.height, camera.fov, _slot);
      _pos.lerp(_slot, settle);
      scale = lerp(scale, slotScale * (isHamper ? 0.74 : 1), settle);
      if (isHamper) lidOpen.current = lerp(lidOpen.current, 0.22 + s.hover * 0.3, settle);
    }

    const tilt = world.tilt[id];
    s.tx = damp(s.tx, tilt ? tilt.x : 0, 5, dt);
    s.ty = damp(s.ty, tilt ? tilt.y : 0, 5, dt);
    s.spin += dt * (0.22 + s.hover * 1.1) * (isHamper && settle < 0.5 ? 0.6 : 1);

    group.current.position.copy(_pos);
    group.current.position.y += Math.sin(t * 0.9 + index) * 0.03 * scale + s.hover * 0.12 * scale;
    group.current.scale.setScalar(Math.max(0.0001, scale * (1 + s.hover * 0.06)));
    group.current.visible = scale > 0.002;
    inner.current.rotation.set(lerp(0.15, 0.42, settle) + s.ty * 0.25, s.spin + s.tx * 0.6, Math.sin(t * 0.5 + index) * 0.03);
  });

  const Display = DISPLAY[id];
  return (
    <group ref={group}>
      <group ref={inner}>
        <Display lidOpenRef={lidOpen} />
      </group>
    </group>
  );
}

/** product reveal + interactive collection, one continuous set of objects */
export function Collection() {
  const hoverLight = useRef<THREE.PointLight>(null!);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 2.4, WORLD.stageZ);
    return o;
  }, []);
  const revealGlow = useRef<THREE.PointLight>(null!);

  useFrame((_, dt) => {
    const p = world.progress;
    revealGlow.current.intensity = smooth(range(p, BEATS.product[0] + 0.05, BEATS.product[1])) * 30 * (1 - range(p, BEATS.collection[0], 1) * 0.6);
    // follow whichever product is hovered with a warm accent light
    const id = useUI.getState().hovered;
    const el = id ? world.slots[id] : null;
    const l = hoverLight.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const nx = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
      l.position.x = damp(l.position.x, nx * 6, 6, dt);
      l.intensity = damp(l.intensity, 28, 6, dt);
    } else l.intensity = damp(l.intensity, 0, 4, dt);
  });

  return (
    <group>
      <primitive object={target} />
      <spotLight position={[0, 11, -45]} target={target} angle={0.75} penumbra={0.8} intensity={420} distance={30} decay={1.6} color="#ffe2b0" />
      <pointLight position={[-7, 4, -50]} intensity={40} distance={20} color="#ffb860" decay={1.4} />
      <pointLight position={[0, 8, -62]} intensity={60} distance={22} color="#d6a84b" decay={1.4} />
      <pointLight ref={hoverLight} position={[0, 5.5, -51]} intensity={0} distance={10} color="#ffd38a" decay={1.4} />
      <pointLight ref={revealGlow} position={[REVEAL.x, REVEAL.y + 1.2, REVEAL.z + 0.4]} intensity={0} distance={7} color="#ffbb55" decay={1.5} />
      {PRODUCTS.map((p, i) => (
        <ProductPiece key={p.id} id={p.id} index={i} />
      ))}
    </group>
  );
}
