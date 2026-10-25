import { useEffect, useRef, useState, type PointerEvent } from "react";

// Everything is in SVG units, at CM units per centimetre: the real breadboard
// layout and a 3 kHz wave (λ = 11.44 cm), just magnified and slowed down. Every
// mic is within λ/2 of the centre, so the phase differences aren't ambiguous.
const W = 600;
const SCENE_H = 340;
const ROW_H = 44;
const H = SCENE_H + 4 * ROW_H + 16;
const CX = W / 2;
const CY = SCENE_H / 2;
const CM = 15;
const ARRAY_R = 3 * CM;
const WAVELENGTH = 11.44 * CM;
const SPEED = 110; // units per second: slowed right down so the waves can be followed
const BINS = 16;

// Positions in cm from the report: (0, 0), (0, 3), (−3, −3) and (3, −3).
const MICS = [
  { name: "Centre", cx: 0, cy: 0, color: "var(--ink)" },
  { name: "A", cx: 0, cy: 3, color: "#e8590c" },
  { name: "B", cx: -3, cy: -3, color: "#2f6f9f" },
  { name: "C", cx: 3, cy: -3, color: "#4f8a2f" },
].map(({ cx, cy, ...m }) => ({ ...m, x: CX + cx * CM, y: CY - cy * CM }));

const wrap = (phi: number) => Math.atan2(Math.sin(phi), Math.cos(phi));
const deg = (rad: number) => Math.round((rad * 180) / Math.PI);

