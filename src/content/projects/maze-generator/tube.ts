import type { Manifold, ManifoldToplevel } from "manifold-3d";
import type { MeshData } from "@/lib/threemf";

type Cell = [number, number];

export type MazeData = {
  passages: { [key: string]: Cell[] };
  width: number;
  height: number;
  letterPoints: Cell[];
  extraPathPoints: Cell[];
};

export type TubeOptions = {
  /** Size of one maze cell, mm. */
  cell: number;
  /** Wall thickness, mm. */
  wall: number;
  /** How far the walls stand proud of the tube (channel depth), mm. */
  depth: number;
  /** Make the solution's channel floor a separate part for a second colour. */
  paintSolution: boolean;
};

export const DEFAULT_TUBE: TubeOptions = {
  cell: 4,
  wall: 1.2,
  depth: 1.5,
  paintSolution: true,
};

/** Preview colours; the 3MF carries them as hints for the slicer. */
export const TUBE_COLOR = "#e8e2d6";
export const SOLUTION_COLOR = "#e8590c";

// Fixed proportions, from a design that prints and works (Puzzle Maze Tube by
// Imagine_3d on Printables, CC BY-SA): wall and floor thicknesses, the
// clearance between the maze and the cap, and how far the nub reaches in.
const TUBE_WALL = 2.25; // tube wall behind the channel floor
const FLOOR = 2; // closed bottom of the tube
const FLANGE_HEIGHT = 8; // hex base the cap rests on
const CAP_CLEARANCE = 0.25; // radial gap between wall tops and the cap's bore
const CAP_WALL = 1.6; // thinnest part of the cap's hex wall
const CAP_TOP = 2; // closed end of the cap
const NUB_REACH = 1.0; // how far the nub reaches into a 1.5 mm channel
const NUB_GAP = 0.3; // nub clearance to the channel walls, each side
const PAINT_DEPTH = 0.6; // coloured solution floor, flush with the rest
const SEAM_GAP = 0.01;

export type Tube = {
  tube: MeshData;
  solution?: MeshData;
  cap: MeshData;
  /** Overall size of the tube with its flange, mm. */
  diameter: number;
  height: number;
};

/** Geometry that both the tube and the cap depend on. */
function dimensions(width: number, height: number, o: TubeOptions) {
  const radius = (width * o.cell) / (2 * Math.PI); // channel floor
  const mazeLength = height * o.cell;
  const top = mazeLength + o.wall / 2; // top of the tube
  const capBore = radius + o.depth + CAP_CLEARANCE;
  const hexApothem = capBore + CAP_WALL;
  const hexRadius = hexApothem / Math.cos(Math.PI / 6);
  return { radius, mazeLength, top, capBore, hexRadius };
}

/** Outer size of the tube with its flange, without building it. */
export function tubeSize(width: number, height: number, o: TubeOptions) {
  const d = dimensions(width, height, o);
  return { diameter: 2 * d.hexRadius, height: d.top + FLANGE_HEIGHT };
}

/**
 * A puzzle tube from a maze. The maze wraps around a hollow cylinder (columns
 * round the circumference, rows along the length) with the walls standing
 * proud and the gaps between them as channels. A cap slides over it with a
 * nub inside its open end that has to follow the channels.
 *
 * The maze's first cell opens onto the top of the tube (the way out) and its
 * last cell is on the bottom row, where the nub sits when the cap is on. Its
 * left and right edges meet at a seam, which stays a wall.
 *
 * The maze is laid out flat first (x around the circumference, y along the
 * axis, z out of the surface) and then bent onto the cylinder with warp().
 */
