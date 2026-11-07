'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getAssets } from './assets';
import { world } from '@/lib/store';
import { mulberry32, range, smooth } from '@/lib/math';
import { BEATS } from '@/lib/story';
import { tunnelPoint } from './tunnel';

const _o = new THREE.Object3D();
const _a = new THREE.Vector3();
const _c = new THREE.Vector3();

type Kind = 'roat' | 'biscuit' | 'cookie';

/**
 * Biscuits, cookies and Dum Ke Roat: a few drift in a slow halo around the
 * handi at the opening, then the whole bakery assembles into the corridor the
 * camera flies through.
 */
function Swarm({ kind, count, seed, halo }: { kind: Kind; count: number; seed: number; halo: number }) {
  const a = getAssets();
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => ({
      inHalo: i < halo,
      orbitR: 4.4 + r() * 2.2,
      orbitA: r() * Math.PI * 2,
      orbitY: -0.6 + r() * 3.4,
      orbitSpeed: 0.03 + r() * 0.04,
      // spread evenly along the corridor so the flight has a steady rhythm
      along: (i + r() * 0.8) / count,
      tAngle: r() * Math.PI * 2,
      tRadius: 1.1 + r() * 1.5,
      tilt: new THREE.Euler(r() * Math.PI, r() * Math.PI, r() * Math.PI),
      spin: 0.15 + r() * 0.35,
      phase: r() * Math.PI * 2,
      delay: r(),
      scale: 0.9 + r() * 0.3,
    }));
  }, [count, seed, halo]);

  useFrame(({ clock }) => {
    const p = world.progress;
    const t = clock.elapsedTime;
    const materialise = smooth(range(p, BEATS.explosion[1] - 0.04, BEATS.transition[1]));
    const leave = 1 - smooth(range(p, BEATS.product[0] + 0.02, BEATS.product[0] + 0.08));
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      tunnelPoint(_c, d.along, d.tAngle, d.tRadius, t, 0.06);
      let s: number;
      if (d.inHalo) {
        const ang = d.orbitA + t * d.orbitSpeed;
        _a.set(Math.cos(ang) * d.orbitR, d.orbitY + Math.sin(t * 0.4 + d.phase) * 0.35, Math.sin(ang) * d.orbitR);
        const w = smooth(range(p, BEATS.transition[0] + d.delay * 0.04, BEATS.transition[1] + 0.04 + d.delay * 0.06));
        _o.position.copy(_a).lerp(_c, w);
        s = 1;
      } else {
        _o.position.copy(_c);
        s = smooth(range(materialise, d.delay * 0.5, d.delay * 0.5 + 0.5));
      }
      _o.rotation.set(d.tilt.x + t * d.spin * 0.5, d.tilt.y + t * d.spin, d.tilt.z);
      _o.scale.setScalar(d.scale * s * leave);
      _o.updateMatrix();
      mesh.current.setMatrixAt(i, _o.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[a[kind], a.bakeMats[kind], count]} frustumCulled={false} />;
}

export function BakedSwarm({ density = 1 }: { density?: number }) {
  const n = Math.max(10, Math.round(24 * density));
  return (
    <>
      <Swarm kind="roat" count={n} seed={11} halo={3} />
      <Swarm kind="biscuit" count={n} seed={22} halo={4} />
      <Swarm kind="cookie" count={n} seed={33} halo={4} />
    </>
  );
}

