import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import Input from "@/components/Input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_FONT, FONTS, type FontCategory } from "./font-choices";
import type { MeshData } from "./generator-manifold";
import type { GenerateRequest, GenerateResponse } from "./worker";

const FONT_GROUPS: { category: FontCategory; label: string }[] = [
  { category: "sans-serif", label: "Sans serif" },
  { category: "serif", label: "Serif" },
  { category: "display", label: "Display" },
  { category: "monospace", label: "Monospace" },
];

const WEIGHT_NAMES: Record<string, string> = {
  "400": "Regular",
  "500": "Medium",
  "600": "Semibold",
  "700": "Bold",
  "800": "Extra bold",
  "900": "Black",
};

export default function IllusionGenerator() {
  const [mesh, setMesh] = useState<MeshData>();

  const [firstWord, setFirstWord] = useState<string>("BUSY");
  const [secondWord, setSecondWord] = useState<string>("FREE");
  const [family, setFamily] = useState<string>(DEFAULT_FONT);
  const font = FONTS.find((f) => f.family === family) ?? FONTS[0];
  const [weight, setWeight] = useState<number>(font.weight);
  const [padding, setPadding] = useState<number>(2.5);
  const [fillet, setFillet] = useState<number>(50);

  const [fileURL, setFileURL] = useState<string | undefined>();
  const [buildMs, setBuildMs] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  // Geometry runs in a worker so the page never freezes while it builds.
  // One build runs at a time; changes made meanwhile collapse into a single
  // pending request, so fast typing never queues up stale builds.
  const worker = useRef<Worker>();
  const latest = useRef(0);
  const inFlight = useRef(false);
  const pending = useRef<GenerateRequest | null>(null);

  const send = (request: GenerateRequest) => {
    if (inFlight.current) {
      pending.current = request;
      return;
    }
    inFlight.current = true;
    worker.current?.postMessage(request);
  };

  useEffect(() => {
    const w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.current = w;

    w.onmessage = ({ data }: MessageEvent<GenerateResponse>) => {
      inFlight.current = false;
      if (pending.current) {
        const next = pending.current;
        pending.current = null;
        send(next);
      }

      // Ignore results from requests that have since been superseded.
      if (data.id !== latest.current) return;
      setBusy(false);
      if (!data.ok) {
        console.error(data.error);
        setError("Couldn't build that one. Try another font or shorter words.");
        return;
      }
      setError(undefined);
      setMesh(data.mesh);
      setBuildMs(data.ms);
      setFileURL((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(new Blob([data.threeMF as Uint8Array<ArrayBuffer>], { type: "model/3mf" }));
      });
    };

    return () => w.terminate();
  }, []);

  // Rebuild shortly after any change settles.
  useEffect(() => {
    // Words of different lengths are cut to the shorter one by the generator.
    if (!firstWord.trim() || !secondWord.trim()) return;

    const fontUrl = font.files[String(weight)] ?? font.files[String(font.weight)];

    const timer = setTimeout(() => {
      setBusy(true);
      send({ id: ++latest.current, fontUrl, firstWord, secondWord, padding, fillet });
    }, 250);
    return () => clearTimeout(timer);
  }, [font, weight, firstWord, secondWord, padding, fillet]);

  const geometry = useMemo(() => {
    if (!mesh) return undefined;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(mesh.positions, 3));
    g.setIndex(new BufferAttribute(mesh.triangles, 1));
    g.computeVertexNormals();
    return g;
  }, [mesh]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  const frameKey = useMemo(() => {
    if (!geometry) return "";
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    return [box.max.x - box.min.x, box.max.y - box.min.y]
      .map((n) => Math.round(n / 2))
      .join("x");
  }, [geometry]);

  // Capitals only: lowercase letters have different heights, so the pieces
  // don't line up.
  const handleFirstWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstWord(e.target.value.toUpperCase());
  };

  const handleSecondWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondWord(e.target.value.toUpperCase());
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = FONTS.find((f) => f.family === e.target.value) ?? FONTS[0];
    setFamily(next.family);
    setWeight(next.weight);
  };

  return (
    <div className="panel p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ui-label" htmlFor="nameplate-first">
            First word
          </label>
          <Input id="nameplate-first" value={firstWord} onChange={handleFirstWordChange} autoCapitalize="characters" />
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-second">
            Second word
          </label>
          <Input id="nameplate-second" value={secondWord} onChange={handleSecondWordChange} autoCapitalize="characters" />
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-font">
            Font
          </label>
          <select
            id="nameplate-font"
            className="ui-select"
            onChange={handleFontChange}
            value={family}
          >
            {FONT_GROUPS.map(({ category, label }) => (
              <optgroup key={category} label={label}>
                {FONTS.filter((f) => f.category === category)
                  .map((f) => f.family)
                  .sort((a, b) => a.localeCompare(b))
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-weight">
            Weight
          </label>
          <select
            id="nameplate-weight"
            className="ui-select"
            onChange={(e) => setWeight(Number(e.target.value))}
            value={weight}
            disabled={Object.keys(font.files).length < 2}
          >
            {Object.keys(font.files).map((w) => (
              <option key={w} value={w}>
                {WEIGHT_NAMES[w] ?? w} · {w}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="ui-label">Base padding · {padding.toFixed(1)}</span>
          <Slider
            aria-label="Base padding"
            max={10.0}
            step={0.1}
            value={[padding]}
            onValueChange={(value) => setPadding(value[0])}
          />
        </div>
        <div>
          <span className="ui-label">Base fillet · {fillet}%</span>
          <Slider
            aria-label="Base fillet"
            max={100}
            step={1}
            value={[fillet]}
            onValueChange={(value) => setFillet(value[0])}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-5">
        {fileURL ? (
          <a className="ui-button ui-button--primary" href={fileURL} download="nameplate.3mf">
            Download 3MF
          </a>
        ) : (
          <button className="ui-button ui-button--primary" disabled>
            Download 3MF
          </button>
        )}
        <span className="ui-hint" aria-live="polite">
          {busy ? "Building…" : buildMs !== undefined ? `Built in ${Math.round(buildMs)} ms` : ""}
        </span>
        {error && <p className="ui-error">{error}</p>}
      </div>

      <div className="relative mt-4 h-[26rem] overflow-hidden rounded-[3px] border border-rule bg-paper sm:h-[30rem]">
        {!mesh && (
          <p className="ui-hint absolute inset-0 flex items-center justify-center">
            {!firstWord.trim() || !secondWord.trim() ? "Type two words to build the model" : "Building the model…"}
          </p>
        )}
        <Canvas camera={{ position: [2, 6, 25], fov: 50 }}>
          {geometry && (
            // Re-frame only when the model's size changes (e.g. a longer word),
            // so live rebuilds don't yank the camera while you're orbiting.
            <Bounds key={frameKey} fit clip observe margin={1.2}>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="#e8e2d6" flatShading />
              </mesh>
            </Bounds>
          )}
          <OrbitControls makeDefault />
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 5, 0]} intensity={1} />
          <directionalLight position={[-5, 5, 0]} intensity={1} />
          <directionalLight position={[0, 5, 5]} intensity={1} />
          <directionalLight position={[0, 5, -5]} intensity={1} />
        </Canvas>
      </div>
      <p className="ui-hint pt-2">Drag to orbit, scroll to zoom.</p>
    </div>
  );
}
