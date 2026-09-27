import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Bounds, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import {
  HEX_AXIAL_POSITIONS,
  NUMBER_PIPS,
  TERRAIN_DISTRIBUTION,
  assignNumbers,
  hexToWorld,
  normalizeTile,
  readTokenSeat,
  type TilePaint,
  type Terrain,
} from "./tiles";

// Tiles exported from Fusion (via USDZ → Blender → glTF), then compressed with
// gltf-transform: meshopt geometry, WebP textures, simplified to 0.1% error,
// parts kept separate (--join false) so normalizeTile can find each base plate,
// and materials kept (--palette false) so they can be recoloured by name.
const TILE_FILES: Record<Terrain, string> = {
  hills: "brick",
  forest: "wood",
  mountains: "ore",
  fields: "wheat",
  pasture: "sheep",
  desert: "desert",
};

const MODEL_DIR = "/models/catan";

// Filament colours from the printed board (see the photo at the top of the
// page): each terrain's rim and ground. The ore rock is black with a white snow
// cap; its CAD "Steel Satin" is light grey, so it's darkened by material name.
const PAINT: Record<Terrain, TilePaint> = {
  forest: { rim: "#5a3a1f", ground: "#6cbf2e" },
  pasture: { rim: "#f2f1ec", ground: "#5b2fa8" },
  fields: { rim: "#f5cf12", ground: "#f28b1e" },
  hills: {
    rim: "#d42a26",
    ground: "#6b3d22",
    recolor: [{ material: /Anodized Rough \(Red\)/, color: "#7a4a2c" }], // the hill: brown in the print
  },
  mountains: { rim: "#1f1e1d", recolor: [{ material: /SteelSatin/, color: "#2e2c2a" }] },
  desert: { rim: "#f28b1e", ground: "#f3d321" },
};
const TILE_URLS = Object.values(TILE_FILES).map((name) => `${MODEL_DIR}/${name}.glb`);

/** A fresh random arrangement of the 19 terrains. */
function shuffled(): Terrain[] {
  const a = [...TERRAIN_DISTRIBUTION];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A fixed first arrangement so the page looks the same on every visit.
const INITIAL_LAYOUT: Terrain[] = [
  "mountains", "pasture", "forest",
  "fields", "hills", "pasture", "hills",
  "fields", "forest", "desert", "forest", "mountains",
  "forest", "mountains", "fields", "pasture",
  "hills", "fields", "pasture",
];

/** Token face: a light engraved-look number and pips on black, like the printed ones. */
const tokenFaces = new Map<number, THREE.CanvasTexture>();
function tokenFace(number: number) {
  let texture = tokenFaces.get(number);
  if (texture) return texture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#161514";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#d9d4c8";
  ctx.font = `600 ${number >= 10 ? 104 : 120}px "Source Serif 4 Variable", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), size / 2, size / 2 - 16);
  const pips = NUMBER_PIPS[number] ?? 0;
  const gap = 20;
  for (let i = 0; i < pips; i++) {
    ctx.beginPath();
    ctx.arc(size / 2 + (i - (pips - 1) / 2) * gap, size / 2 + 66, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  tokenFaces.set(number, texture);
  return texture;
}

const TOKEN_THICKNESS = 0.045;
const tokenSide = new THREE.MeshStandardMaterial({ color: "#161514", roughness: 0.6 });

function NumberToken({ number, radius }: { number: number; radius: number }) {
  const top = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tokenFace(number), roughness: 0.6 }),
    [number]
  );
  // Cylinder caps map u to +z and v to +x; a quarter turn makes the number
  // read upright from the default camera.
  return (
    <mesh
      position={[0, TOKEN_THICKNESS / 2, 0]}
      rotation={[0, Math.PI / 2, 0]}
      material={[tokenSide, top, tokenSide]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius * 0.96, radius * 0.96, TOKEN_THICKNESS, 48]} />
    </mesh>
  );
}

function Tiles({ layout }: { layout: Terrain[] }) {
  const gltfs = useGLTF(TILE_URLS, false, true);

  // Normalise each model once; every hex gets its own clone. Each model
  // carries a "TokenSeat" marking where its number token sits.
  const prototypes = useMemo(() => {
    const byTerrain = new Map<Terrain, { tile: THREE.Object3D; seat: ReturnType<typeof readTokenSeat> }>();
    Object.keys(TILE_FILES).forEach((terrain, i) => {
      const tile = normalizeTile(gltfs[i].scene, PAINT[terrain as Terrain]);
      byTerrain.set(terrain as Terrain, { tile, seat: readTokenSeat(tile) });
    });
    return byTerrain;
  }, [gltfs]);

  const tiles = useMemo(() => {
    const numbers = assignNumbers(layout);
    return layout.map((terrain, i) => {
      const [x, z] = hexToWorld(HEX_AXIAL_POSITIONS[i]);
      const { tile, seat } = prototypes.get(terrain)!;
      return { key: `${i}-${terrain}`, x, z, object: tile.clone(true), seat, number: numbers[i] };
    });
  }, [layout, prototypes]);

  return (
    <group>
      {tiles.map(({ key, x, z, object, seat, number }) => (
        <group key={key} position={[x, 0, z]}>
          <primitive object={object} />
          {seat && number !== null && (
            <group position={seat.position}>
              <NumberToken number={number} radius={seat.radius} />
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/** Soft studio lighting generated in code, so nothing extra is downloaded. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = texture;
    scene.environmentIntensity = 0.15;
    pmrem.dispose();
  }, [gl, scene]);
  return null;
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <p className="ui-hint absolute inset-0 flex items-center justify-center">
      Loading tiles… {Math.round(progress)}%
    </p>
  );
}

export default function CatanBoard() {
  const [layout, setLayout] = useState<Terrain[]>(INITIAL_LAYOUT);

  return (
    <figure className="m-0">
      <div className="panel relative h-[24rem] overflow-hidden sm:h-[32rem]">
        {/* flat = no tone mapping: the default (ACES filmic) desaturates the
            tiles' strong colours, e.g. brick red comes out salmon pink. */}
        <Canvas
          shadows
          flat
          camera={{ position: [0, 7, 8], fov: 35, near: 0.05, far: 100 }}
          dpr={[1, 2]}
        >
          <StudioEnvironment />
          <hemisphereLight args={[0xfff8ec, 0x8a8170, 0.55]} />
          <directionalLight
            position={[5, 10, 4]}
            intensity={0.95}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-6}
            shadow-bias={-0.0002}
            shadow-normalBias={0.02}
          />
          <Suspense fallback={null}>
            {/* No `clip`: it pins the near/far planes to the first fit, so
                zooming in or orbiting later slices through the tiles. */}
            <Bounds fit observe margin={1.05}>
              <Tiles layout={layout} />
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={3} maxDistance={20} />
        </Canvas>
        <LoadingOverlay />
        <button
          type="button"
          className="ui-button absolute bottom-3 right-3"
          onClick={() => setLayout(shuffled())}
        >
          Shuffle
        </button>
      </div>
      <figcaption className="caption">
        The full board, from the printed tiles' models · drag to orbit, scroll to zoom
      </figcaption>
    </figure>
  );
}
