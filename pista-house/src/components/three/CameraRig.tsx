'use client';
import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '@/lib/store';
import { damp, range, smooth, lerp } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';

/** [progress, camera position, look target] — one continuous flight */
const KEYS: [number, [number, number, number], [number, number, number]][] = [
  [0.0, [0, 1.2, 13.5], [0, -0.9, 0]],
  [0.12, [0.7, 1.3, 7.6], [0, 0.4, 0]],
  [0.26, [3.6, 2.6, 7.6], [-1.3, 1.5, 0]],
  [0.4, [-1.6, 3.6, 7.8], [1.2, 3.1, 0]],
  [0.52, [0, 3.3, 1.4], [0, 3.2, -8]],
  [0.76, [0, 3.15, -37], [0, 3.0, -50]],
  [0.89, [0, 3.0, -44.6], [0, 2.85, WORLD.revealZ]],
  [1.0, [WORLD.stageCamera[0], WORLD.stageCamera[1], WORLD.stageCamera[2]], [0, 3, WORLD.stageZ]],
];

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const { posCurve, tgtCurve } = useMemo(
    () => ({
      posCurve: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal'),
      tgtCurve: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal'),
    }),
    [],
  );
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() }), []);

  useFrame(({ clock }, dt) => {
    // cinematic inertia on top of the scrubbed scroll position
    const delta = Math.min(dt, 0.1);
    world.progress = damp(world.progress, world.target, 3.2, delta);
    if (Math.abs(world.progress - world.target) < 1e-5) world.progress = world.target;
    const p = world.progress;
    const t = clock.elapsedTime;

    // map progress → curve parameter so each keyframe is hit at its beat
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const local = range(p, KEYS[i][0], KEYS[i + 1][0]);
    const eased = lerp(local, smooth(local), 0.45);
    const u = (i + eased) / (KEYS.length - 1);
    posCurve.getPoint(u, tmp.pos);
    tgtCurve.getPoint(u, tmp.tgt);

    // breathing handheld drift + pointer parallax; fades out at the collection
    const free = 1 - smooth(range(p, BEATS.collection[0], 1));
    tmp.pos.x += (Math.sin(t * 0.31) * 0.08 + world.pointer.x * 0.35) * free;
    tmp.pos.y += (Math.sin(t * 0.43) * 0.06 + world.pointer.y * 0.2) * free;

    // portrait screens get a wider lens so the composition survives
    const fov = size.width / size.height < 0.8 ? 52 : size.width / size.height < 1.2 ? 45 : WORLD.fov;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    // portrait: lift the handi above the headline during the opening beats
    if (size.width / size.height < 0.8) tmp.tgt.y -= 1.1 * (1 - smooth(range(p, BEATS.explosion[1], BEATS.transition[1])));
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.tgt);
    // a gentle barrel roll while flying the tunnel
    const roll = smooth(range(p, BEATS.transition[1], BEATS.journey[0] + 0.05)) * (1 - smooth(range(p, BEATS.journey[1] - 0.06, BEATS.journey[1])));
    camera.rotateZ(Math.sin(p * 40) * 0.07 * roll);
  });

  return null;
}
