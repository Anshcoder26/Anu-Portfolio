"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "../desk/Interactive";
import { smooth, useTrigger } from "../desk/useTrigger";
import { COLORS } from "../materials";
import { sharedTexture } from "../textures";

const SEGMENTS = 120;

function paintTape(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.haldi;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = COLORS.ink;
  ctx.font = "bold 22px sans-serif";
  for (let i = 0; i <= 160; i++) {
    const x = i * 12.8;
    const major = i % 10 === 0;
    ctx.fillRect(x, 0, 2, major ? 30 : i % 5 === 0 ? 20 : 12);
    if (major && i > 0) ctx.fillText(String(i / 10 + 20), x + 4, 56);
  }
}

/**
 * A tailor's measuring tape snaking across the desk. Click: it zips back
 * towards its start, then springs out again.
 */
export function TapeMeasure(props: React.JSX.IntrinsicElements["group"]) {
  const map = sharedTexture("tape", 2048, 64, paintTape);
  const trigger = useTrigger();
  const tab = useRef<THREE.Mesh>(null);

  const { geometry, curve } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0, 0.2),
      new THREE.Vector3(-1.2, 0, -0.25),
      new THREE.Vector3(0, 0, 0.15),
      new THREE.Vector3(1.0, 0, -0.1),
      new THREE.Vector3(1.8, 0.0, 0.35),
      new THREE.Vector3(2.4, 0, 0.05),
    ]);
    const width = 0.12;
    const pts = curve.getSpacedPoints(SEGMENTS);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3();
    pts.forEach((p, i) => {
      const t = curve.getTangentAt(i / SEGMENTS);
      side.crossVectors(up, t).normalize().multiplyScalar(width / 2);
      positions.push(p.x - side.x, p.y + 0.004, p.z - side.z, p.x + side.x, p.y + 0.004, p.z + side.z);
      uvs.push(i / SEGMENTS, 1, i / SEGMENTS, 0);
      if (i < SEGMENTS) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return { geometry: g, curve };
  }, []);

  useFrame((state) => {
    const t = trigger.since(state);
    // length fraction: retract (0.45s) → hold (0.35s) → spring out (0.6s, with a little overshoot feel)
    let f = 1;
    if (t < 0.45) f = 1 - 0.82 * smooth(t / 0.45);
    else if (t < 0.8) f = 0.18;
    else if (t < 1.4) f = 0.18 + 0.82 * smooth((t - 0.8) / 0.6);
    const segs = Math.max(1, Math.round(SEGMENTS * f));
    geometry.setDrawRange(0, segs * 6);
    if (tab.current) {
      const end = curve.getPointAt(segs / SEGMENTS);
      tab.current.position.set(end.x, 0.01, end.z);
    }
  });

  return (
    <Interactive
      name="tape"
      label="Measuring tape"
      hint="Click to reel it in"
      sound="swoosh"
      lift={0.03}
      labelOffset={[0, 0.5, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      {/* Invisible click strip along the tape (the ribbon is paper-thin) */}
      <mesh position={[0.1, 0.05, 0.05]}>
        <boxGeometry args={[4.8, 0.1, 0.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={map} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={tab} position={[2.42, 0.01, 0.05]} rotation-y={0.3}>
        <boxGeometry args={[0.06, 0.02, 0.14]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.3} />
      </mesh>
    </Interactive>
  );
}
