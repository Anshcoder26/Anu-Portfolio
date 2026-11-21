"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { onayakhi } from "@/data/onayakhi";
import { productPhoto, products, type ProductId } from "@/data/store";
import type { Cue } from "@/lib/sound";
import { Interactive } from "../desk/Interactive";
import type { Vec3 } from "../desk/useResponsive";
import { smooth, useTrigger, wobble } from "../desk/useTrigger";
import { getMaterials } from "../materials";
import { BAG_HEIGHT, BagBody } from "../props/OnayakhiBag";
import { MugBody } from "../props/OnayakhiMug";
import { sharedTexture } from "../textures";
import { FACADE_Z } from "./Street";
import {
  drawWordmark,
  paintFloor,
  paintFrieze,
  paintHappyNote,
  paintPoster,
  paintTapestry,
  paintWeave,
} from "./storeTextures";

/** Shop interior box (behind the facade). */
export const SHOP = {
  x0: -5,
  x1: 5,
  z0: -11,
  z1: FACADE_Z - 0.3,
  h: 4,
} as const;

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Lets a clicked product ask the camera to come closer. */
const FocusContext = createContext<(p: Vec3) => void>(() => {});

// ── product art: real photo when provided, painted stand-in otherwise ───────

type ArtProps = {
  id: ProductId;
  paint: Painter;
  size: [number, number];
  attach?: string;
  roughness?: number;
  side?: THREE.Side;
  /** Multiplies the artwork (below white = darker) — tames bright pastel photos under the lamps. */
  color?: string;
};

