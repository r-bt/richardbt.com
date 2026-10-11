import type { Manifold, ManifoldToplevel, Mat4 } from "manifold-3d";
import type { Font } from "opentype.js";
import { layoutWord, matchLengths, wordLength } from "./fonts";
import { letterContours } from "./outline";

/** Extrusion depth for words that fit in it; longer words get a deeper one. */
const MIN_DEPTH = 20;

// The second word is turned so it reads from the side: (x, y, z) → (z, y, -x).
// Column-major, like every Mat4 Manifold takes.
const TURN_TO_SIDE: Mat4 = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1];

export type { MeshData } from "@/lib/threemf";
import type { MeshData } from "@/lib/threemf";

/**
 * The same construction as the JSCAD generator, on Manifold: letter `i` of
 * each word is extruded, the second turned side-on, and the pair intersected.
 * The pieces are set on a base and turned 45° so each word faces one side.
 *
 * Manifold objects live in WASM memory, so everything created here is freed
 * before returning.
 */
export function generateIllusionManifold(
  wasm: ManifoldToplevel,
  font: Font,
  firstWord: string,
  secondWord: string,
  padding: number,
  fillet: number
): MeshData {
  const { CrossSection, Manifold } = wasm;
  const made: { delete(): void }[] = [];
  const track = <T extends { delete(): void }>(obj: T): T => {
    made.push(obj);
    return obj;
  };

  try {
    [firstWord, secondWord] = matchLengths(firstWord, secondWord);

    const depth = Math.max(
      MIN_DEPTH,
      Math.ceil(Math.max(wordLength(font, firstWord), wordLength(font, secondWord)) + 5)
    );

    const firstLetters = layoutWord(font, firstWord);
    const secondLetters = layoutWord(font, secondWord);

    const extrudeLetter = (char: string, x: number) => {
      const contours = letterContours(font, char, x);
      if (contours.length === 0) return null;
      const section = track(new CrossSection(contours, "NonZero"));
      return track(section.extrude(depth));
    };

    let pieces: Manifold[] = [];

    firstLetters.forEach((first, i) => {
      const second = secondLetters[i];
      if (!first.char.trim() || !second.char.trim()) return;

      const a = extrudeLetter(first.char, first.x);
      const b = extrudeLetter(second.char, second.x);
      if (!a || !b) return;

      const firstPrism = track(a.translate([Math.PI / 2, 0, 0]));
      const secondPrism = track(track(b.translate([-depth, 0, 0])).transform(TURN_TO_SIDE));

      const piece = track(firstPrism.intersect(secondPrism));
      if (!piece.isEmpty()) pieces.push(piece);
    });

    if (pieces.length === 0) {
      throw new Error("The words don't overlap anywhere");
    }

    // Centre the pieces on the origin
    const all = track(Manifold.union(pieces)).boundingBox();
    const centre: [number, number, number] = [0, 1, 2].map(
      (k) => -(all.min[k] + all.max[k]) / 2
    ) as [number, number, number];
    pieces = pieces.map((piece) => track(piece.translate(centre)));

    // Base: a rounded slab under the diagonal the pieces sit on
    const placed = track(Manifold.union(pieces)).boundingBox();
    const adjacent = placed.max[0] - placed.min[0];
    const opposite = placed.max[2] - placed.min[2];
    const hypotenuse = Math.sqrt(adjacent ** 2 + opposite ** 2);

    let yTranslate = -Infinity;
    for (const piece of pieces) {
      yTranslate = Math.max(yTranslate, piece.boundingBox().min[1]);
    }

    const width = hypotenuse + padding * 2;
    const height = 6;
    const radius = Math.min((fillet / 100) * 2.99, width / 2 - 1e-3, height / 2 - 1e-3);
    let base2D = track(CrossSection.square([width - 2 * radius, height - 2 * radius], true));
    if (radius > 0) base2D = track(base2D.offset(radius, "Round", 2, 64));

    const base = track(
      track(track(base2D.extrude(0.5)).rotate([90, 0, 0])).translate([0, yTranslate, 0])
    );

    // Turn each piece 45° so the words face opposite sides, centred on the base
    const aligned = pieces.map((piece) => {
      const turned = track(piece.rotate([0, -45, 0]));
      const { min, max } = turned.boundingBox();
      return track(turned.translate([0, 0, -(min[2] + max[2]) / 2]));
    });

    const model = track(Manifold.union([...aligned, base]));
    const mesh = model.getMesh();

    // Copy out of WASM memory before everything is freed.
    const numVert = mesh.vertProperties.length / mesh.numProp;
    const positions = new Float32Array(numVert * 3);
    for (let v = 0; v < numVert; v++) {
      positions[v * 3] = mesh.vertProperties[v * mesh.numProp];
      positions[v * 3 + 1] = mesh.vertProperties[v * mesh.numProp + 1];
      positions[v * 3 + 2] = mesh.vertProperties[v * mesh.numProp + 2];
    }
    return { positions, triangles: new Uint32Array(mesh.triVerts) };
  } finally {
    made.forEach((obj) => obj.delete());
  }
}