export default function LocalizationDemo() {
  const [source, setSource] = useState({ x: 120, y: 90 });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      setT((prev) => prev + (now - last) / 1000);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const moveTo = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    // Keep the source in the room and out of the array itself.
    let x = Math.min(W - 12, Math.max(12, p.x));
    let y = Math.min(SCENE_H - 12, Math.max(12, p.y));
    const d = Math.hypot(x - CX, y - CY);
    if (d < ARRAY_R * 2.2) {
      const k = (ARRAY_R * 2.2) / (d || 1);
      x = CX + (x - CX) * k;
      y = CY + (y - CY) * k;
    }
    setSource({ x, y });
  };

  // Phase of each mic relative to the centre: positive means the wave got there first.
  const dist = MICS.map((m) => Math.hypot(m.x - source.x, m.y - source.y));
  const phase = dist.map((d) => wrap((2 * Math.PI * (dist[0] - d)) / WAVELENGTH));

  // Same idea as the FPGA: weight each peripheral mic's position by its phase
  // difference, sum the vectors, and snap the result to one of 16 bins.
  let ex = 0;
  let ey = 0;
  MICS.slice(1).forEach((m, i) => {
    ex += ((m.x - CX) / ARRAY_R) * phase[i + 1];
    ey += ((m.y - CY) / ARRAY_R) * phase[i + 1];
  });
  const estAngle = Math.atan2(-ey, ex);
  const binWidth = (2 * Math.PI) / BINS;
  const bin = ((Math.round(estAngle / binWidth) % BINS) + BINS) % BINS;
  const binAngle = bin * binWidth;
  const trueAngle = (Math.atan2(-(source.y - CY), source.x - CX) + 2 * Math.PI) % (2 * Math.PI);

  const front = (SPEED * t) % WAVELENGTH;
  const rings = Array.from({ length: 5 }, (_, k) => front + k * WAVELENGTH);
  const maxR = 5 * WAVELENGTH;

  const wedge = (a: number, r: number) => {
    const p = (b: number) => `${CX + r * Math.cos(b)},${CY - r * Math.sin(b)}`;
    return `M${CX},${CY} L${p(a - binWidth / 2)} A${r},${r} 0 0 0 ${p(a + binWidth / 2)} Z`;
  };

  // Each trace shows the last two periods of what that mic hears, newest on the right.
  const traceX0 = 118;
  const traceW = W - traceX0 - 16;
  const traceSpan = (2 * WAVELENGTH) / SPEED;
  const trace = (d: number, row: number) => {
    const mid = SCENE_H + 12 + row * ROW_H + ROW_H / 2;
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const tau = t - traceSpan * (1 - i / 120);
      const y = Math.sin((2 * Math.PI * (SPEED * tau - d)) / WAVELENGTH);
      pts.push(`${(traceX0 + (traceW * i) / 120).toFixed(1)},${(mid - y * 14).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <figure className="m-0">
      <div className="panel overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full touch-none select-none"
          role="img"
          aria-label={`Sound source at ${deg(trueAngle)}°, estimated direction bin ${bin} at ${deg(binAngle)}°`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            moveTo(e);
          }}
          onPointerMove={(e) => dragging.current && moveTo(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <defs>
            <clipPath id="loc-scene">
              <rect width={W} height={SCENE_H} />
            </clipPath>
          </defs>

          <g clipPath="url(#loc-scene)" style={{ cursor: "crosshair" }}>
            <rect width={W} height={SCENE_H} fill="transparent" />
            {rings.map((r) => (
              <circle
                key={r - front}
                cx={source.x}
                cy={source.y}
                r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                opacity={0.55 * (1 - r / maxR)}
              />
            ))}

            {/* The 16 direction bins, with the chosen one filled in. */}
            {Array.from({ length: BINS }, (_, i) => (
              <path
                key={i}
                d={wedge(i * binWidth, ARRAY_R * 2)}
                fill={i === bin ? "var(--accent-soft)" : "none"}
                stroke="var(--rule)"
                strokeWidth={1}
              />
            ))}
            <line
              x1={CX}
              y1={CY}
              x2={CX + ARRAY_R * 2 * Math.cos(binAngle)}
              y2={CY - ARRAY_R * 2 * Math.sin(binAngle)}
              stroke="var(--accent-text)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {MICS.map((m) => (
              <g key={m.name}>
                <circle cx={m.x} cy={m.y} r={7} fill={m.color} stroke="var(--paper)" strokeWidth={2} />
                {m.name !== "Centre" && (
                  <text
                    x={CX + (m.x - CX) * 1.4}
                    y={CY + (m.y - CY) * 1.4 + 4}
                    textAnchor="middle"
                    fontFamily="var(--mono)"
                    fontSize={12}
                    fill={m.color}
                  >
                    {m.name}
                  </text>
                )}
              </g>
            ))}

            <g style={{ cursor: "grab" }}>
              <circle cx={source.x} cy={source.y} r={14} fill="var(--accent)" opacity={0.18} />
              <circle cx={source.x} cy={source.y} r={7} fill="var(--accent)" />
            </g>
          </g>

          <line x1={0} x2={W} y1={SCENE_H} y2={SCENE_H} stroke="var(--rule)" />
          {MICS.map((m, i) => {
            const mid = SCENE_H + 12 + i * ROW_H + ROW_H / 2;
            return (
              <g key={m.name} fontFamily="var(--mono)" fontSize={13}>
                <text x={16} y={mid - 3} fill={m.color}>
                  {m.name}
                </text>
                <text x={16} y={mid + 12} fill="var(--muted)">
                  {i === 0 ? "reference" : `Δφ ${phase[i] >= 0 ? "+" : ""}${deg(phase[i])}°`}
                </text>
                <line x1={traceX0} x2={traceX0 + traceW} y1={mid} y2={mid} stroke="var(--rule)" />
                <polyline points={trace(dist[i], i)} fill="none" stroke={m.color} strokeWidth={1.75} />
              </g>
            );
          })}
        </svg>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--rule)] px-3 py-2">
          <p className="ui-hint m-0">
            Drag the source · true {deg(trueAngle)}°, bin {bin} ({deg(binAngle)}°)
          </p>
          <button type="button" className="ui-button shrink-0" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>
      <figcaption className="caption">
        The real mic layout and a 3 kHz tone, magnified and slowed down. Mics nearer the source hear
        each wave first, so they lead the centre (Δφ &gt; 0); weighting each mic's position by its Δφ
        and summing points roughly back at the source
      </figcaption>
    </figure>
  );
}
