"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { onayakhi, openOnayakhiInstagram } from "@/data/onayakhi";
import { Interactive } from "../desk/Interactive";
import { smooth, useTrigger } from "../desk/useTrigger";
import { sharedTexture } from "../textures";

const R = 0.2;
const H = 0.42;
const COFFEE_TOP = H - 0.05;
/** Artwork band: 220×320 crop → arc width = height × 0.6875. */
const ART_H = 0.36;
const ART_THETA = (ART_H * (220 / 320)) / R;

function paintSteam(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Three soft puffs that rise, drift and fade on a loop. */
function Steam() {
  const puffs = useRef<(THREE.Mesh | null)[]>([]);
  const map = sharedTexture("steam", 64, 64, paintSteam);
  useFrame((state) => {
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const t = (state.clock.elapsedTime * 0.35 + i / 3) % 1;
      p.position.set(Math.sin(t * 6 + i * 2) * 0.05, COFFEE_TOP + 0.05 + t * 0.55, 0);
      p.scale.setScalar(0.12 + t * 0.22);
      (p.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.5;
    });
  });
  return (
    <Billboard>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            puffs.current[i] = el;
          }}
          raycast={() => null}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={map} transparent depthWrite={false} opacity={0} />
        </mesh>
      ))}
    </Billboard>
  );
}

/**
 * Onayakhi mug — Anu's first printed product — full of coffee, steaming,
 * on the alpona coaster. Click: slurp! (coffee level drops) and the brand's
 * Instagram opens in a new tab.
 */
export function OnayakhiMug(props: React.JSX.IntrinsicElements["group"]) {
  const [art, tag] = useTexture(["/textures/onayakhi-mug-art.webp", "/textures/onayakhi-tag.webp"], (ts) =>
    ts.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)),
  );
  const trigger = useTrigger();
  const coffee = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!coffee.current) return;
    const t = trigger.since(state);
    // Sip: drop 6 cm over 0.6 s, then slowly "refill" over 4 s.
    const dip = t < 0.6 ? smooth(t / 0.6) : 1 - smooth((t - 1.5) / 4);
    coffee.current.position.y = COFFEE_TOP - 0.06 * (Number.isFinite(t) ? dip : 0);
  });

  return (
    <Interactive
      name="onayakhi-mug"
      label="Onayakhi mug ☕"
      hint="Anu's own brand — her first printed product"
      href={onayakhi.instagram}
      hrefLabel="@0nayakhi on Instagram ↗"
      sound="slurp"
      lift={0.05}
      labelOffset={[0, 1.0, 0]}
      onActivate={() => {
        trigger.fire();
        openOnayakhiInstagram();
      }}
      {...props}
    >
      {/* Black ceramic body (open top) + base */}
      <mesh position-y={H / 2} castShadow receiveShadow>
        <cylinderGeometry args={[R, R * 0.96, H, 40, 1, true]} />
        <meshStandardMaterial color="#111111" roughness={0.25} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.01}>
        <cylinderGeometry args={[R * 0.96, R * 0.96, 0.02, 40]} />
        <meshStandardMaterial color="#111111" roughness={0.3} />
      </mesh>
      {/* Rim */}
      <mesh position-y={H} rotation-x={Math.PI / 2}>
        <torusGeometry args={[R - 0.006, 0.008, 6, 40]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
      </mesh>
      {/* Printed artwork wrapped around the front (θ = 0 faces +z) */}
      <mesh position-y={H / 2 + 0.005}>
        <cylinderGeometry args={[R + 0.0015, R * 0.96 + 0.0015, ART_H, 32, 1, true, -ART_THETA / 2, ART_THETA]} />
        <meshStandardMaterial map={art} roughness={0.3} />
      </mesh>
      {/* Coffee */}
      <mesh ref={coffee} position-y={COFFEE_TOP} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[R - 0.012, 32]} />
        <meshStandardMaterial color="#3B2414" roughness={0.15} metalness={0.1} />
      </mesh>
      <Steam />

      {/* Handle (left, as in the product photo) */}
      <mesh position={[-R - 0.06, H / 2 + 0.02, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.1, 0.022, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#111111" roughness={0.25} />
      </mesh>
      {/* Logo hang-tag tied to the handle */}
      <group position={[-R - 0.13, H / 2 - 0.02, 0.06]} rotation={[0, 0.25, 0.08]}>
        <mesh position-y={0.06}>
          <boxGeometry args={[0.004, 0.09, 0.004]} />
          <meshStandardMaterial color="#e8e2d4" />
        </mesh>
        <mesh position-y={-0.04} castShadow>
          <boxGeometry args={[0.12, 0.155, 0.004]} />
          <meshStandardMaterial map={tag} roughness={0.8} />
        </mesh>
      </group>
    </Interactive>
  );
}
