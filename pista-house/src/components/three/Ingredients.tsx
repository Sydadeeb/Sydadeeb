'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getAssets } from './assets';
import { world } from '@/lib/store';
import { mulberry32, range, smooth, easeOutExpo } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';
import { tunnelPoint } from './tunnel';

type Kind = 'pista' | 'cashew' | 'almond';

const _o = new THREE.Object3D();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

/**
 * Pistachios, cashews and almonds. Every nut has three states that the scroll
 * blends between — floating orbit → slow-motion burst → swirling tunnel — so
 * the same objects carry the eye through the whole film.
 */
function NutSwarm({ kind, count, seed }: { kind: Kind; count: number; seed: number }) {
  const a = getAssets();
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const burstGroup = r() < 0.45;
      const dir = new THREE.Vector3(r() * 2 - 1, 0.35 + r() * 1.1, r() * 2 - 1).normalize();
      return {
        burstGroup,
        orbitR: 3.2 + r() * 4.8,
        orbitA: r() * Math.PI * 2,
        orbitY: -1.4 + r() * 4.2,
        orbitSpeed: (0.04 + r() * 0.08) * (r() < 0.5 ? 1 : -1),
        phase: r() * Math.PI * 2,
        dir,
        dist: 3 + r() * 6.5,
        along: r(),
        tAngle: r() * Math.PI * 2,
        tRadius: 2.0 + r() * 1.9,
        delay: r(),
        spin: new THREE.Vector3(r(), r(), r()).normalize(),
        spinSpeed: 0.3 + r() * 1.2,
        scale: 0.8 + r() * 0.6,
      };
    });
  }, [count, seed]);

  useFrame(({ clock }) => {
    const p = world.progress;
    const t = clock.elapsedTime;
    const burst = easeOutExpo(range(p, BEATS.explosion[0], BEATS.explosion[1] + 0.06));
    const appear = smooth(range(p, BEATS.explosion[0] - 0.01, BEATS.explosion[0] + 0.02));
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      // A — floating around the handi
      const ang = d.orbitA + t * d.orbitSpeed;
      if (d.burstGroup) {
        _a.set(0, WORLD.handiMouthY - 0.1, 0);
        _b.copy(d.dir).multiplyScalar(d.dist * burst).add(_a);
        _b.y += Math.sin(t * 0.7 + d.phase) * 0.15 * burst;
      } else {
        _a.set(Math.cos(ang) * d.orbitR, d.orbitY + Math.sin(t * 0.5 + d.phase) * 0.3, Math.sin(ang) * d.orbitR);
        _b.copy(_a).multiplyScalar(1 + burst * 0.35);
      }
      // C — the tunnel
      const w = smooth(range(p, BEATS.transition[0] + d.delay * 0.06, BEATS.transition[1] - 0.02 + d.delay * 0.06));
      tunnelPoint(_c, d.along, d.tAngle, d.tRadius, t, 0.18);
      _o.position.copy(_b).lerp(_c, w);
      _o.quaternion.setFromAxisAngle(d.spin, t * d.spinSpeed + d.phase);
      _o.scale.setScalar(d.scale * (d.burstGroup ? appear : 1));
      _o.updateMatrix();
      mesh.current.setMatrixAt(i, _o.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[a[kind], a.nutMats[kind], count]} frustumCulled={false} />;
}

export function Ingredients({ density = 1 }: { density?: number }) {
  const n = Math.round(56 * density);
  return (
    <>
      <NutSwarm kind="pista" count={n} seed={101} />
      <NutSwarm kind="cashew" count={Math.round(n * 0.8)} seed={202} />
      <NutSwarm kind="almond" count={Math.round(n * 0.8)} seed={303} />
    </>
  );
}

/** Saffron strands drifting in a slow river that later streams down the tunnel. */
export function Saffron({ count = 140 }: { count?: number }) {
  const a = getAssets();
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: count }, () => ({
      u: r(),
      lane: (r() - 0.5) * 1.6,
      height: (r() - 0.5) * 1.2,
      speed: 0.012 + r() * 0.012,
      along: r(),
      tAngle: r() * Math.PI * 2,
      tRadius: 1.4 + r() * 2.6,
      phase: r() * 10,
      delay: r(),
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const p = world.progress;
    const t = clock.elapsedTime;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const u = (d.u + t * d.speed) % 1;
      const ang = u * Math.PI * 2;
      const R = 5.2 + d.lane + Math.sin(ang * 3 + d.phase) * 0.6;
      _a.set(Math.cos(ang) * R, 1.0 + Math.sin(ang * 2 + d.phase) * 1.6 + d.height, Math.sin(ang) * R * 0.75 - 0.8);
      const w = smooth(range(p, BEATS.transition[0] - 0.02 + d.delay * 0.08, BEATS.transition[1] + d.delay * 0.08));
      tunnelPoint(_c, d.along, d.tAngle, d.tRadius, t, 0.4);
      _o.position.copy(_a).lerp(_c, w);
      _o.rotation.set(Math.sin(t * 0.9 + d.phase) * 1.2, t * 0.6 + d.phase, ang + Math.sin(t + d.phase) * 0.5);
      _o.scale.set(0.75, 0.8, 0.75);
      _o.updateMatrix();
      mesh.current.setMatrixAt(i, _o.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[a.saffron, a.saffronMat, count]} frustumCulled={false} />;
}