function PhotoMaterial({
  id,
  attach,
  roughness = 0.8,
  side,
  color,
}: Omit<ArtProps, "paint" | "size">) {
  const map = useTexture(productPhoto(id), (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  return (
    <meshStandardMaterial
      attach={attach}
      map={map}
      roughness={roughness}
      side={side}
      color={color}
    />
  );
}

function ArtMaterial({
  id,
  paint,
  size,
  attach,
  roughness = 0.8,
  side,
  color,
}: ArtProps) {
  if (products[id].photo)
    return (
      <PhotoMaterial
        id={id}
        attach={attach}
        roughness={roughness}
        side={side}
        color={color}
      />
    );
  const map = sharedTexture(`product-${id}`, size[0], size[1], paint, {
    fonts: true,
  });
  return (
    <meshStandardMaterial
      attach={attach}
      map={map}
      roughness={roughness}
      side={side}
    />
  );
}

// ── one clickable product ───────────────────────────────────────────────────

const tmpBox = new THREE.Box3();
const tmpV = new THREE.Vector3();

/**
 * A product on display: hover lift, click → its animation + sound, the camera
 * leans in, and a kraft label with a link to @0nayakhi on Instagram.
 */
function StoreItem({
  id,
  name,
  sound = "pop",
  onActivate,
  labelOffset = [0, 0.7, 0],
  lift = 0.04,
  children,
  ...group
}: Omit<React.JSX.IntrinsicElements["group"], "children" | "id" | "name"> & {
  id: ProductId;
  /** Unique key when one product is shown several times. */
  name?: string;
  sound?: Cue;
  onActivate?: () => void;
  labelOffset?: [number, number, number];
  lift?: number;
  children: ReactNode;
}) {
  const p = products[id];
  const focus = useContext(FocusContext);
  const anchor = useRef<THREE.Group>(null);
  return (
    <Interactive
      name={name ?? `store-${id}`}
      label={p.name}
      hint={`“${p.caption}”`}
      href={onayakhi.instagram}
      hrefLabel="See it on @0nayakhi ↗"
      sound={sound}
      lift={lift}
      labelOffset={labelOffset}
      onActivate={() => {
        onActivate?.();
        if (anchor.current)
          focus(tmpBox.setFromObject(anchor.current).getCenter(tmpV).toArray());
      }}
      {...group}
    >
      <group ref={anchor}>{children}</group>
    </Interactive>
  );
}

// ── room ────────────────────────────────────────────────────────────────────

function repeat(t: THREE.Texture, x: number, y: number) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(x, y);
  c.needsUpdate = true;
  return c;
}

function Shell({ night }: { night: boolean }) {
  const floor = useMemo(
    () => repeat(sharedTexture("store-floor", 512, 512, paintFloor), 5, 3),
    [],
  );
  const frieze = sharedTexture("store-frieze", 1024, 128, paintFrieze);
  const friezeLong = useMemo(() => repeat(frieze, 5, 1), [frieze]);
  const friezeShort = useMemo(() => repeat(frieze, 2.5, 1), [frieze]);
  const { x0, x1, z0, z1, h } = SHOP;
  const W = x1 - x0;
  const D = z1 - z0;
  const wall = "#F4E9D6";

  return (
    <group>
      <mesh
        position={[0, 0.001, (z0 + z1) / 2]}
        rotation-x={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.75} />
      </mesh>
      <mesh position={[0, h, (z0 + z1) / 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#efe3cc" roughness={1} />
      </mesh>
      {/* Back, left and right walls (facing in) */}
      <mesh position={[0, h / 2, z0]} receiveShadow>
        <planeGeometry args={[W, h]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh
        position={[x0, h / 2, (z0 + z1) / 2]}
        rotation-y={Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[D, h]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh
        position={[x1, h / 2, (z0 + z1) / 2]}
        rotation-y={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[D, h]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      {/* Alpona frieze along the bottom of each wall */}
      <mesh position={[0, 0.3, z0 + 0.01]}>
        <planeGeometry args={[W, 0.6]} />
        <meshStandardMaterial map={friezeLong} roughness={0.9} />
      </mesh>
      {[x0 + 0.01, x1 - 0.01].map((x, i) => (
        <mesh
          key={x}
          position={[x, 0.3, (z0 + z1) / 2]}
          rotation-y={i ? -Math.PI / 2 : Math.PI / 2}
        >
          <planeGeometry args={[D, 0.6]} />
          <meshStandardMaterial map={friezeShort} roughness={0.9} />
        </mesh>
      ))}
      {/* Wooden ceiling beams */}
      {[-7.5, -4.5].map((z) => (
        <mesh key={z} position={[0, h - 0.1, z]} material={getMaterials().wood}>
          <boxGeometry args={[W, 0.2, 0.22]} />
        </mesh>
      ))}
      {/* Pendant lamps: woven-cane shades with warm bulbs */}
      {[
        [-2.6, -5.2],
        [0, -6.8],
        [2.6, -5.2],
        [-2.8, -9],
        [2.8, -9],
      ].map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, h, z]}>
          <mesh position-y={-0.4}>
            <cylinderGeometry args={[0.006, 0.006, 0.8, 4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position-y={-0.9}>
            <sphereGeometry
              args={[0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]}
            />
            <meshStandardMaterial
              color="#C99A5B"
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position-y={-0.95}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshStandardMaterial
              color="#fff3d6"
              emissive="#ffcf86"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position-y={-1.05}
            intensity={night ? 7 : 4.5}
            distance={7}
            decay={1.5}
            color="#ffd9a0"
          />
        </group>
      ))}
    </group>
  );
}

// ── stop 0: the brand wall ──────────────────────────────────────────────────

function BrandWall() {
  const trigger = useTrigger();
  const frame = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (frame.current)
      frame.current.rotation.z = wobble(trigger.since(state), 0.05, 1.4, 0.8);
  });
  // The logo artwork is square.
  const W = 2.0;
  const H = W;
  return (
    <group position={[0, 2.05, SHOP.z0 + 0.03]}>
      <StoreItem
        id="poster"
        sound="paper"
        lift={0}
        labelOffset={[0, -H / 2 - 0.25, 0.2]}
        onActivate={trigger.fire}
      >
        {/* Hangs from its top edge */}
        <group position-y={H / 2} ref={frame}>
          <mesh position={[0, -H / 2, 0.03]} castShadow>
            <boxGeometry args={[W + 0.12, H + 0.12, 0.05]} />
            <meshStandardMaterial color="#6B3A1E" roughness={0.6} />
          </mesh>
          <mesh position={[0, -H / 2, 0.06]}>
            <planeGeometry args={[W, H]} />
            <ArtMaterial
              id="poster"
              paint={paintPoster}
              size={[640, 640]}
              roughness={0.9}
            />
          </mesh>
        </group>
      </StoreItem>
      {/* Brass lanterns either side */}
      {[-1.7, 1.7].map((x) => (
        <group key={x} position={[x, 0.2, 0.25]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.18, 0.4, 8]} />
            <meshStandardMaterial
              color="#C9A04A"
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>
          <mesh position-y={0.02}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial
              color="#fff3d6"
              emissive="#ffb54a"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── stop 1: mug shelf (left wall) ───────────────────────────────────────────

function Mug({
  index,
  position,
  full,
}: {
  index: number;
  position: Vec3;
  full: boolean;
}) {
  const trigger = useTrigger();
  const lifted = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!lifted.current) return;
    const t = trigger.since(state);
    // Picked up a little, turned to show the print, set back down.
    const up = t < 1.6 ? Math.sin(smooth(t / 1.6) * Math.PI) : 0;
    lifted.current.position.y = up * 0.12;
    lifted.current.rotation.y = up * 0.6;
  });
  return (
    <StoreItem
      id="mug"
      name={`store-mug-${index}`}
      sound={full ? "slurp" : "knock"}
      position={position}
      rotation-y={Math.PI / 2}
      labelOffset={[0, 0.85, 0]}
      onActivate={trigger.fire}
    >
      <group ref={lifted}>
        <MugBody trigger={trigger} coffee={full} />
      </group>
    </StoreItem>
  );
}

function MugShelf() {
  const m = getMaterials();
  const x = SHOP.x0;
  const shelves = [1.15, 1.85];
  return (
    <group>
      {shelves.map((y) => (
        <group key={y}>
          <mesh
            position={[x + 0.24, y - 0.04, -6]}
            castShadow
            receiveShadow
            material={m.lightWood}
          >
            <boxGeometry args={[0.48, 0.08, 2.6]} />
          </mesh>
          {[-1.1, 1.1].map((z) => (
            <mesh
              key={z}
              position={[x + 0.2, y - 0.18, -6 + z]}
              material={m.brass}
            >
              <boxGeometry args={[0.32, 0.2, 0.03]} />
            </mesh>
          ))}
        </group>
      ))}
      <Mug index={0} position={[x + 0.26, shelves[0], -6.8]} full={false} />
      <Mug index={1} position={[x + 0.26, shelves[0], -6]} full />
      <Mug index={2} position={[x + 0.26, shelves[0], -5.2]} full={false} />
      <Mug index={3} position={[x + 0.26, shelves[1], -6.45]} full={false} />
      <Mug index={4} position={[x + 0.26, shelves[1], -5.55]} full={false} />
      {/* Price tag card */}
      <mesh position={[x + 0.02, 2.58, -6]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.75, 0.35]} />
        <meshStandardMaterial
          map={sharedTexture(
            "store-mug-label",
            640,
            128,
            (ctx, w, h) => {
              ctx.fillStyle = "#F7F0E6";
              ctx.fillRect(0, 0, w, h);
              ctx.strokeStyle = "#7A1C22";
              ctx.lineWidth = 6;
              ctx.strokeRect(5, 5, w - 10, h - 10);
              drawWordmark(ctx, w / 2, h / 2, h * 0.36);
            },
            { fonts: true },
          )}
        />
      </mesh>
    </group>
  );
}

// ── stop 2: wall textiles (right wall) ──────────────────────────────────────

/** One material for every fairy-light bulb, so they twinkle together. */
const bulbGlow = new THREE.MeshStandardMaterial({
  color: "#fff1c8",
  emissive: "#ffbe5c",
  emissiveIntensity: 2.6,
  toneMapped: false,
});

/** Warm fairy lights framing the tapestry, as in Anu's photo. They twinkle softly. */
function FairyLights({ w, h }: { w: number; h: number }) {
  useFrame((state) => {
    bulbGlow.emissiveIntensity =
      2.6 + Math.sin(state.clock.elapsedTime * 2.2) * 0.5;
  });
  const bulbs = useMemo(() => {
    const pts: [number, number][] = [];
    const step = 0.17;
    // Down the left, along the bottom, up the right, across the top (with a little droop).
    for (let y = 0; y > -h; y -= step) pts.push([-w / 2, y]);
    for (let x = -w / 2; x < w / 2; x += step)
      pts.push([x, -h - Math.sin(((x + w / 2) / w) * Math.PI) * 0.06]);
    for (let y = -h; y < 0; y += step) pts.push([w / 2, y]);
    for (let x = w / 2; x > -w / 2; x -= step)
      pts.push([x, -0.04 - Math.sin(((x + w / 2) / w) * Math.PI) * 0.07]);
    return pts;
  }, [w, h]);
  return (
    <group position-z={0.04}>
      {bulbs.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} material={bulbGlow}>
          <sphereGeometry args={[0.024, 8, 6]} />
        </mesh>
      ))}
      <pointLight
        position={[0, -h / 2, 0.6]}
        intensity={2.2}
        distance={3.5}
        decay={1.6}
        color="#ffc070"
      />
    </group>
  );
}