export function buildTube(wasm: ManifoldToplevel, maze: MazeData, o: TubeOptions): Tube {
  const { CrossSection, Manifold } = wasm;
  const { width: W, height: H, passages } = maze;
  const { cell: c, wall: t, depth } = o;
  const { radius, mazeLength, top, capBore, hexRadius } = dimensions(W, H, o);

  const made: { delete(): void }[] = [];
  const track = <T extends { delete(): void }>(obj: T): T => {
    made.push(obj);
    return obj;
  };

  try {
    // Open passages as flat grids: is cell (x, y) open to its right / below?
    const openRight = new Uint8Array(W * H);
    const openDown = new Uint8Array(W * H);
    for (const [from, tos] of Object.entries(passages)) {
      const [fx, fy] = from.split(",").map(Number);
      for (const [x, y] of tos) {
        if (y === fy && Math.abs(x - fx) === 1) openRight[fy * W + Math.min(x, fx)] = 1;
        if (x === fx && Math.abs(y - fy) === 1) openDown[Math.min(y, fy) * W + fx] = 1;
      }
    }

    // A rectangle in maze coordinates (mm, y down from the top of the maze),
    // flipped so row 0 is at the top of the tube. Flipping here, rather than
    // mirroring the mesh afterwards, keeps every face pointing outwards.
    type Poly = [number, number][];
    const rect = (x0: number, x1: number, y0: number, y1: number): Poly => {
      const Y0 = mazeLength - y1;
      const Y1 = mazeLength - y0;
      return [[x0, Y0], [x1, Y0], [x1, Y1], [x0, Y1]];
    };

    // Walls, merged into runs along each grid line. The top edge is open over
    // the first cell (the way out); the bottom edge is closed.
    const walls: Poly[] = [];
    for (let j = 0; j <= H; j++) {
      let start = -1;
      for (let i = 0; i <= W; i++) {
        const isWall =
          i < W && (j === 0 ? i !== 0 : j === H ? true : !openDown[(j - 1) * W + i]);
        if (isWall && start < 0) start = i;
        if (!isWall && start >= 0) {
          // Stop just short of the seam: in the flat layout x = 0 and
          // x = W·c are the same place once bent, and a run that reached
          // both would overlap itself.
          const x0 = Math.max(start * c - t / 2, SEAM_GAP);
          const x1 = Math.min(i * c + t / 2, W * c - SEAM_GAP);
          walls.push(rect(x0, x1, j * c - t / 2, j * c + t / 2));
          start = -1;
        }
      }
    }
    for (let i = 1; i < W; i++) {
      let start = -1;
      for (let j = 0; j <= H; j++) {
        const isWall = j < H && !openRight[j * W + i - 1];
        if (isWall && start < 0) start = j;
        if (!isWall && start >= 0) {
          walls.push(rect(i * c - t / 2, i * c + t / 2, start * c - t / 2, j * c + t / 2));
          start = -1;
        }
      }
    }

    // Bend flat geometry onto the cylinder: x → angle, z → radius, y → height.
    const bend = (flat: Manifold) =>
      track(
        track(flat.refineToLength(c / 2)).warp((v) => {
          const angle = v[0] / radius;
          const r = radius + v[2];
          const axial = v[1];
          v[0] = r * Math.cos(angle);
          v[1] = r * Math.sin(angle);
          v[2] = axial;
        })
      );

    const extrudeFlat = (polys: Poly[], from: number, to: number) =>
      track(
        track(track(new CrossSection(polys, "NonZero")).extrude(to - from)).translate([0, 0, from])
      );

    // Walls sink a little into the tube so they fuse with it. The seam, where
    // the maze's left and right edges meet, is a wall the full height of the
    // maze, bent on its own so it can overlap the ends of the ring walls.
    const seam = rect(-t / 2, t / 2, -t / 2, mazeLength + t / 2);
    const wallsBent = track(
      bend(extrudeFlat(walls, -0.3, depth)).add(bend(extrudeFlat([seam], -0.3, depth)))
    );

    const segments = Math.max(96, W * 6);
    const outer = track(Manifold.cylinder(top, radius, radius, segments));
    const flange = track(
      track(track(CrossSection.circle(hexRadius, 6)).extrude(FLANGE_HEIGHT)).translate([
        0,
        0,
        -FLANGE_HEIGHT,
      ])
    );
    const bore = track(
      track(
        Manifold.cylinder(top + FLANGE_HEIGHT, radius - TUBE_WALL, radius - TUBE_WALL, segments)
      ).translate([0, 0, -FLANGE_HEIGHT + FLOOR])
    );

    // The bottom ring of walls sinks into the flange, the top ring is level
    // with the top of the tube.
    let tube = track(track(track(outer.add(wallsBent)).add(flange)).subtract(bore));

    let solution: Manifold | undefined;
    if (o.paintSolution) {
      // The solution's channel floor: every cell on the path, plus the gaps
      // through the walls between consecutive cells and out of the top.
      const onPath = new Set(
        [...maze.letterPoints, ...maze.extraPathPoints].map(([x, y]) => `${x},${y}`)
      );
      const tiles: Poly[] = [];
      const inner = (i: number) => [i * c + t / 2, (i + 1) * c - t / 2] as const;
      for (const key of onPath) {
        const [i, j] = key.split(",").map(Number);
        const [x0, x1] = inner(i);
        const [y0, y1] = inner(j);
        tiles.push(rect(x0, x1, y0, y1));
        if (i + 1 < W && openRight[j * W + i] && onPath.has(`${i + 1},${j}`)) {
          tiles.push(rect(x1 - 0.01, (i + 1) * c + t / 2 + 0.01, y0, y1));
        }
        if (j + 1 < H && openDown[j * W + i] && onPath.has(`${i},${j + 1}`)) {
          tiles.push(rect(x0, x1, y1 - 0.01, (j + 1) * c + t / 2 + 0.01));
        }
      }
      if (onPath.has("0,0")) tiles.push(rect(...inner(0), -t / 2, t / 2 + 0.01));

      solution = bend(extrudeFlat(tiles, -PAINT_DEPTH, 0));
      // Cut the pocket for it with a taller copy. The bent surface and the
      // cylinder are both made of flat facets that don't quite line up, and
      // cutting exactly to the surface would leave a thin skin over the pocket.
      tube = track(tube.subtract(bend(extrudeFlat(tiles, -PAINT_DEPTH, 0.2))));
    }

    // The cap, built the way it prints: closed end down, open end up, so the
    // nub is near the top edge and needs no supports. It's a hex sleeve whose
    // round bore clears the wall tops, with a pyramid nub reaching into the
    // channels. With the cap on, its rim sits on the flange and the nub sits in
    // the bottom row of the maze.
    const capInner = top + 0.5;
    const capLength = capInner + CAP_TOP;
    const capOuter = track(track(CrossSection.circle(hexRadius, 6)).extrude(capLength));
    const capBoreCut = track(
      track(Manifold.cylinder(capInner + 1, capBore, capBore, segments)).translate([0, 0, CAP_TOP])
    );
    const nubBase = c - t - 2 * NUB_GAP;
    // Narrow enough at the tip that its underside prints without support.
    const nubTip = Math.max(0.4, nubBase - 2 * NUB_REACH);
    const nubZ = capLength - c / 2; // middle of the bottom row, measured from the rim
    const baseX = capBore + 0.3; // sunk slightly into the wall
    const tipX = capBore - NUB_REACH;
    const nub = track(
      Manifold.hull([
        [baseX, -nubBase / 2, nubZ - nubBase / 2],
        [baseX, nubBase / 2, nubZ - nubBase / 2],
        [baseX, -nubBase / 2, nubZ + nubBase / 2],
        [baseX, nubBase / 2, nubZ + nubBase / 2],
        [tipX, -nubTip / 2, nubZ - nubTip / 2],
        [tipX, nubTip / 2, nubZ - nubTip / 2],
        [tipX, -nubTip / 2, nubZ + nubTip / 2],
        [tipX, nubTip / 2, nubZ + nubTip / 2],
      ])
    );
    const cap = track(track(capOuter.subtract(capBoreCut)).add(nub));

    // Stand the tube on its flange (z = 0 at the bed).
    const onBed = (m: Manifold) => track(m.translate([0, 0, FLANGE_HEIGHT]));

    return {
      tube: toMeshData(onBed(tube)),
      solution: solution && toMeshData(onBed(solution)),
      cap: toMeshData(cap),
      diameter: 2 * hexRadius,
      height: top + FLANGE_HEIGHT,
    };
  } finally {
    made.forEach((obj) => obj.delete());
  }
}

function toMeshData(manifold: Manifold): MeshData {
  const mesh = manifold.getMesh();
  const numVert = mesh.vertProperties.length / mesh.numProp;
  const positions = new Float32Array(numVert * 3);
  for (let v = 0; v < numVert; v++) {
    positions[v * 3] = mesh.vertProperties[v * mesh.numProp];
    positions[v * 3 + 1] = mesh.vertProperties[v * mesh.numProp + 1];
    positions[v * 3 + 2] = mesh.vertProperties[v * mesh.numProp + 2];
  }
  return { positions, triangles: new Uint32Array(mesh.triVerts) };
}
