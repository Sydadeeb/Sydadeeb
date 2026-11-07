'use client';
import { useGLTF } from '@react-three/drei';

/** Renders a Blender-exported GLB when one is configured in BRAND_ASSETS.models. */
export function OptionalGLB({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={scale} />;
}