function Tapestry() {
  const trigger = useTrigger();
  const cloth = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!cloth.current) return;
    const idle = Math.sin(state.clock.elapsedTime * 0.8) * 0.01;
    cloth.current.rotation.x =
      idle + wobble(trigger.since(state), 0.12, 1.1, 1.1);
  });
  // Anu's dancer tapestry (photo crop 640×1018).
  const H = 2.45;
  const W = H * (640 / 1018);
  const x = SHOP.x1;
  return (
    <group position={[x - 0.12, 3.35, -5]} rotation-y={-Math.PI / 2}>
      {/* Bamboo rod */}
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, W + 0.3, 10]} />
        <meshStandardMaterial color="#C9A66B" roughness={0.6} />
      </mesh>
      <StoreItem
        id="tapestry"
        sound="swoosh"
        lift={0}
        labelOffset={[0, -H - 0.2, 0.3]}
        onActivate={trigger.fire}
      >
        <group ref={cloth}>
          <mesh position-y={-H / 2} castShadow>
            <planeGeometry args={[W, H]} />
            <ArtMaterial
              id="tapestry"
              paint={paintTapestry}
              size={[512, 640]}
              roughness={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </StoreItem>
      <FairyLights w={W + 0.16} h={H + 0.06} />
      {/* Folded textiles on a low bench beside it */}
      <group position={[-2.05, -2.9, 0.4]} scale={0.75}>
        <mesh
          position-y={0.2}
          castShadow
          receiveShadow
          material={getMaterials().wood}
        >
          <boxGeometry args={[2.2, 0.08, 0.5]} />
        </mesh>
        {[-0.7, 0, 0.7].map((bx, i) => (
          <group key={bx} position={[bx, 0.24, 0]}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position-y={0.05 + k * 0.09} castShadow>
                <boxGeometry args={[0.55, 0.08, 0.38]} />
                <meshStandardMaterial
                  color={
                    [
                      "#A6232A",
                      "#E3B23C",
                      "#1F5C5A",
                      "#2D3E7A",
                      "#D9677A",
                      "#F6EBD3",
                      "#7A8B3A",
                      "#7A1C22",
                      "#E3B23C",
                    ][i * 3 + k]
                  }
                  roughness={0.95}
                />
              </mesh>
            ))}
          </group>
        ))}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 1, 0.08, 0]}
            material={getMaterials().wood}
          >
            <boxGeometry args={[0.08, 0.2, 0.45]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── stop 3: Echoes of Memory, macramé and the flower necklace ─────────────

/** A product photo from public/store/<file>.webp as a material. */
function PhotoMat({
  file,
  attach,
  roughness = 0.8,
  side,
  color,
}: {
  file: string;
  attach?: string;
  roughness?: number;
  side?: THREE.Side;
  color?: string;
}) {
  const map = useTexture(`/store/${file}.webp`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  return (
    <meshStandardMaterial
      attach={attach}
      map={map}
      roughness={roughness}
      side={side}
      color={color}
    />
  );
}

/** A thin slab with a photo on its top (+y) face — sleeves, cases, cards lying flat. */
function FlatPiece({
  file,
  size,
  edge,
  roughness = 0.6,
}: {
  file: string;
  size: [number, number, number];
  edge: string;
  roughness?: number;
}) {
  return (
    <mesh position-y={size[1] / 2} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        attach="material-0"
        color={edge}
        roughness={roughness}
      />
      <meshStandardMaterial
        attach="material-1"
        color={edge}
        roughness={roughness}
      />
      <PhotoMat attach="material-2" file={file} roughness={roughness} />
      <meshStandardMaterial
        attach="material-3"
        color={edge}
        roughness={roughness}
      />
      <meshStandardMaterial
        attach="material-4"
        color={edge}
        roughness={roughness}
      />
      <meshStandardMaterial
        attach="material-5"
        color={edge}
        roughness={roughness}
      />
    </mesh>
  );
}

/** White ceramic mug with the floral-splatter print wrapped round the front. */
function EchoesMug() {
  const R = 0.13;
  const H = 0.3;
  return (
    <group>
      <mesh position-y={H / 2} castShadow>
        <cylinderGeometry args={[R, R, H, 32, 1, true]} />
        <meshStandardMaterial
          color="#f4f1ec"
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position-y={H / 2}>
        <cylinderGeometry
          args={[R + 0.001, R + 0.001, H * 0.94, 32, 1, true, -1.1, 2.2]}
        />
        <PhotoMat file="mugwhite" roughness={0.3} />
      </mesh>
      <mesh position-y={0.01}>
        <cylinderGeometry args={[R, R, 0.02, 32]} />
        <meshStandardMaterial color="#f4f1ec" />
      </mesh>
      <mesh position={[-R - 0.045, H / 2, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.018, 10, 20, Math.PI]} />
        <meshStandardMaterial color="#f4f1ec" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Canvas tote: printed front, cotton back and sides, two strap handles. */
function Tote() {
  const W = 0.42;
  const H = W * (460 / 400);
  const D = 0.04;
  const strap = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.09, 0, 0),
      new THREE.Vector3(-0.08, 0.17, 0),
      new THREE.Vector3(0, 0.23, 0),
      new THREE.Vector3(0.08, 0.17, 0),
      new THREE.Vector3(0.09, 0, 0),
    ]);
    return new THREE.TubeGeometry(c, 24, 0.012, 5, false);
  }, []);
  const canvas = "#d9cdb8";
  return (
    <group>
      <mesh position-y={H / 2} castShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial
          attach="material-0"
          color={canvas}
          roughness={0.95}
        />
        <meshStandardMaterial
          attach="material-1"
          color={canvas}
          roughness={0.95}
        />
        <meshStandardMaterial
          attach="material-2"
          color={canvas}
          roughness={0.95}
        />
        <meshStandardMaterial
          attach="material-3"
          color={canvas}
          roughness={0.95}
        />
        <PhotoMat attach="material-4" file="tote" roughness={0.95} />
        <meshStandardMaterial
          attach="material-5"
          color={canvas}
          roughness={0.95}
        />
      </mesh>
      <mesh geometry={strap} position={[0, H, 0]} castShadow>
        <meshStandardMaterial color={canvas} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Hard-cover journal standing up, elastic band printed on the cover. */
function Journal() {
  const W = 0.3;
  const H = W * (650 / 400);
  return (
    <mesh position-y={H / 2} castShadow>
      <boxGeometry args={[W, H, 0.045]} />
      <meshStandardMaterial
        attach="material-0"
        color="#efe9de"
        roughness={0.9}
      />
      <meshStandardMaterial
        attach="material-1"
        color="#3a2a22"
        roughness={0.7}
      />
      <meshStandardMaterial
        attach="material-2"
        color="#efe9de"
        roughness={0.9}
      />
      <meshStandardMaterial
        attach="material-3"
        color="#efe9de"
        roughness={0.9}
      />
      <PhotoMat attach="material-4" file="journal" roughness={0.7} />
      <meshStandardMaterial
        attach="material-5"
        color="#3a2a22"
        roughness={0.7}
      />
    </mesh>
  );
}

/** A small wooden easel holding a card upright at a lean. */
function Easel({ children, h }: { children: ReactNode; h: number }) {
  const m = getMaterials();
  return (
    <group>
      <group rotation-x={-0.28}>{children}</group>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.12, h * 0.42, -0.06]}
          rotation-x={-0.28}
          material={m.wood}
        >
          <boxGeometry args={[0.02, h * 0.95, 0.02]} />
        </mesh>
      ))}
      <mesh
        position={[0, h * 0.4, -h * 0.28]}
        rotation-x={0.45}
        material={m.wood}
      >
        <boxGeometry args={[0.02, h * 0.85, 0.02]} />
      </mesh>
      <mesh position={[0, 0.02, 0.02]} material={m.wood}>
        <boxGeometry args={[h * 0.9, 0.025, 0.05]} />
      </mesh>
    </group>
  );
}

