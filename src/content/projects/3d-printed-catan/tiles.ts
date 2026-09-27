import * as THREE from "three";

// Ported from the 3d-catan game room (src/games/catan/ModelLoader.js), so the
// board on this page is laid out and normalised the same way.

export const HEX_SIZE = 1;

export type Terrain = "hills" | "forest" | "mountains" | "fields" | "pasture" | "desert";

/** 4 forest, 4 fields, 4 pasture, 3 hills, 3 mountains, 1 desert. */
export const TERRAIN_DISTRIBUTION: Terrain[] = [
  "hills", "hills", "hills",
  "forest", "forest", "forest", "forest",
  "mountains", "mountains", "mountains",
  "fields", "fields", "fields", "fields",
  "pasture", "pasture", "pasture", "pasture",
  "desert",
];

/** The 19 hexes of the board, in axial (q, r) coordinates. */
export const HEX_AXIAL_POSITIONS: [number, number][] = [
  [-2, 0], [-2, 1], [-2, 2],
  [-1, -1], [-1, 0], [-1, 1], [-1, 2],
  [0, -2], [0, -1], [0, 0], [0, 1], [0, 2],
  [1, -2], [1, -1], [1, 0], [1, 1],
  [2, -2], [2, -1], [2, 0],
];

/** Flat-topped hex layout: centre of hex (q, r) on the XZ plane. */
export const hexToWorld = ([q, r]: [number, number]): [number, number] => [
  HEX_SIZE * 1.5 * q,
  HEX_SIZE * Math.sqrt(3) * (r + q / 2),
];

/**
 * Colours to match the printed tile. The CAD models use pale appearance tints,
 * so the two big surfaces are repainted by role (the rim is the full-width base
 * plate, the ground the next plate up) and everything else is saturated.
 */
export type TilePaint = {
  rim?: THREE.ColorRepresentation;
  ground?: THREE.ColorRepresentation;
  recolor?: Recolor[];
};

/**
 * Scale a tile so its base plate fits a hex, centre it on the origin, sit it on
 * the ground and turn it so the plate's edges line up with the hex grid.
 */
export function normalizeTile(model: THREE.Object3D, paint: TilePaint = {}): THREE.Object3D {
  const normalized = model.clone(true);
  sanitizeTile(normalized, paint.recolor ?? []);

  normalized.rotation.set(0, 0, 0);
  normalized.position.set(0, 0, 0);
  normalized.scale.set(1, 1, 1);
  normalized.updateMatrixWorld(true);

  // Measure once, precisely (vertex by vertex), at identity. three's default
  // box rotates each mesh's own bounding box into place, which inflates for
  // rotated parts; inflated boxes made the tiles too big for the grid.
  const whole = preciseBox(normalized);
  const base = findBasePlate(normalized, whole);

  if (paint.rim && base.mesh) paintMesh(base.mesh, paint.rim);
  if (paint.ground) {
    const ground = findGroundPlate(normalized, base);
    if (ground) paintMesh(ground, paint.ground);
  }

  // Turn the tile so its hex matches the grid's: flat-topped, i.e. wider along
  // x than z by 2/√3. A base that's wider along z needs a 30° turn.
  const FLAT_TOP_RATIO = 2 / Math.sqrt(3);
  const ratio = base.size.x / Math.max(base.size.z, 1e-6);
  const rotationY =
    Math.abs(ratio - FLAT_TOP_RATIO) <= Math.abs(1 / ratio - FLAT_TOP_RATIO) ? 0 : Math.PI / 6;

  const targetDiameter = HEX_SIZE * 1.9;
  const scale = targetDiameter / Math.max(base.size.x, base.size.z, 0.001);

  normalized.scale.setScalar(scale);
  normalized.rotation.y = rotationY;

  // Where the base's centre ends up after scaling and turning about the origin.
  const center = base.box
    .getCenter(new THREE.Vector3())
    .multiplyScalar(scale)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);

  normalized.position.set(-center.x, -whole.min.y * scale, -center.z);

  normalized.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const size = new THREE.Box3().setFromObject(child).getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
    const isPaperThin = size.y / maxDim < 0.04;
    child.castShadow = !isPaperThin;
    child.receiveShadow = true;
  });

  // Wrap so callers can position the tile without undoing the normalisation.
  const holder = new THREE.Group();
  holder.add(normalized);
  return holder;
}

const preciseBox = (object: THREE.Object3D) => new THREE.Box3().setFromObject(object, true);

/** Swap the colour of any material whose name matches, e.g. to match the print. */
export type Recolor = { material: RegExp; color: THREE.ColorRepresentation };

