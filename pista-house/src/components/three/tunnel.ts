import * as THREE from 'three';
import { WORLD } from '@/lib/story';
import { lerp } from '@/lib/math';

/** position on the swirling ingredient tunnel the camera flies through */
export function tunnelPoint(out: THREE.Vector3, along: number, angle0: number, radius: number, time: number, speed = 0.25) {
  const z = lerp(WORLD.tunnelStart, WORLD.tunnelEnd, along);
  const a = angle0 + z * 0.32 + time * speed;
  return out.set(Math.cos(a) * radius, WORLD.tunnelY + Math.sin(a) * radius, z);
}
