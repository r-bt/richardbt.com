import { strToU8, zipSync } from "fflate";
import type { MeshData } from "./generator-manifold";

/** Model coordinates are millimetres. */
const UNIT = "millimeter";

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;

const num = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(5).replace(/\.?0+$/, ""));

/**
 * A minimal 3MF package for one mesh. The model is built Y-up, but 3MF (and
 * every slicer) is Z-up, so it's turned to stand on its base on the bed.
 */
export function toThreeMF({ positions, triangles }: MeshData): Uint8Array {
  const vertices: string[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    // Y-up → Z-up: (x, y, z) → (x, -z, y)
    vertices.push(`<vertex x="${num(x)}" y="${num(-z)}" z="${num(y)}"/>`);
  }

  const tris: string[] = [];
  for (let t = 0; t < triangles.length; t += 3) {
    tris.push(`<triangle v1="${triangles[t]}" v2="${triangles[t + 1]}" v3="${triangles[t + 2]}"/>`);
  }

  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="${UNIT}" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh><vertices>${vertices.join("")}</vertices><triangles>${tris.join("")}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`;

  return zipSync({
    "[Content_Types].xml": strToU8(CONTENT_TYPES),
    "_rels/.rels": strToU8(RELS),
    "3D/3dmodel.model": strToU8(model),
  });
}
