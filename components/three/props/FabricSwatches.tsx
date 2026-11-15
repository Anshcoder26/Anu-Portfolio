"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDesk } from "../desk/DeskContext";
import { Interactive } from "../desk/Interactive";
import { useTrigger } from "../desk/useTrigger";
import { COLORS } from "../materials";

// Echo the portfolio: batik teal, haldi, sindoor, indigo weave, cream calico.
const START = [COLORS.cream, COLORS.indigo, COLORS.haldi, COLORS.sindoor, COLORS.teal];
const ROT = [0.1, -0.15, 0.32, -0.4, 0.05];
const OFF: [number, number][] = [[0, 0], [0.08, 0.06], [-0.06, 0.1], [0.1, -0.05], [-0.02, 0.02]];
const FLIGHT = 0.9;

/**
 * A loose stack of fabric swatches. Click: the top piece lifts, flutters and
 * is tucked under the stack. The top piece takes the palette's dye colour.
 */
export function FabricSwatches(props: React.JSX.IntrinsicElements["group"]) {
  const { dye } = useDesk();
  const [order, setOrder] = useState(START);
  const flyer = useRef<THREE.Group>(null);
  const trigger = useTrigger();
  const busy = useRef(false);

  useFrame((state) => {
    const g = flyer.current;
    if (!g) return;
    const t = trigger.since(state);
    if (t < FLIGHT) {
      const p = t / FLIGHT;
      g.position.set(Math.sin(p * Math.PI) * 0.5, Math.sin(p * Math.PI) * 0.7, Math.sin(p * Math.PI) * 0.15);
      g.rotation.set(Math.sin(p * Math.PI * 4) * 0.35, p * Math.PI * 1.5, Math.sin(p * Math.PI * 3) * 0.3);
    } else {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    }
  });

  const top = order.length - 1;

  return (
    <Interactive
      name="swatches"
      label="Fabric swatches"
      hint="Click to shuffle — dye them with the palette"
      section="Batik"
      sound="swoosh"
      labelOffset={[0, 0.8, 0]}
      onActivate={() => {
        if (busy.current) return;
        busy.current = true;
        trigger.fire();
        window.setTimeout(() => {
          setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
          busy.current = false;
        }, FLIGHT * 1000);
      }}
      {...props}
    >
      {order.map((color, i) => {
        const swatch = (
          <mesh
            position={[OFF[i][0], 0.012 + i * 0.014, OFF[i][1]]}
            rotation-y={ROT[i]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1.1, 0.012, 1.1]} />
            <meshStandardMaterial color={i === top && dye ? dye : color} roughness={0.95} />
          </mesh>
        );
        return i === top ? (
          <group key={`top-${color}`} ref={flyer}>
            {swatch}
            {/* Leaf motif on the top (batik) swatch */}
            {[-0.25, 0.05, 0.3].map((x, j) => (
              <mesh
                key={j}
                position={[x, 0.012 + order.length * 0.014, (j - 1) * 0.2]}
                rotation={[-Math.PI / 2, 0, 0.6 + j]}
                scale={[1, 0.45, 1]}
              >
                <circleGeometry args={[0.14, 16]} />
                <meshStandardMaterial color="#F4EBD0" roughness={0.95} transparent opacity={0.85} />
              </mesh>
            ))}
          </group>
        ) : (
          <group key={`${i}-${color}`}>{swatch}</group>
        );
      })}
    </Interactive>
  );
}
