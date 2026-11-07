'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '@/lib/store';
import { range, smooth } from '@/lib/math';
import { BEATS } from '@/lib/story';

const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const skyFrag = /* glsl */ `
uniform float uWarm;
varying vec3 vDir;
void main(){
  vec3 deep = vec3(0.004, 0.035, 0.022);
  vec3 emerald = vec3(0.016, 0.13, 0.085);
  float h = vDir.y;
  vec3 col = mix(emerald, deep, smoothstep(-0.1, 0.8, abs(h)));
  // a warm haze ahead of the flight direction
  float ahead = pow(max(0.0, -vDir.z), 3.0) * (1.0 - abs(h));
  col += vec3(0.42, 0.26, 0.07) * ahead * (0.12 + uWarm * 0.18);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Emerald void that always surrounds the camera. */
export function Sky() {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: { uWarm: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false }),
    [],
  );
  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position);
    mat.uniforms.uWarm.value = smooth(range(world.progress, BEATS.transition[0], BEATS.product[1]));
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 32, 16]} />
    </mesh>
  );
}

const beamVert = /* glsl */ `
uniform float uLength;
varying vec3 vNormal; varying vec3 vView; varying float vAlong;
void main(){
  vAlong = clamp(position.z / uLength, 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const beamFrag = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity;
varying vec3 vNormal; varying vec3 vView; varying float vAlong;
void main(){
  float edge = pow(abs(dot(vNormal, vView)), 2.0);
  float fall = pow(1.0 - vAlong, 1.6) * smoothstep(0.0, 0.08, vAlong);
  float a = edge * fall * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}`;

type BeamProps = {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
  /** opacity as a function of story progress */
  opacity: (p: number) => number;
};

/** Cheap volumetric light shaft (soft-edged additive cone). */
export function Beam({ from, to, radius = 2, color = '#ffcf7a', opacity }: BeamProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const { geo, mat } = useMemo(() => {
    const len = new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to));
    const geo = new THREE.CylinderGeometry(0.05, radius, len, 48, 1, true);
    geo.translate(0, -len / 2, 0);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      uniforms: { uLength: { value: len }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    return { geo, mat };
  }, [from, to, radius, color]);

  useFrame(({ clock }) => {
    mat.uniforms.uOpacity.value = opacity(world.progress) * (0.9 + Math.sin(clock.elapsedTime * 0.7) * 0.1);
    ref.current.visible = mat.uniforms.uOpacity.value > 0.002;
  });

  return <mesh ref={ref} geometry={geo} material={mat} position={from} onUpdate={(m) => m.lookAt(...to)} />;
}
