import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { Slider } from "@/components/ui/slider";
import type { MeshData } from "@/lib/threemf";
import { DEFAULT_TUBE, SOLUTION_COLOR, TUBE_COLOR, tubeSize, type MazeData } from "./tube";
import type { TubeRequest, TubeResponse } from "./tube-worker";

type Meshes = { tube: MeshData; solution?: MeshData; cap: MeshData; diameter: number };

function toGeometry(mesh: MeshData) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(mesh.positions, 3));
  g.setIndex(new BufferAttribute(mesh.triangles, 1));
  g.computeVertexNormals();
  return g;
}

/** The current maze as a 3D-printable tube with a cap, previewed and as a 3MF. */
export default function TubeMaze({ maze }: { maze: MazeData }) {
  const [cell, setCell] = useState(DEFAULT_TUBE.cell);
  const [paintSolution, setPaintSolution] = useState(DEFAULT_TUBE.paintSolution);
  const [meshes, setMeshes] = useState<Meshes>();
  const [fileURL, setFileURL] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const options = { ...DEFAULT_TUBE, cell, paintSolution };
  const size = tubeSize(maze.width, maze.height, options);

  // Same pattern as the nameplate generator: one build at a time in a worker,
  // with changes made meanwhile collapsed into a single pending request.
  const worker = useRef<Worker>();
  const latest = useRef(0);
  const inFlight = useRef(false);
  const pending = useRef<TubeRequest | null>(null);

  const send = (request: TubeRequest) => {
    if (inFlight.current) {
      pending.current = request;
      return;
    }
    inFlight.current = true;
    worker.current?.postMessage(request);
  };

  useEffect(() => {
    const w = new Worker(new URL("./tube-worker.ts", import.meta.url), { type: "module" });
    worker.current = w;

    w.onmessage = ({ data }: MessageEvent<TubeResponse>) => {
      inFlight.current = false;
      if (pending.current) {
        const next = pending.current;
        pending.current = null;
        send(next);
      }

      if (data.id !== latest.current) return;
      setBusy(false);
      if (!data.ok) {
        console.error(data.error);
        setError("Couldn't build the tube for this maze.");
        return;
      }
      setError(undefined);
      setMeshes(data);
      setFileURL((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(new Blob([data.threeMF as Uint8Array<ArrayBuffer>], { type: "model/3mf" }));
      });
    };

    return () => w.terminate();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusy(true);
      send({ id: ++latest.current, maze, options: { ...DEFAULT_TUBE, cell, paintSolution } });
    }, 250);
    return () => clearTimeout(timer);
  }, [maze, cell, paintSolution]);

  useEffect(() => () => {
    if (fileURL) URL.revokeObjectURL(fileURL);
  }, [fileURL]);

  const geometries = useMemo(() => {
    if (!meshes) return undefined;
    return {
      tube: toGeometry(meshes.tube),
      solution: meshes.solution && toGeometry(meshes.solution),
      cap: toGeometry(meshes.cap),
      offset: meshes.diameter / 2 + 5,
    };
  }, [meshes]);

  useEffect(
    () => () => {
      geometries?.tube.dispose();
      geometries?.solution?.dispose();
      geometries?.cap.dispose();
    },
    [geometries]
  );

  // Re-frame only when the overall size changes.
  const frameKey = meshes ? `${Math.round(meshes.diameter)}-${maze.height}` : "";

  return (
    <div className="pt-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <span className="ui-label">Cell size · {cell.toFixed(1)} mm</span>
          <Slider
            aria-label="Cell size"
            min={3}
            max={6}
            step={0.5}
            value={[cell]}
            onValueChange={(value) => setCell(value[0])}
          />
        </div>
        <label className="ui-hint flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="accent-[var(--accent)]"
            checked={paintSolution}
            onChange={(e) => setPaintSolution(e.target.checked)}
          />
          Colour the solution
        </label>
      </div>

      <p className="ui-hint pt-3">
        {Math.round(size.diameter)} mm across, {Math.round(size.height)} mm tall
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-3">
        {fileURL ? (
          <a className="ui-button ui-button--primary" href={fileURL} download="maze-tube.3mf">
            Download 3MF
          </a>
        ) : (
          <button className="ui-button ui-button--primary" disabled>
            Download 3MF
          </button>
        )}
        <span className="ui-hint" aria-live="polite">
          {busy ? "Building…" : ""}
        </span>
        {error && <p className="ui-error">{error}</p>}
      </div>

      <div className="relative mt-4 h-[26rem] overflow-hidden rounded-[3px] border border-rule bg-paper sm:h-[30rem]">
        {!geometries && (
          <p className="ui-hint absolute inset-0 flex items-center justify-center">Building the tube…</p>
        )}
        <Canvas camera={{ position: [0, -160, 90], up: [0, 0, 1], fov: 40 }}>
          {geometries && (
            <Bounds key={frameKey} fit observe margin={1.15}>
              <group position={[-geometries.offset, 0, 0]}>
                <mesh geometry={geometries.tube}>
                  <meshStandardMaterial color={TUBE_COLOR} flatShading />
                </mesh>
                {geometries.solution && (
                  <mesh geometry={geometries.solution}>
                    <meshStandardMaterial color={SOLUTION_COLOR} flatShading />
                  </mesh>
                )}
              </group>
              <mesh geometry={geometries.cap} position={[geometries.offset, 0, 0]}>
                <meshStandardMaterial color={TUBE_COLOR} flatShading />
              </mesh>
            </Bounds>
          )}
          <OrbitControls makeDefault />
          <ambientLight intensity={0.35} />
          <directionalLight position={[60, -60, 80]} intensity={1.2} />
          <directionalLight position={[-60, -40, 40]} intensity={0.8} />
          <directionalLight position={[0, 80, 60]} intensity={0.6} />
        </Canvas>
      </div>
      <p className="ui-hint pt-2">Drag to orbit, scroll to zoom.</p>
    </div>
  );
}