/**
 * The display table: Anu's "Echoes of Memory" collection (rust, newsprint and
 * splattered florals on a tote, mug, journal, laptop sleeve and phone cases),
 * her macramé keychains on a velvet tray, and the flower necklace on an easel.
 */
/** A table product that lifts a touch and wobbles when clicked. */
function TableItem({
  children,
  ...item
}: Omit<React.ComponentProps<typeof StoreItem>, "onActivate">) {
  const trigger = useTrigger();
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const t = trigger.since(state);
    const up =
      Number.isFinite(t) && t < 1.4 ? Math.sin(smooth(t / 1.4) * Math.PI) : 0;
    g.current.position.y = up * 0.06;
    g.current.rotation.z = wobble(t, 0.05, 1.6, 0.5);
  });
  return (
    <StoreItem {...item} onActivate={trigger.fire}>
      <group ref={g}>{children}</group>
    </StoreItem>
  );
}

function EchoesTable() {
  const m = getMaterials();
  const top = 0.85;
  return (
    <group position={[0, 0, -6.8]}>
      {/* Table with a hand-block-printed runner */}
      <mesh
        position-y={top - 0.04}
        castShadow
        receiveShadow
        material={m.lightWood}
      >
        <boxGeometry args={[2.8, 0.08, 1.3]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * 1.3, (top - 0.08) / 2, sz * 0.55]}
            castShadow
            material={m.wood}
          >
            <boxGeometry args={[0.07, top - 0.08, 0.07]} />
          </mesh>
        )),
      )}
      <mesh
        position={[0, top + 0.002, 0]}
        rotation-x={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[2.2, 0.5]} />
        <meshStandardMaterial color="#efe6d6" roughness={1} />
      </mesh>

      <group position-y={top}>
        {/* Back row: tote, journal, necklace on its easel */}
        <TableItem
          id="tote"
          sound="paper"
          position={[-0.95, 0, -0.35]}
          rotation-y={0.25}
          labelOffset={[0, 0.85, 0]}
        >
          <Tote />
        </TableItem>
        <TableItem
          id="journal"
          sound="paper"
          position={[-0.38, 0, -0.42]}
          rotation-y={-0.1}
          labelOffset={[0, 0.8, 0]}
        >
          <Journal />
        </TableItem>
        <TableItem
          id="necklace"
          sound="chime"
          position={[0.75, 0, -0.32]}
          rotation-y={-0.2}
          labelOffset={[0, 0.75, 0]}
        >
          <Easel h={0.5}>
            <mesh position={[0, 0.27, 0.02]} castShadow>
              <planeGeometry args={[0.46, 0.46 * (634 / 640)]} />
              <PhotoMat file="necklace" roughness={0.5} />
            </mesh>
          </Easel>
        </TableItem>

        {/* Front row: laptop sleeve, phone cases, the mug, macramé tray */}
        <TableItem
          id="sleeve"
          sound="paper"
          lift={0.02}
          position={[-0.75, 0, 0.25]}
          rotation-y={0.12}
          labelOffset={[0, 0.6, 0]}
        >
          <FlatPiece file="sleeve" size={[0.62, 0.035, 0.42]} edge="#1b1410" />
        </TableItem>
        <TableItem
          id="phonecases"
          sound="pop"
          lift={0.02}
          position={[-0.12, 0, 0.3]}
          labelOffset={[0, 0.55, 0]}
        >
          <group position-x={-0.1} rotation-y={0.08}>
            <FlatPiece
              file="phone1"
              size={[0.15, 0.02, 0.29]}
              edge="#d8c7b4"
              roughness={0.4}
            />
          </group>
          <group position-x={0.1} rotation-y={-0.18}>
            <FlatPiece
              file="phone2"
              size={[0.15, 0.02, 0.29]}
              edge="#2a2a2a"
              roughness={0.4}
            />
          </group>
        </TableItem>
        <TableItem
          id="echoesmug"
          sound="knock"
          position={[0.22, 0, -0.05]}
          rotation-y={0.5}
          labelOffset={[0, 0.65, 0]}
        >
          <EchoesMug />
        </TableItem>
        <TableItem
          id="keychains"
          sound="pop"
          lift={0.02}
          position={[0.8, 0, 0.28]}
          rotation-y={-0.15}
          labelOffset={[0, 0.55, 0]}
        >
          {/* Black velvet tray, as in the photo */}
          <mesh position-y={0.015} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.03, 0.6]} />
            <meshStandardMaterial color="#141210" roughness={1} />
          </mesh>
          <mesh position-y={0.032} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.46, 0.46 * (676 / 560)]} />
            <PhotoMat file="keychains" roughness={0.95} />
          </mesh>
        </TableItem>
      </group>
    </group>
  );
}

