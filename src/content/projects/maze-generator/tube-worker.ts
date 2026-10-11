/// <reference lib="webworker" />
import Module from "manifold-3d";
import wasmUrl from "manifold-3d/manifold.wasm?url";
import { toThreeMF, type MeshData, type ModelObject } from "../../../lib/threemf";
import { buildTube, SOLUTION_COLOR, TUBE_COLOR, type MazeData, type TubeOptions } from "./tube";

export type TubeRequest = { id: number; maze: MazeData; options: TubeOptions };

export type TubeResponse =
  | {
      id: number;
      ok: true;
      tube: MeshData;
      solution?: MeshData;
      cap: MeshData;
      diameter: number;
      threeMF: Uint8Array;
      ms: number;
    }
  | { id: number; ok: false; error: string };

// Load the WASM once, on the first request.
const manifold = Module({ locateFile: () => wasmUrl }).then((wasm) => {
  wasm.setup();
  return wasm;
});

self.onmessage = async ({ data }: MessageEvent<TubeRequest>) => {
  const { id, maze, options } = data;
  try {
    const wasm = await manifold;
    const start = performance.now();
    const { tube, solution, cap, diameter } = buildTube(wasm, maze, options);

    // The tube (with the solution as a second part, for a second filament) and
    // the cap side by side on the plate.
    const gap = diameter / 2 + 5;
    const objects: ModelObject[] = [
      {
        name: "Maze tube",
        parts: [
          { name: "Tube", mesh: tube, color: TUBE_COLOR },
          ...(solution ? [{ name: "Solution", mesh: solution, color: SOLUTION_COLOR }] : []),
        ],
        position: [-gap, 0, 0],
      },
      { name: "Cap", parts: [{ name: "Cap", mesh: cap, color: TUBE_COLOR }], position: [gap, 0, 0] },
    ];
    const threeMF = toThreeMF(objects);
    const ms = performance.now() - start;

    const response: TubeResponse = { id, ok: true, tube, solution, cap, diameter, threeMF, ms };
    const buffers = [tube, cap, ...(solution ? [solution] : [])].flatMap((m) => [
      m.positions.buffer,
      m.triangles.buffer,
    ]);
    self.postMessage(response, [...buffers, threeMF.buffer] as Transferable[]);
  } catch (e) {
    const response: TubeResponse = {
      id,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
    self.postMessage(response);
  }
};