function sanitizeTile(model: THREE.Object3D, recolor: Recolor[]) {
  const meshes: THREE.Mesh[] = [];
  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    meshes.push(mesh);
    fixMaterial(mesh, recolor);
  });

  // Fusion exports duplicate shells (Body1001 + Body1001_1 + Body1001_2) that
  // share the same surface and z-fight. Group by name stem and offset overlays.
  const groups = new Map<string, THREE.Mesh[]>();
  for (const mesh of meshes) {
    const stem = mesh.name.replace(/(_\d+)+$/, "");
    if (!groups.has(stem)) groups.set(stem, []);
    groups.get(stem)!.push(mesh);
  }

  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    group.sort((a, b) => overlayScore(a) - overlayScore(b));
    for (let i = 1; i < group.length; i++) applyPolygonOffset(group[i]);
  }

  // Also catch spatial duplicates across different Fusion name variants
  // (e.g. Body305 + Body305001 occupying the same space).
  const boxes = meshes.map((mesh) => ({ mesh, box: new THREE.Box3().setFromObject(mesh) }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlapXZ(boxes[i].box, boxes[j].box, 0.85)) {
        const overlay =
          overlayScore(boxes[j].mesh) >= overlayScore(boxes[i].mesh) ? boxes[j].mesh : boxes[i].mesh;
        applyPolygonOffset(overlay);
      }
    }
  }
}

function overlayScore(mesh: THREE.Mesh) {
  let score = 0;
  if (/_\d+$/.test(mesh.name)) score += 2;
  if (/\d{3,}$/.test(mesh.name)) score += 1;
  const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
  if (size.y / maxDim < 0.08) score += 1;
  return score;
}

/**
 * Nudge a duplicate surface just behind the one it overlaps so they don't
 * flicker. The nudge is the same small amount for every overlay: the game
 * used an increasing offset per duplicate, which with hundreds of parts pushed
 * some so far back they vanished behind neighbouring tiles when orbiting.
 * Materials are shared between parts, so the overlay gets its own copy.
 */
function applyPolygonOffset(mesh: THREE.Mesh) {
  if (mesh.userData.offset) return;
  mesh.userData.offset = true;
  const clone = (material: THREE.Material) => {
    const copy = material.clone();
    copy.polygonOffset = true;
    copy.polygonOffsetFactor = 1;
    copy.polygonOffsetUnits = 1;
    return copy;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
  mesh.receiveShadow = false;
}

function boxesOverlapXZ(a: THREE.Box3, b: THREE.Box3, threshold: number) {
  const overlapX = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x));
  const overlapZ = Math.max(0, Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
  const intersection = overlapX * overlapZ;
  if (intersection <= 0) return false;

  const sizeA = a.getSize(new THREE.Vector3());
  const sizeB = b.getSize(new THREE.Vector3());
  const areaA = Math.max(sizeA.x * sizeA.z, 0.000001);
  const areaB = Math.max(sizeB.x * sizeB.z, 0.000001);
  const ratio = intersection / Math.min(areaA, areaB);
  const centerDist = a.getCenter(new THREE.Vector3()).distanceTo(b.getCenter(new THREE.Vector3()));
  const maxSpan = Math.max(sizeA.x, sizeA.z, sizeB.x, sizeB.z);
  return ratio >= threshold && centerDist < maxSpan * 0.15;
}

/**
 * The tiles were printed in PLA, but the CAD appearances are Fusion's "steel",
 * "metallic paint" and so on. Render every surface as matte-ish plastic so the
 * board looks like the printed one (and shiny metals don't go black).
 */
function fixMaterial(mesh: THREE.Mesh, recolor: Recolor[]) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials as THREE.MeshPhysicalMaterial[]) {
    if (!material) continue;
    if (material.userData.fixed) continue;
    material.userData.fixed = true;
    const swap = recolor.find((r) => r.material.test(material.name));
    if (swap) material.color.set(swap.color);
    else saturate(material.color);
    material.metalness = 0;
    material.metalnessMap = null;
    material.roughness = Math.max(material.roughness ?? 1, 0.55);
    if ("clearcoat" in material) material.clearcoat = 0;
    material.needsUpdate = true;
  }
}

/**
 * The largest flat mesh in the model: the tile's hexagonal base. If the
 * largest flat piece is much narrower than the tile (e.g. the base was merged
 * into another part), the tile's overall outline is used instead.
 */
type Plate = { box: THREE.Box3; size: THREE.Vector3; area: number; mesh?: THREE.Mesh };

function findBasePlate(object: THREE.Object3D, whole: THREE.Box3): Plate {
  let best: Plate | null = null;
  object.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const box = preciseBox(child);
    const size = box.getSize(new THREE.Vector3());
    const maxXZ = Math.max(size.x, size.z, 0.001);
    if (size.y > maxXZ * 0.2) return;
    const area = size.x * size.z;
    if (!best || area > best.area) best = { box, size, area, mesh: child as THREE.Mesh };
  });

  const wholeSize = whole.getSize(new THREE.Vector3());
  const plate = best as Plate | null;
  if (plate && Math.max(plate.size.x, plate.size.z) >= Math.max(wholeSize.x, wholeSize.z) * 0.8) {
    return plate;
  }
  return { box: whole, size: wholeSize, area: wholeSize.x * wholeSize.z };
}

