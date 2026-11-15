"use client";

import { COLORS } from "../materials";

/** Push pin stuck into the wall/board, head facing the viewer (+z). */
export function Pin({ color = COLORS.sindoor, ...props }: React.JSX.IntrinsicElements["group"] & { color?: string }) {
  return (
    <group {...props}>
      <mesh rotation-x={Math.PI / 2} position-z={0.02}>
        <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position-z={0.05} castShadow>
        <sphereGeometry args={[0.04, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  );
}
