'use client';
import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Handi } from './Handi';
import { Ingredients, Saffron } from './Ingredients';
import { BakedSwarm } from './BakedSwarm';
import { Steam, Dust } from './Particles';
import { Sky, Beam } from './Atmosphere';
import { Collection } from './Collection';
import { CameraRig } from './CameraRig';
import { useUI } from '@/lib/store';
import { range, smooth } from '@/lib/math';
import { BEATS, WORLD } from '@/lib/story';

export type Tier = 'high' | 'low';

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} color="#9fd4bc" />
      {/* warm key from above-front, cool emerald fill, golden rim behind */}
      <directionalLight position={[4, 9, 7]} intensity={2.2} color="#ffe0b0" />
      <directionalLight position={[-8, 2, 2]} intensity={0.7} color="#3fae82" />
      <directionalLight position={[0, 5, -9]} intensity={2.4} color="#d6a84b" />
      <pointLight position={[0, WORLD.tunnelY, -18]} intensity={30} distance={22} color="#ffc070" decay={1.3} />
      <pointLight position={[0, WORLD.tunnelY, -32]} intensity={30} distance={22} color="#ffb257" decay={1.3} />
    </>
  );
}

function Studio() {
  // reflections for the brass — built from light cards, no HDR download
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#04170f']} />
      <Lightformer form="rect" intensity={4} color="#ffe2b0" position={[0, 6, 2]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={2} color="#ffd18a" position={[-6, 1, 3]} scale={[3, 8, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} color="#2f9a6d" position={[6, 0, 0]} scale={[3, 8, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={3} color="#fff1d6" position={[0, 2, 8]} scale={4} />
      <Lightformer form="rect" intensity={1.2} color="#d6a84b" position={[0, -5, 0]} scale={[12, 4, 1]} rotation-x={-Math.PI / 2} />
    </Environment>
  );
}

export default function Scene({ tier }: { tier: Tier }) {
  const setReady = useUI((s) => s.setReady);
  const [dpr, setDpr] = useState<number>(tier === 'high' ? 1.75 : 1.25);
  const high = tier === 'high';
  const [fx, setFx] = useState(high);
  useEffect(() => setFx(high), [high]);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: !high, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: WORLD.fov, near: 0.1, far: 400, position: [0, 1.2, 13.5] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.FogExp2('#04170f', 0.032);
        requestAnimationFrame(() => setReady());
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.25));
          setFx(false);
        }}
        onIncline={() => setDpr((d) => Math.min(high ? 2 : 1.5, d + 0.25))}
      />
      <AdaptiveDpr />
      <color attach="background" args={['#021109']} />
      <CameraRig />
      <Sky />
      <Lights />
      <Suspense fallback={null}>
        <Studio />
        <Handi />
        <Ingredients density={high ? 1 : 0.55} />
        <Saffron count={high ? 90 : 45} />
        <BakedSwarm density={high ? 1 : 0.6} />
        <Collection />
      </Suspense>
      <Steam count={high ? 560 : 260} />
      <Dust count={high ? 2000 : 900} />
      {/* volumetric shafts: over the handi, and over the gift reveal */}
      <Beam
        from={[1.5, 11, -1]}
        to={[0, -1.5, 0]}
        radius={3.4}
        opacity={(p) => (0.22 + smooth(range(p, BEATS.reveal[0], BEATS.explosion[1])) * 0.25) * (1 - smooth(range(p, BEATS.transition[0], BEATS.journey[0])))}
      />
      <Beam from={[-4, 10, 2]} to={[1, -2, -1]} radius={2.2} color="#ffd9a0" opacity={(p) => 0.12 * (1 - smooth(range(p, BEATS.transition[0], BEATS.journey[0])))} />
      <Beam
        from={[0, 12, WORLD.revealZ - 1]}
        to={[0, 0, WORLD.revealZ]}
        radius={3.2}
        opacity={(p) => smooth(range(p, BEATS.product[0], BEATS.product[0] + 0.07)) * 0.4 * (1 - smooth(range(p, BEATS.collection[0], 1)) * 0.75)}
      />
      {fx && (
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.62} luminanceSmoothing={0.25} radius={0.75} />
          <Vignette offset={0.28} darkness={0.72} />
          <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
