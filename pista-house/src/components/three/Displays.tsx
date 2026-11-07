'use client';
import { Suspense, useRef, type ReactNode } from 'react';
import { RoundedBox, useTexture } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { getAssets } from './assets';
import { BRAND_ASSETS } from '@/lib/brand';
import type { ProductId } from '@/lib/products';

/**
 * Collection displays, modelled around the origin and roughly 2.4 units wide.
 * Food sits on hammered brass thaals; packaging only uses official artwork when
 * it is supplied (see lib/brand.ts) — otherwise an unbranded presentation box.
 */
function Plate({ y = -0.42 }: { y?: number }) {
  const a = getAssets();
  return <mesh geometry={a.plate} material={a.brassPlain} position={[0, y, 0]} scale={[1.05, 1, 1.05]} />;
}

function Bake({ kind, ...props }: { kind: 'roat' | 'biscuit' | 'cookie' } & ThreeElements['mesh']) {
  const a = getAssets();
  return <mesh geometry={a[kind]} material={a.bakeMats[kind]} {...props} />;
}

export function RoatDisplay() {
  return (
    <group>
      <Plate />
      <Bake kind="roat" position={[-0.08, -0.29, 0.02]} rotation={[0, 0.3, 0.02]} />
      <Bake kind="roat" position={[0.02, -0.1, -0.03]} rotation={[0.03, 1.2, -0.03]} />
      <Bake kind="roat" position={[-0.03, 0.09, 0.02]} rotation={[-0.04, 2.1, 0.02]} />
      <Bake kind="roat" position={[0.62, -0.08, 0.3]} rotation={[0.2, 0.4, 1.05]} />
      <Bake kind="roat" position={[-0.6, -0.16, 0.42]} rotation={[0.5, 0.9, -0.75]} scale={0.9} />
    </group>
  );
}

export function BiscuitsDisplay() {
  return (
    <group>
      <Plate />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Bake kind="biscuit" position={[0.5, -0.26, 0]} rotation={[0, 0, 0.32]} />
          </group>
        );
      })}
      <Bake kind="biscuit" position={[0, -0.1, 0]} rotation={[0.08, 0.4, 0]} />
      <Bake kind="biscuit" position={[0.05, 0.0, 0.02]} rotation={[-0.06, 1.4, 0.05]} />
    </group>
  );
}

export function CookiesDisplay() {
  return (
    <group>
      <Plate />
      {[0, 1, 2, 3, 4].map((i) => (
        <Bake key={i} kind="cookie" position={[Math.sin(i * 2.1) * 0.03, -0.32 + i * 0.15, Math.cos(i * 1.7) * 0.03]} rotation={[Math.sin(i) * 0.05, i * 1.3, Math.cos(i) * 0.05]} />
      ))}
      <Bake kind="cookie" position={[0.56, -0.2, 0.28]} rotation={[0.3, 0.2, 0.9]} />
      <Bake kind="cookie" position={[-0.55, -0.22, 0.34]} rotation={[0.4, 0.6, -0.85]} />
      <Bake kind="cookie" position={[0.1, -0.3, 0.68]} rotation={[1.2, 0, 0]} />
    </group>
  );
}

function PackagingFace({ url, width, height, position }: { url: string; width: number; height: number; position: [number, number, number] }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshPhysicalMaterial map={tex} roughness={0.5} clearcoat={0.3} />
    </mesh>
  );
}

/** Presentation box: opens in the reveal (lidOpen 0..1) to show the feast inside. */
export function HamperDisplay({ lidOpenRef }: { lidOpenRef?: { current: number } }) {
  const a = getAssets();
  const lid = useRef<THREE.Group>(null!);
  useFrame(() => {
    const o = lidOpenRef ? lidOpenRef.current : 0.6;
    lid.current.rotation.x = -o * 1.05;
    lid.current.position.y = 0.2 + o * 0.12;
  });
  const art = BRAND_ASSETS.packaging.hamper;
  return (
    <group position={[0, -0.12, 0]}>
      <RoundedBox args={[1.9, 0.62, 1.3]} radius={0.04} smoothness={4} material={a.ivoryPaper} />
      {/* gold edge banding */}
      <mesh position={[0, 0.25, 0]} material={a.brassPlain}>
        <boxGeometry args={[1.915, 0.04, 1.315]} />
      </mesh>
      <mesh position={[0, 0.315, 0]} rotation={[-Math.PI / 2, 0, 0]} material={a.innerPaper}>
        <planeGeometry args={[1.82, 1.22]} />
      </mesh>
      {/* contents */}
      <Bake kind="roat" position={[-0.5, 0.42, -0.12]} rotation={[1.25, 0, 0.05]} scale={0.85} />
      <Bake kind="roat" position={[-0.2, 0.42, -0.14]} rotation={[1.3, 0, -0.04]} scale={0.85} />
      <Bake kind="cookie" position={[0.25, 0.4, 0.1]} rotation={[0.15, 0.3, 0]} />
      <Bake kind="cookie" position={[0.6, 0.4, 0.22]} rotation={[0.1, 1, 0.1]} />
      <Bake kind="biscuit" position={[0.45, 0.45, -0.3]} rotation={[1.1, 0.2, 0]} scale={0.9} />
      {art && (
        <Suspense fallback={null}>
          <PackagingFace url={art} width={1.8} height={0.55} position={[0, 0, 0.652]} />
        </Suspense>
      )}
      {/* lid hinged at the back edge */}
      <group position={[0, 0.2, -0.65]}>
        <group ref={lid}>
          <RoundedBox args={[1.96, 0.14, 1.36]} radius={0.04} smoothness={4} position={[0, 0.07, 0.68]} material={a.ivoryPaper} />
          <mesh position={[0, 0.0, 0.68]} material={a.brassPlain}>
            <boxGeometry args={[1.98, 0.03, 1.38]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export const DISPLAY: Record<ProductId, (props: { lidOpenRef?: { current: number } }) => ReactNode> = {
  roat: () => <RoatDisplay />,
  biscuits: () => <BiscuitsDisplay />,
  cookies: () => <CookiesDisplay />,
  hamper: (props) => <HamperDisplay {...props} />,
};