// ── lounge: Echoes of Memory cushions ───────────────────────────────────────

/** Puffy cushion: two bulging faces pinched at the seams, the print on both. */
function useCushionGeometry(size: number, puff: number) {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 20, 20);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / size) * 2;
      const v = (pos.getY(i) / size) * 2;
      pos.setZ(i, puff * (1 - u * u) * (1 - v * v));
      // Corners pull in a little, like a stuffed cover.
      pos.setX(i, pos.getX(i) * (1 - 0.06 * v * v));
      pos.setY(i, pos.getY(i) * (1 - 0.06 * u * u));
    }
    g.computeVertexNormals();
    return g;
  }, [size, puff]);
}

function Cushion({
  index,
  size = 0.5,
  ...props
}: Omit<React.JSX.IntrinsicElements["group"], "id"> & {
  index: number;
  size?: number;
}) {
  const geo = useCushionGeometry(size, size * 0.18);
  const trigger = useTrigger();
  const squish = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!squish.current) return;
    const w = wobble(trigger.since(state), 0.12, 2.2, 0.35);
    squish.current.scale.set(1 + w * 0.5, 1 - w, 1 + w * 0.5);
  });
  return (
    <StoreItem
      id="cushion"
      name={`store-cushion-${index}`}
      sound="thud"
      lift={0.03}
      labelOffset={[0, size + 0.3, 0]}
      onActivate={trigger.fire}
      {...props}
    >
      <group ref={squish}>
        <mesh geometry={geo} castShadow>
          <PhotoMat file="cushion" roughness={0.95} />
        </mesh>
        <mesh geometry={geo} rotation-y={Math.PI} castShadow>
          <PhotoMat file="cushion" roughness={0.95} />
        </mesh>
      </group>
    </StoreItem>
  );
}

