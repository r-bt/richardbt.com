import { strToU8, zipSync } from "fflate";

export type MeshData = {
  /** xyz per vertex */
  positions: Float32Array;
  /** three vertex indices per triangle */
  triangles: Uint32Array;
};

export type Part = {
  name: string;
  mesh: MeshData;
  /** Display colour (#rrggbb); slicers use it as a hint in the preview. */
  color?: string;
};

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;

const num = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(5).replace(/\.?0+$/, ""));
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

function meshXML({ positions, triangles }: MeshData, yUp: boolean) {
  const vertices: string[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    // 3MF (and every slicer) is Z-up; turn Y-up models to stand upright.
    vertices.push(
      yUp
        ? `<vertex x="${num(x)}" y="${num(-z)}" z="${num(y)}"/>`
        : `<vertex x="${num(x)}" y="${num(y)}" z="${num(z)}"/>`
    );
  }
  const tris: string[] = [];
  for (let t = 0; t < triangles.length; t += 3) {
    tris.push(`<triangle v1="${triangles[t]}" v2="${triangles[t + 1]}" v3="${triangles[t + 2]}"/>`);
  }
  return `<mesh><vertices>${vertices.join("")}</vertices><triangles>${tris.join("")}</triangles></mesh>`;
}

/** One object on the plate, made of one or more parts. */
export type ModelObject = {
  name: string;
  parts: Part[];
  /** Where it sits on the plate, mm. */
  position?: [number, number, number];
};

/**
 * A 3MF package in millimetres. An object with several parts is written as
 * components, which Bambu Studio and PrusaSlicer import as one object with a
 * part per component, so each part can be given its own filament.
 */
export function toThreeMF(
  input: Part[] | ModelObject[],
  { yUp = false }: { yUp?: boolean } = {}
): Uint8Array {
  const models: ModelObject[] =
    "parts" in input[0] ? (input as ModelObject[]) : [{ name: "", parts: input as Part[] }];
  const parts = models.flatMap((m) => m.parts);

  const colored = parts.some((p) => p.color);
  const materials = colored
    ? `<basematerials id="1">${parts
        .map((p) => `<base name="${esc(p.name)}" displaycolor="${(p.color ?? "#cccccc").toUpperCase()}FF"/>`)
        .join("")}</basematerials>`
    : "";

  const objects: string[] = [];
  const items: string[] = [];
  let id = 2;
  let partIndex = 0;
  for (const model of models) {
    const partIds = model.parts.map((part) => {
      const material = colored ? ` pid="1" pindex="${partIndex}"` : "";
      partIndex++;
      objects.push(
        `<object id="${id}" name="${esc(part.name)}" type="model"${material}>${meshXML(part.mesh, yUp)}</object>`
      );
      return id++;
    });

    let objectId = partIds[0];
    if (partIds.length > 1) {
      objectId = id++;
      objects.push(
        `<object id="${objectId}" name="${esc(model.name)}" type="model"><components>${partIds
          .map((p) => `<component objectid="${p}"/>`)
          .join("")}</components></object>`
      );
    }
    const [x, y, z] = model.position ?? [0, 0, 0];
    const transform = x || y || z ? ` transform="1 0 0 0 1 0 0 0 1 ${num(x)} ${num(y)} ${num(z)}"` : "";
    items.push(`<item objectid="${objectId}"${transform}/>`);
  }

  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>${materials}${objects.join("")}</resources><build>${items.join("")}</build></model>`;

  return zipSync({
    "[Content_Types].xml": strToU8(CONTENT_TYPES),
    "_rels/.rels": strToU8(RELS),
    "3D/3dmodel.model": strToU8(model),
  });
}
