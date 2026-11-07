'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getAssets } from './assets';
import { world } from '@/lib/store';
import { range, smooth, easeOutExpo, lerp } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';
import { BRAND_ASSETS } from '@/lib/brand';
import { OptionalGLB } from './OptionalGLB';

/** glowing surface of the dum biryani inside the pot */
const glowVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const glowFrag = /* glsl */ `
uniform float uIntensity; uniform float uTime;
varying vec2 vUv;
void main(){
  float d = distance(vUv, vec2(.5));
  float core = smoothstep(.5, .0, d);
  float flicker = .85 + .15 * sin(uTime * 3.1 + d * 18.);
  vec3 col = mix(vec3(1., .55, .16), vec3(1., .9, .62), core);
  gl_FragColor = vec4(col * core * flicker * uIntensity * 2.2, 1.);
}`;

export function Handi() {
  const a = getAssets();
  const group = useRef<THREE.Group>(null!);
  const lid = useRef<THREE.Group>(null!);
  const seal = useRef<THREE.Mesh>(null!);
  const glowLight = useRef<THREE.PointLight>(null!);
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: { uIntensity: { value: 0.1 }, uTime: { value: 0 } },
        toneMapped: false,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const p = world.progress;
    const t = clock.elapsedTime;
    // the pot breathes gently in the void
    group.current.position.y = Math.sin(t * 0.6) * 0.12;
    group.current.rotation.y = t * 0.05 + p * 1.2;
    group.current.rotation.z = Math.sin(t * 0.4) * 0.025;

    const open = smooth(range(p, BEATS.reveal[0] + 0.02, BEATS.reveal[1]));
    const burst = easeOutExpo(range(p, BEATS.explosion[0], BEATS.explosion[1] + 0.06));
    // lid: lifts during the reveal, then is thrown upward and away by the bloom
    lid.current.position.set(
      lerp(0, -3.2, burst),
      1.58 + open * 1.4 + burst * 4.6 + Math.sin(t * 0.8) * 0.05 * open,
      lerp(0, -1.5, burst),
    );
    lid.current.rotation.set(open * 0.22 + burst * 0.9, t * 0.1 * burst, -open * 0.12 - burst * 0.6);
    seal.current.scale.setScalar(1 - open * 0.35);
    (seal.current.material as THREE.MeshStandardMaterial).opacity = 1 - range(open, 0, 0.3);
    seal.current.visible = open < 0.3;

    const glow = 0.12 + open * 0.9 + burst * 0.6;
    glowMat.uniforms.uIntensity.value = glow * (1 - range(p, BEATS.journey[0], BEATS.journey[0] + 0.1) * 0.7);
    glowMat.uniforms.uTime.value = t;
    glowLight.current.intensity = glow * 22;
  });

  const handiGlb = BRAND_ASSETS.models.handi;

  return (
    <group ref={group}>
      {handiGlb ? (
        <OptionalGLB url={handiGlb} />
      ) : (
        <>
          <mesh geometry={a.handi} material={a.brass} />
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 1.4, 1.02, 0]} rotation={[0, s > 0 ? 0 : Math.PI, 0.55 * s]} material={a.brassPlain}>
              <torusGeometry args={[0.2, 0.04, 12, 32]} />
            </mesh>
          ))}
        </>
      )}
      {/* dough seal of the dum */}
      <mesh ref={seal} position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.27, 0.07, 10, 64]} />
        <meshStandardMaterial color="#e3c79a" roughness={0.95} transparent />
      </mesh>
      <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glowMat}>
        <circleGeometry args={[1.04, 48]} />
      </mesh>
      <pointLight ref={glowLight} position={[0, WORLD.handiMouthY + 0.4, 0]} color="#ffb347" distance={9} decay={1.6} />
      <group ref={lid}>
        <mesh geometry={a.lid} material={a.brass} />
      </group>
    </group>
  );
}