/**
 * Where a number token sits on this tile. Each model carries an empty
 * "TokenSeat" node (added when the models were prepared) at the centre of the
 * token's recess, on its floor, with the recess radius in its extras. Returns
 * it in the tile's own space, after normalisation, or null for the desert.
 */
export function readTokenSeat(tile: THREE.Object3D): { position: THREE.Vector3; radius: number } | null {
  const seat = tile.getObjectByName("TokenSeat");
  if (!seat) return null;
  tile.updateMatrixWorld(true);
  const position = seat.getWorldPosition(new THREE.Vector3());
  const scale = seat.getWorldScale(new THREE.Vector3()).x;
  return { position, radius: (seat.userData.radius ?? 0.0125) * scale };
}

/** Order the number tokens are laid out in: a spiral in from a corner. */
const SPIRAL_ORDER: [number, number][] = [
  [0, -2], [-1, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2],
  [0, 2], [1, 1], [2, 0], [2, -1], [2, -2], [1, -2],
  [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0], [1, -1],
  [0, 0],
];

/** The standard token sequence (A to R), laid along the spiral. */
const NUMBER_SEQUENCE = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

export const NUMBER_PIPS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

const AXIAL_DIRECTIONS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

/**
 * A number for every hex (null for the desert), indexed like the layout: the
 * sequence along the spiral, then swaps so no two 6s/8s are neighbours.
 */
export function assignNumbers(layout: Terrain[]): (number | null)[] {
  const indexOf = new Map(HEX_AXIAL_POSITIONS.map(([q, r], i) => [`${q},${r}`, i]));
  const numbers: (number | null)[] = layout.map(() => null);
  let next = 0;
  for (const [q, r] of SPIRAL_ORDER) {
    const i = indexOf.get(`${q},${r}`)!;
    if (layout[i] !== "desert") numbers[i] = NUMBER_SEQUENCE[next++];
  }

  const red = (n: number | null) => n === 6 || n === 8;
  const neighbours = (i: number) => {
    const [q, r] = HEX_AXIAL_POSITIONS[i];
    return AXIAL_DIRECTIONS.map(([dq, dr]) => indexOf.get(`${q + dq},${r + dr}`)).filter(
      (j): j is number => j !== undefined
    );
  };
  for (let attempt = 0; attempt < 200; attempt++) {
    const clash = numbers.findIndex((n, i) => red(n) && neighbours(i).some((j) => red(numbers[j])));
    if (clash < 0) break;
    // Swap the clashing 6/8 with the first plain number that has no red neighbours.
    const target = numbers.findIndex(
      (n, i) => n !== null && !red(n) && !neighbours(i).some((j) => j !== clash && red(numbers[j]))
    );
    if (target < 0) break;
    [numbers[clash], numbers[target]] = [numbers[target], numbers[clash]];
  }
  return numbers;
}

/**
 * The ground: the largest flat part (other than the base plate) that covers
 * most of the tile and sits on top of the base.
 */
function findGroundPlate(object: THREE.Object3D, base: Plate): THREE.Mesh | null {
  const baseXZ = Math.max(base.size.x, base.size.z);
  let best: { mesh: THREE.Mesh; area: number } | null = null;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh === base.mesh) return;
    const box = preciseBox(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxXZ = Math.max(size.x, size.z);
    if (maxXZ < baseXZ * 0.6 || size.y > maxXZ * 0.2) return;
    if (box.min.y < base.box.min.y - 1e-6) return;
    const area = size.x * size.z;
    if (!best || area > best.area) best = { mesh, area };
  });
  return (best as { mesh: THREE.Mesh; area: number } | null)?.mesh ?? null;
}

/** Give a mesh its own copy of its material(s) in a new colour. */
function paintMesh(mesh: THREE.Mesh, color: THREE.ColorRepresentation) {
  const paint = (material: THREE.Material) => {
    const copy = material.clone() as THREE.MeshStandardMaterial;
    copy.color.set(color);
    return copy;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(paint) : paint(mesh.material);
}

/**
 * CAD appearance tints are pale; filament is vivid. Push colours towards the
 * printed look: more saturated, and pastel highlights pulled down a little.
 * Near-greys (white, black, silver parts) are left alone.
 */
function saturate(color: THREE.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl, THREE.SRGBColorSpace);
  if (hsl.s < 0.12) return;
  const s = Math.min(1, hsl.s * 1.7);
  const l = hsl.l > 0.55 ? 0.55 + (hsl.l - 0.55) * 0.5 : hsl.l;
  color.setHSL(hsl.h, s, l, THREE.SRGBColorSpace);
}
