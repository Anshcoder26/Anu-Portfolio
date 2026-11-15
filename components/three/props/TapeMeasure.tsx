"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../materials";

/** Draws the tape's tick marks/numbers once to a canvas. */
function useTapeTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = COLORS.haldi;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.ink;
    ctx.font = "bold 22px sans-serif";
    for (let i = 0; i <= 160; i++) {
      const x = i * 12.8;
      const major = i % 10 === 0;
      ctx.fillRect(x, 0, 2, major ? 30 : i % 5 === 0 ? 20 : 12);
      if (major && i > 0) ctx.fillText(String(i / 10 + 20), x + 4, 56);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/** A tailor's measuring tape snaking across the desk (flat ribbon along a curve). */
export function TapeMeasure(props: React.JSX.IntrinsicElements["group"]) {
  const map = useTapeTexture();

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0, 0.2),
      new THREE.Vector3(-1.2, 0, -0.25),
      new THREE.Vector3(0, 0, 0.15),
      new THREE.Vector3(1.0, 0, -0.1),
      new THREE.Vector3(1.8, 0.0, 0.35),
      new THREE.Vector3(2.4, 0, 0.05),
    ]);
    const segments = 120;
    const width = 0.12;
    const pts = curve.getSpacedPoints(segments);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3();

    pts.forEach((p, i) => {
      const t = curve.getTangentAt(i / segments);
      side.crossVectors(up, t).normalize().multiplyScalar(width / 2);
      positions.push(p.x - side.x, p.y + 0.004, p.z - side.z, p.x + side.x, p.y + 0.004, p.z + side.z);
      uvs.push(i / segments, 1, i / segments, 0);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group {...props}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={map} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Metal end tab */}
      <mesh position={[2.42, 0.01, 0.05]} rotation-y={0.3}>
        <boxGeometry args={[0.06, 0.02, 0.14]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
