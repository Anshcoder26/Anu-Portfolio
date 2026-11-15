"use client";

import * as THREE from "three";
import { useMemo } from "react";
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

/** Tailor's shears lying slightly open. */
export function Scissors(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const blade = useBladeGeometry();

  const half = (angle: number, flip: number) => (
    <group rotation-y={angle}>
      <mesh geometry={blade} position-y={flip > 0 ? 0.03 : 0.015} castShadow material={m.steel} />
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
    <group {...props}>
      {half(0.12, 1)}
      {half(-0.12, -1)}
      <mesh position-y={0.045} material={m.brass}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
      </mesh>
    </group>
  );
}