/** A low cane-and-teak bench along the back wall with cushions and a folded throw. */
function LoungeBench() {
  const m = getMaterials();
  const y = 0.45;
  return (
    <group position={[3.0, 0, SHOP.z0 + 0.45]}>
      <mesh position-y={y - 0.04} castShadow receiveShadow material={teak}>
        <boxGeometry args={[2.6, 0.08, 0.7]} />
      </mesh>
      {/* Cane seat */}
      <mesh position-y={y + 0.002} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.5, 0.62]} />
        <meshStandardMaterial color="#d8b77e" roughness={0.9} />
      </mesh>
      {[-1.2, 1.2].map((x) => (
        <mesh
          key={x}
          position={[x, (y - 0.08) / 2, 0]}
          castShadow
          material={teak}
        >
          <boxGeometry args={[0.08, y - 0.08, 0.62]} />
        </mesh>
      ))}
      {/* Cushions leaning on the wall */}
      <Cushion
        index={0}
        position={[-0.75, y + 0.26, -0.12]}
        rotation={[-0.25, 0.12, 0.05]}
        size={0.52}
      />
      <Cushion
        index={1}
        position={[-0.2, y + 0.24, -0.1]}
        rotation={[-0.3, -0.1, -0.06]}
        size={0.48}
      />
      {/* Folded gamchha-red throw */}
      <mesh position={[0.65, y + 0.06, 0.02]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.45]} />
        <meshStandardMaterial color="#9E2A2B" roughness={1} />
      </mesh>
      <mesh position={[0.65, y + 0.115, 0.02]}>
        <boxGeometry args={[0.61, 0.012, 0.455]} />
        <meshStandardMaterial color="#efe6d6" roughness={1} />
      </mesh>
      <group position={[1.05, y, -0.1]}>
        <mesh position-y={0.11} castShadow material={m.terracotta}>
          <cylinderGeometry args={[0.1, 0.08, 0.22, 12]} />
        </mesh>
        <mesh position-y={0.3} castShadow>
          <icosahedronGeometry args={[0.15, 1]} />
          <meshStandardMaterial color="#4f8a3a" flatShading />
        </mesh>
      </group>
    </group>
  );
}

