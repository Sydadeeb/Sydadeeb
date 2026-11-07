'use client';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '@/lib/store';
import { mulberry32, range, smooth, easeOutExpo } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';
import { spriteTexture } from './textures';

const steamVert = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime, uBurst, uTunnel, uIntensity, uSize, uPR;
uniform float uMouthY, uTunnelY, uTStart, uTEnd;
varying float vAlpha;
varying float vWarm;
void main(){
  float life = fract(aSeed.x + uTime * (0.05 + 0.05 * aSeed.z));
  float ang = aSeed.y * 6.2831 + life * 2.4;
  float spread = 0.2 + life * (1.0 + uBurst * 3.8);
  vec3 rise = vec3(cos(ang) * spread, uMouthY + life * (3.2 + uBurst * 3.4), sin(ang) * spread);
  float z = mix(uTStart + 2.0, uTEnd, aSeed.x);
  float ta = aSeed.y * 6.2831 + z * 0.32 + uTime * 0.35;
  float r = 2.2 + aSeed.z * 1.6;
  vec3 tun = vec3(cos(ta) * r, uTunnelY + sin(ta) * r, z);
  float k = smoothstep(aSeed.z * 0.45, aSeed.z * 0.45 + 0.55, uTunnel);
  vec3 p = mix(rise, tun, k);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = mix(1.2 + life * 2.8, 1.1, k) * uSize;
  gl_PointSize = size * uPR * (260.0 / max(0.5, -mv.z));
  float fade = mix(sin(life * 3.14159), 0.55, k);
  vAlpha = fade * uIntensity * 0.45 * smoothstep(0.8, 4.5, -mv.z);
  vWarm = aSeed.z;
}`;

const steamFrag = /* glsl */ `
uniform sampler2D uMap;
varying float vAlpha;
varying float vWarm;
void main(){
  float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
  vec3 col = mix(vec3(1.0, 0.72, 0.32), vec3(1.0, 0.9, 0.7), vWarm) * 1.6;
  gl_FragColor = vec4(col * a, a);
}`;

/** Golden steam: wisps → slow-motion bloom → swirling tunnel walls. */
export function Steam({ count = 520 }: { count?: number }) {
  const gl = useThree((s) => s.gl);
  const { geo, mat } = useMemo(() => {
    const r = mulberry32(9);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = r();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: steamVert,
      fragmentShader: steamFrag,
      uniforms: {
        uTime: { value: 0 }, uBurst: { value: 0 }, uTunnel: { value: 0 }, uIntensity: { value: 0 },
        uSize: { value: 3.2 }, uPR: { value: 1 }, uMap: { value: spriteTexture() },
        uMouthY: { value: WORLD.handiMouthY }, uTunnelY: { value: WORLD.tunnelY },
        uTStart: { value: WORLD.tunnelStart }, uTEnd: { value: WORLD.tunnelEnd },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat };
  }, [count]);

  useFrame(({ clock }) => {
    const p = world.progress;
    const u = mat.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uPR.value = gl.getPixelRatio();
    const open = smooth(range(p, BEATS.reveal[0], BEATS.reveal[1]));
    u.uBurst.value = easeOutExpo(range(p, BEATS.explosion[0], BEATS.explosion[1] + 0.06));
    u.uTunnel.value = smooth(range(p, BEATS.transition[0], BEATS.transition[1] + 0.04));
    const out = 1 - smooth(range(p, BEATS.journey[1] - 0.04, BEATS.product[0] + 0.06));
    u.uIntensity.value = (0.14 + open * 0.4 + u.uBurst.value * 0.35 - u.uTunnel.value * 0.25) * out;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

const dustVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime, uPR, uSize;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.x += sin(uTime * 0.15 + aSeed.x * 20.0) * 0.6;
  p.y += sin(uTime * 0.21 + aSeed.y * 30.0) * 0.5 + uTime * 0.03 * (aSeed.z - 0.5);
  p.z += cos(uTime * 0.12 + aSeed.z * 25.0) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.4 + aSeed.w) * uPR * (60.0 / max(0.3, -mv.z));
  float tw = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed.w * 2.0) + aSeed.x * 40.0);
  vAlpha = tw * smoothstep(0.3, 2.0, -mv.z) * smoothstep(40.0, 14.0, -mv.z);
}`;
const dustFrag = /* glsl */ `
uniform sampler2D uMap;
varying float vAlpha;
void main(){
  float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
  gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a * 1.4, a);
}`;

/** Golden dust hanging in the air along the whole flight path. */
export function Dust({ count = 1800 }: { count?: number }) {
  const gl = useThree((s) => s.gl);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const geo = useMemo(() => {
    const r = mulberry32(5);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 26;
      pos[i * 3 + 1] = -4 + r() * 13;
      pos[i * 3 + 2] = 18 - r() * 82;
      seed.set([r(), r(), r(), r()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPR: { value: 1 }, uSize: { value: 1 }, uMap: { value: spriteTexture() } }), []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPR.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={dustVert}
        fragmentShader={dustFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
