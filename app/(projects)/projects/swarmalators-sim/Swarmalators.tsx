"use client";
import { useState, useCallback, useEffect } from "react";
import Canvas from "@/components/Canvas";
import init, { Swarmalator } from "wasm-swarmalators";
import { mapRange, HSVtoCanvasFillStyle } from "./utils";

export default function Swarmalators() {
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [swarmalator, setSwarmalator] = useState<Swarmalator | null>(null);
  const [memory, setMemory] = useState<WebAssembly.Memory | null>(null);
  const [swarmalatorSettings, setSwarmalatorSettings] = useState<{
    agents: number;
    dT: number;
    K: number;
    J: number;
  }>({
    agents: 50,
    dT: 0.025,
    K: 0.5,
    J: 0,
  });

  // Initalize the swarmalator model
  useEffect(() => {
    init().then(({ memory }) => {
      const { agents, K, J } = swarmalatorSettings;

      setMemory(memory);

      const agent_positions = Array.from({ length: agents }, () => [
        Math.random() * 6 - 3,
        Math.random() * 6 - 3,
      ]);
      const agent_phases = Array.from(
        { length: agents },
        (_, i) => Math.random() * 2 * Math.PI
      );

      // Half 1, half -1
      const natural_frequencies = Array.from({ length: agents }, (_, i) =>
        i < agents / 2 ? 1 : -1
      );

      const chiral_coefficients = Array.from({ length: agents }, (_, i) =>
        i < agents / 2 ? 1 : -1
      );
      const target = [2, 0];

      const float64_positions = new Float64Array(agent_positions.flat());
      const float64_phases = new Float64Array(agent_phases);
      const float64_natural_frequencies = new Float64Array(natural_frequencies);
      const float64_chiral_coefficients = new Float64Array(chiral_coefficients);
      const float64_target = new Float64Array(target);

      const swarm = new Swarmalator(
        agents,
        float64_positions,
        float64_phases,
        float64_natural_frequencies,
        K,
        J,
        float64_chiral_coefficients,
        undefined
      );

      setSwarmalator(swarm);
    });
  }, [swarmalatorSettings]);

  const establishContext = useCallback((context: CanvasRenderingContext2D) => {
    setCtx(context);
  }, []);

  const establishSize = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);

  const draw = useCallback(() => {
    if (!ctx || !swarmalator || !memory) return;

    const { agents, dT } = swarmalatorSettings;

    swarmalator.update(dT);
    const positionsPtr = swarmalator.positions();
    const positions = new Float64Array(memory.buffer, positionsPtr, agents * 2);
    const phasesPtr = swarmalator.phases();
    const phases = new Float64Array(memory.buffer, phasesPtr, agents);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const { devicePixelRatio: ratio = 1 } = window;

    for (let i = 0; i < agents; i++) {
      const x = mapRange(
        positions[i * 2],
        -3,
        3,
        (0.1 * canvasSize.width) / ratio,
        (0.9 * canvasSize.width) / ratio
      );
      const y = mapRange(
        positions[i * 2 + 1],
        -3,
        3,
        (0.9 * canvasSize.height) / ratio,
        (0.1 * canvasSize.height) / ratio
      );

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      const phase = phases[i];
      ctx.fillStyle = HSVtoCanvasFillStyle(phase);
      ctx.fill();
    }
  }, [ctx, canvasSize, swarmalator, memory, swarmalatorSettings]);

  const [input, setInput] = useState<string>("");

  return (
    <div>
      <div className="border-2">
        <Canvas
          draw={draw}
          establishContext={establishContext}
          establishSize={establishSize}
        />
      </div>
      <div className="pt-4">
        <div className="pb-2">
          <label htmlFor="default-range" className="">
            Agents: {swarmalatorSettings.agents}
          </label>
          <input
            id="default-range"
            type="range"
            value={swarmalatorSettings.agents}
            onChange={(e) =>
              setSwarmalatorSettings({
                ...swarmalatorSettings,
                agents: parseInt(e.target.value),
              })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            min={1}
            max={1000}
          />
        </div>
        <div className="pb-2">
          <label htmlFor="default-range" className="">
            dT: {swarmalatorSettings.dT}
          </label>
          <input
            id="default-range"
            type="range"
            value={swarmalatorSettings.dT}
            onChange={(e) =>
              setSwarmalatorSettings({
                ...swarmalatorSettings,
                dT: parseFloat(e.target.value),
              })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            min={0.005}
            max={0.1}
            step={0.005}
          />
        </div>
      </div>
    </div>
  );
}