// ── stop 4: woven deck chair ────────────────────────────────────────────────

/** A sling that sags between the chair's rails. */
function useSlingGeometry(w: number, len: number) {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(w, len, 1, 16);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = pos.getY(i) / len + 0.5; // 0 bottom … 1 top
      pos.setZ(i, -Math.sin(v * Math.PI) * 0.16);
    }
    g.computeVertexNormals();
    return g;
  }, [w, len]);
}

/** Oiled teak, like the chair in the product photos. */
const teak = new THREE.MeshStandardMaterial({
  color: "#9A6A3E",
  roughness: 0.55,
});

function DeckChair() {
  const m = {
    lightWood: teak,
    wood: getMaterials().wood,
    terracotta: getMaterials().terracotta,
  };
  const trigger = useTrigger();
  const chair = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (chair.current)
      chair.current.rotation.x = wobble(trigger.since(state), 0.06, 1.2, 0.9);
  });
  const W = 0.62;
  const LEN = 1.5;
  const sling = useSlingGeometry(W - 0.04, LEN);
  const slope = 0.95; // back rest angle from vertical
  return (
    <StoreItem
      id="deckchair"
      sound="swoosh"
      lift={0.02}
      position={[3.3, 0, -8.6]}
      rotation-y={-0.2}
      scale={1.15}
      labelOffset={[0, 1.6, 0]}
      onActivate={trigger.fire}
    >
      <group ref={chair}>
        {/* Main rails: from the front foot up and back to the top */}
        {[-1, 1].map((s) => (
          <group key={s} position={[(s * W) / 2, 0, 0.55]} rotation-x={-slope}>
            <mesh position-y={LEN / 2 + 0.1} castShadow material={m.lightWood}>
              <boxGeometry args={[0.05, LEN + 0.2, 0.05]} />
            </mesh>
          </group>
        ))}
        {/* Back legs */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[(s * (W + 0.08)) / 2, 0.42, -0.1]}
            rotation-x={0.5}
            castShadow
            material={m.lightWood}
          >
            <boxGeometry args={[0.045, 0.95, 0.045]} />
          </mesh>
        ))}
        {/* Cross bars */}
        {[
          [0.08, 0.6],
          [
            Math.cos(slope) * (LEN + 0.15),
            0.55 - Math.sin(slope) * (LEN + 0.15),
          ],
        ].map(([y, z], i) => (
          <mesh
            key={i}
            position={[0, y, z]}
            rotation-z={Math.PI / 2}
            material={m.lightWood}
          >
            <cylinderGeometry args={[0.025, 0.025, W + 0.1, 8]} />
          </mesh>
        ))}
        {/* An Echoes of Memory cushion propped in the sling */}
        <Cushion
          index={2}
          position={[0, 0.4, 0.12]}
          rotation-x={-0.7}
          size={0.42}
        />
        {/* Woven sling */}
        <group position={[0, 0.1, 0.55]} rotation-x={-slope}>
          <mesh geometry={sling} position-y={LEN / 2} castShadow>
            <ArtMaterial
              id="deckchair"
              paint={paintWeave}
              size={[512, 512]}
              roughness={1}
              side={THREE.DoubleSide}
              color="#c8c8c8"
            />
          </mesh>
        </group>
      </group>
      {/* Little side stool with a plant */}
      <group position={[0.75, 0, 0.3]}>
        <mesh position-y={0.25} castShadow material={m.wood}>
          <cylinderGeometry args={[0.2, 0.18, 0.5, 14]} />
        </mesh>
        <mesh position-y={0.62} castShadow material={m.terracotta}>
          <cylinderGeometry args={[0.11, 0.08, 0.22, 12]} />
        </mesh>
        <mesh position-y={0.85} castShadow>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshStandardMaterial color="#4f8a3a" flatShading />
        </mesh>
      </group>
    </StoreItem>
  );
}

