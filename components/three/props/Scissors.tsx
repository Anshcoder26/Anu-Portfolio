"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { smooth, useTrigger } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";

/** Tapered blade outline, extruded thin. */
function useBladeGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.045);
    s.lineTo(0.95, -0.006);
    s.quadraticCurveTo(1.0, 0, 0.95, 0.01);
    s.lineTo(0, 0.05);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
}

const REST = 0.12;
const SNIP_OPEN = 0.42;
const SNIP_TIME = 0.3; // one open-close

/** Tailor's shears. Click: two snips and a little fabric scrap drops. */
export function Scissors(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const blade = useBladeGeometry();
  const trigger = useTrigger();
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const scrap = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = trigger.since(state);
    const snipping = t < SNIP_TIME * 2;
    const open = snipping ? Math.sin((t / SNIP_TIME) * Math.PI) ** 2 * SNIP_OPEN : 0;
    if (a.current) a.current.rotation.y = REST + open;
    if (b.current) b.current.rotation.y = -REST - open;
    const s = scrap.current;
    if (s) {
      s.visible = Number.isFinite(t);
      const f = smooth((t - 0.35) / 0.6);
      s.position.set(0.95 + f * 0.25, 0.32 - f * 0.31, f * 0.18);
      s.rotation.set(-Math.PI / 2 + (1 - f) * 0.9, 0, f * 1.4);
    }
  });

  const half = (ref: React.RefObject<THREE.Group | null>, angle: number, upper: boolean) => (
    <group ref={ref} rotation-y={angle}>
      <mesh geometry={blade} position-y={upper ? 0.03 : 0.015} castShadow material={m.steel} />
      <mesh position={[-0.33, 0.025, 0]} rotation-x={-Math.PI / 2} castShadow>
        <torusGeometry args={[0.17, 0.035, 8, 24]} />
        <meshStandardMaterial color={COLORS.ink} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 0.025, 0]} rotation-z={Math.PI / 2} material={m.ink}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
      </mesh>
    </group>
  );

  return (
    <Interactive
      name="scissors"
      label="Tailor's shears"
      hint="Click to snip"
      section="Product Design"
      sound="snip"
      labelOffset={[0.2, 0.6, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      {/* Generous invisible click area — the blades themselves are very thin */}
      <mesh position={[0.25, 0.06, 0]}>
        <boxGeometry args={[1.45, 0.14, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {half(a, REST, true)}
      {half(b, -REST, false)}
      <mesh position-y={0.045} material={m.brass}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
      </mesh>
      {/* Snipped fabric scrap */}
      <mesh ref={scrap} visible={false} castShadow>
        <planeGeometry args={[0.22, 0.16]} />
        <meshStandardMaterial color={COLORS.haldi} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </Interactive>
  );
}
