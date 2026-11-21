"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { onayakhi, openOnayakhiInstagram } from "@/data/onayakhi";
import { Interactive } from "../desk/Interactive";
import { useTrigger, wobble, type Trigger } from "../desk/useTrigger";

/** Bag front matches the photo crop (442×640). */
const W = 0.75;
const H = W * (640 / 442);
const D = 0.3;
const MAROON = "#7A1C22";

/** Twisted-rope handle: a half loop rising from the bag top. */
function useHandleGeometry() {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0, 0),
      new THREE.Vector3(-0.15, 0.2, 0),
      new THREE.Vector3(0, 0.3, 0),
      new THREE.Vector3(0.15, 0.2, 0),
      new THREE.Vector3(0.16, 0, 0),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.012, 6, false);
  }, []);
}

/** The bag itself (rocks on its bottom edge when `trigger` fires). Reused by the store. */
export function BagBody({ trigger }: { trigger: Trigger }) {
  const front = useTexture("/textures/onayakhi-bag.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  const handle = useHandleGeometry();
  const rock = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (rock.current) rock.current.rotation.z = wobble(trigger.since(state), 0.12, 1.8, 0.6);
  });

  return (
    <group ref={rock}>
      <mesh position-y={H / 2} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        {/* +x, -x, +y, -y, +z (front), -z */}
        <meshStandardMaterial attach="material-0" color={MAROON} roughness={0.75} />
        <meshStandardMaterial attach="material-1" color={MAROON} roughness={0.75} />
        <meshStandardMaterial attach="material-2" color="#3a1a1a" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#efe6d6" roughness={0.9} />
        <meshStandardMaterial attach="material-4" map={front} roughness={0.85} />
        <meshStandardMaterial attach="material-5" color="#efe6d6" roughness={0.85} />
      </mesh>
      {/* Rope handles, front and back */}
      {[D / 2 - 0.03, -D / 2 + 0.03].map((z) => (
        <mesh key={z} geometry={handle} position={[0, H, z]} castShadow>
          <meshStandardMaterial color={MAROON} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Bag height in local units (for stacking/labels). */
export const BAG_HEIGHT = H;

/**
 * Onayakhi shopping bag — Anu's brand packaging. Click: the bag rocks and
 * the brand's Instagram opens in a new tab.
 */
export function OnayakhiBag(props: React.JSX.IntrinsicElements["group"]) {
  const trigger = useTrigger();

  return (
    <Interactive
      name="onayakhi-bag"
      label="Onayakhi packaging"
      hint={`“${onayakhi.tagline}”`}
      href={onayakhi.instagram}
      hrefLabel="@0nayakhi on Instagram ↗"
      sound="paper"
      lift={0.04}
      labelOffset={[0, H + 0.55, 0]}
      onActivate={() => {
        trigger.fire();
        openOnayakhiInstagram();
      }}
      {...props}
    >
      <BagBody trigger={trigger} />
    </Interactive>
  );
}
