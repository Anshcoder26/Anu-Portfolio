"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { useTrigger, wobble } from "../desk/useTrigger";
import { COLORS, getMaterials } from "../materials";
import { paintChips, paintCork, paintIdCard, paintIkat, paintJamdani, sharedTexture } from "../textures";
import { Pin } from "./Pin";

const BW = 2.6;
const BH = 1.3;
const FRAME = 0.06;

/** Polaroids of her work: thumbnail file, page index it opens, placement. */
const POLAROIDS = [
  { file: "13", page: 12, label: "Weaving", x: -0.68, y: 0.06, rot: 0.06, pin: COLORS.teal },
  { file: "18", page: 17, label: "Panchkatha jewellery", x: -0.08, y: -0.04, rot: -0.05, pin: COLORS.haldi },
  { file: "06", page: 5, label: "Batik table linen", x: 0.52, y: 0.1, rot: 0.08, pin: COLORS.sindoor },
];
const PW = 0.5; // polaroid width
const PH = 0.46;

function Polaroid({ map, ...p }: (typeof POLAROIDS)[number] & { map: THREE.Texture }) {
  const m = getMaterials();
  return (
    <Interactive
      name={`polaroid-${p.file}`}
      label={p.label}
      hint="From the portfolio"
      page={p.page}
      sound="paper"
      lift={0}
      labelOffset={[0, 0.45, 0.1]}
      position={[p.x, p.y, 0.02]}
      rotation-z={p.rot}
    >
      <mesh castShadow material={m.paper}>
        <boxGeometry args={[PW, PH, 0.008]} />
      </mesh>
      <mesh position={[0, 0.05, 0.005]}>
        <planeGeometry args={[PW - 0.06, (PW - 0.06) * 0.6]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
      <Pin color={p.pin} position={[0, PH / 2 - 0.04, 0]} scale={0.8} />
    </Interactive>
  );
}

/** Student ID card on a lanyard, hanging off the board's corner. Click: it swings. */
function IdCard() {
  const map = sharedTexture("idcard", 300, 420, paintIdCard, { fonts: true });
  const trigger = useTrigger();
  const swing = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!swing.current) return;
    swing.current.rotation.z = 0.05 + Math.sin(state.clock.elapsedTime * 1.1) * 0.01 + wobble(trigger.since(state), 0.28, 1.1, 1.2);
  });
  return (
    <Interactive
      name="idcard"
      label="Student ID"
      hint="Anusmita Nath · NIFT Bangalore"
      sound="click"
      lift={0}
      labelOffset={[0, 0.2, 0.15]}
      position={[BW / 2 + 0.22, 0.5, 0.03]}
      onActivate={trigger.fire}
    >
      <Pin color={COLORS.indigo} scale={0.8} />
      <group ref={swing}>
        {/* Lanyard */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.06, -0.2, 0.03]} rotation-z={s * 0.15}>
            <boxGeometry args={[0.035, 0.42, 0.004]} />
            <meshStandardMaterial color={COLORS.sindoor} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.6, 0.035]} castShadow>
          <boxGeometry args={[0.3, 0.42, 0.006]} />
          <meshStandardMaterial map={map} roughness={0.5} />
        </mesh>
      </group>
    </Interactive>
  );
}

/** Cork mood board: polaroids of her work, textile swatches, colour chips, ID card. */
export function MoodBoard(props: React.JSX.IntrinsicElements["group"]) {
  const m = getMaterials();
  const thumbs = useTexture(POLAROIDS.map((p) => `/slides/thumbs/${p.file}.webp`));
  thumbs.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));

  return (
    <group {...props}>
      {/* Frame + cork */}
      <mesh position-z={0.02} castShadow receiveShadow material={m.wood}>
        <boxGeometry args={[BW + FRAME * 2, BH + FRAME * 2, 0.04]} />
      </mesh>
      <mesh position-z={0.041} receiveShadow>
        <planeGeometry args={[BW, BH]} />
        <meshStandardMaterial map={sharedTexture("cork", 512, 256, paintCork)} roughness={1} />
      </mesh>

      <group position-z={0.045}>
        {/* Colour chip card */}
        <group position={[-1.12, -0.02, 0.01]} rotation-z={-0.04}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.92, 0.005]} />
            <meshStandardMaterial map={sharedTexture("chips", 120, 500, paintChips, { fonts: true })} roughness={0.6} />
          </mesh>
          <Pin color={COLORS.haldi} position={[0, 0.42, 0]} scale={0.7} />
        </group>

        {POLAROIDS.map((p, i) => (
          <Polaroid key={p.file} {...p} map={thumbs[i]} />
        ))}

        {/* Textile swatches */}
        <group position={[1.05, 0.25, 0.012]} rotation-z={-0.1}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.36, 0.004]} />
            <meshStandardMaterial map={sharedTexture("ikat", 256, 256, paintIkat)} roughness={0.95} />
          </mesh>
          <Pin color={COLORS.indigo} position={[0, 0.14, 0]} scale={0.7} />
        </group>
        <group position={[1.0, -0.28, 0.012]} rotation-z={0.12}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.32, 0.004]} />
            <meshStandardMaterial map={sharedTexture("jamdani", 256, 256, paintJamdani)} roughness={0.95} />
          </mesh>
          <Pin color={COLORS.sindoor} position={[0, 0.12, 0]} scale={0.7} />
        </group>
      </group>

      <IdCard />
    </group>
  );
}
