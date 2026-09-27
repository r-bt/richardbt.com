/// <reference lib="webworker" />
import Module from "manifold-3d";
import wasmUrl from "manifold-3d/manifold.wasm?url";
import { loadFont } from "./fonts";
import { generateIllusionManifold, type MeshData } from "./generator-manifold";
import { toThreeMF } from "./threemf";

export type GenerateRequest = {
  id: number;
  fontUrl: string;
  firstWord: string;
  secondWord: string;
  padding: number;
  fillet: number;
};

export type GenerateResponse =
  | { id: number; ok: true; mesh: MeshData; threeMF: Uint8Array; ms: number }
  | { id: number; ok: false; error: string };

// Load the WASM once, on the first request.
const manifold = Module({ locateFile: () => wasmUrl }).then((wasm) => {
  wasm.setup();
  return wasm;
});

self.onmessage = async ({ data }: MessageEvent<GenerateRequest>) => {
  const { id, fontUrl, firstWord, secondWord, padding, fillet } = data;
  try {
    const [wasm, font] = await Promise.all([manifold, loadFont(fontUrl)]);
    const start = performance.now();
    const mesh = generateIllusionManifold(wasm, font, firstWord, secondWord, padding, fillet);
    const threeMF = toThreeMF(mesh);
    const ms = performance.now() - start;

    const response: GenerateResponse = { id, ok: true, mesh, threeMF, ms };
    self.postMessage(response, [
      mesh.positions.buffer,
      mesh.triangles.buffer,
      threeMF.buffer,
    ] as Transferable[]);
  } catch (e) {
    const response: GenerateResponse = {
      id,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
    self.postMessage(response);
  }
};