// ── stop 5: counter with packaging ──────────────────────────────────────────

function Counter() {
  const m = getMaterials();
  const bags = [useTrigger(), useTrigger()];
  const frieze = sharedTexture("store-frieze", 1024, 128, paintFrieze);
  const note = sharedTexture("store-happy", 256, 256, paintHappyNote, {
    fonts: true,
  });
  const top = 1.0;
  return (
    <group position={[-3.2, 0, -9.3]} rotation-y={0.35}>
      {/* Counter body: maroon with the alpona frieze */}
      <mesh position-y={top / 2} castShadow receiveShadow>
        <boxGeometry args={[2.4, top, 0.8]} />
        <meshStandardMaterial color="#7A1C22" roughness={0.7} />
      </mesh>
      <mesh position={[0, top * 0.55, 0.401]}>
        <planeGeometry args={[2.4, 0.3]} />
        <meshStandardMaterial map={frieze} roughness={0.9} />
      </mesh>
      <mesh
        position-y={top + 0.03}
        castShadow
        receiveShadow
        material={m.lightWood}
      >
        <boxGeometry args={[2.55, 0.06, 0.9]} />
      </mesh>
      {/* Bags */}
      {bags.map((t, i) => (
        <StoreItem
          key={i}
          id="bag"
          name={`store-bag-${i}`}
          sound="paper"
          position={[-0.75 + i * 0.6, top + 0.06, -0.05]}
          rotation-y={i ? -0.25 : 0.15}
          scale={0.8}
          labelOffset={[0, BAG_HEIGHT + 0.6, 0]}
          onActivate={t.fire}
        >
          <BagBody trigger={t} />
        </StoreItem>
      ))}
      {/* Kraft gift boxes with the logo tag */}
      {[
        [0.55, 0.16, 0.32],
        [0.6, 0.12, 0.26],
      ].map(([x, h, s], i) => (
        <group
          key={i}
          position={[x, top + 0.06 + (i ? 0.16 : 0) + h / 2, 0.1]}
          rotation-y={i * 0.3}
        >
          <mesh castShadow>
            <boxGeometry args={[s, h, s]} />
            <meshStandardMaterial color="#C9A47A" roughness={0.9} />
          </mesh>
          <mesh position-y={0.002}>
            <boxGeometry args={[s + 0.004, h + 0.004, 0.03]} />
            <meshStandardMaterial color="#A6232A" />
          </mesh>
        </group>
      ))}
      {/* "Happy customers" note */}
      <mesh position={[0.95, top + 0.2, 0.2]} rotation={[-0.25, -0.3, 0]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshStandardMaterial
          map={note}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** The brand's tag, mounted on the back wall above the counter. */
function LogoPlate() {
  const logo = useTexture("/textures/onayakhi-tag.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <group position={[-3.4, 2.3, SHOP.z0 + 0.02]}>
      <mesh position-z={0.01}>
        <boxGeometry args={[0.86, 0.86 * (155 / 120) + 0.06, 0.03]} />
        <meshStandardMaterial color="#C9A04A" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position-z={0.03}>
        <planeGeometry args={[0.8, 0.8 * (155 / 120)]} />
        <meshStandardMaterial map={logo} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** The shop floor: room, lights and the six displays. */
export function Interior({
  night,
  onFocus,
}: {
  night: boolean;
  onFocus: (p: Vec3) => void;
}) {
  return (
    <FocusContext.Provider value={onFocus}>
      <Shell night={night} />
      <BrandWall />
      <MugShelf />
      <Tapestry />
      <EchoesTable />
      <DeckChair />
      <LoungeBench />
      <Counter />
      <LogoPlate />
    </FocusContext.Provider>
  );
}
