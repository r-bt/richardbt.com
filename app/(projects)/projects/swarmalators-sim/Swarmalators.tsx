"use client";
import { useState, useCallback, useEffect } from "react";
import Canvas from "@/components/Canvas";
import init, { Swarmalator } from "wasm-swarmalators";
import { mapRange, HSVtoCanvasFillStyle } from "./utils";
import CircularButton from "@/components/CircularButton";

const getChiralCoefficients = (agents: number) => {
  const coeffs = Array.from({ length: agents }, (_, i) =>
    i < agents / 2 ? 1 : -1
  );
  return new Float64Array(coeffs);
};

const getNaturalFrequencies = (agents: number, type: number) => {
  let freqs: number[] = [];

  switch (type) {
    case 0:
      // All 0
      freqs = Array.from({ length: agents }, () => 0);
      break;
    case 1:
      // All 1
      freqs = Array.from({ length: agents }, () => 1);
      break;
    case 2:
      // All -1
      freqs = Array.from({ length: agents }, () => -1);
      break;
    case 3:
      // Random
      freqs = Array.from({ length: agents }, () => Math.random() * 2 - 1);
      break;
    case 4:
      // Half 1, half -1
      freqs = Array.from({ length: agents }, (_, i) =>
        i < agents / 2 ? 1 : -1
      );
      break;
  }

  return new Float64Array(freqs);
};

const getPhases = (agents: number, type: number) => {
  let phases: number[] = [];

  switch (type) {
    case 0:
      // Random
      phases = Array.from(
        { length: agents },
        () => Math.random() * 2 * Math.PI
      );
      break;
    case 1:
      // Linearly spaced
      phases = Array.from(
        { length: agents },
        (_, i) => (i / agents) * 2 * Math.PI
      );
      break;
  }

  return new Float64Array(phases);
};

interface SwarmalatorSettings {
  agents: number;
  dT: number;
  K: number;
  J: number;
  chiral: boolean;
  natural_frequencies_type: number;
  phases_type: number;
}

interface Presets {
  [key: string]: Partial<SwarmalatorSettings>; // Adjust this to match the shape of your settings
}

const presets: Presets = {
  "bouncing-clusters": {
    K: 1,
    J: 1,
    chiral: false,
    natural_frequencies_type: 4,
  },
  "rainbow-circle": {
    K: 0,
    J: 1,
    chiral: false,
    natural_frequencies_type: 1,
    phases_type: 1,
  },
  "radial-oscillation": {
    K: 1,
    J: -1,
    chiral: false,
    natural_frequencies_type: 4,
    phases_type: 0,
  },
  dizzy: {
    dT: 0.05,
    K: 1,
    J: 0.25,
    chiral: false,
    natural_frequencies_type: 3,
    phases_type: 0,
  },
  swimming: {
    K: 0,
    J: 1,
    chiral: false,
    natural_frequencies_type: 4,
    phases_type: 1,
  },
  "revolving-clusters": {
    K: 1,
    J: 1,
    chiral: true,
    natural_frequencies_type: 4,
    phases_type: 0,
  },
  "overlapping-circles": {
    K: 0,
    J: 1,
    chiral: true,
    natural_frequencies_type: 4,
    phases_type: 0,
  },
};

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
  const [swarmalatorSettings, setSwarmalatorSettings] =
    useState<SwarmalatorSettings>({
      agents: 50,
      dT: 0.025,
      K: 1,
      J: 1,
      chiral: false,
      natural_frequencies_type: 4,
      phases_type: 0,
    });

  // Initalize the swarmalator model
  useEffect(() => {
    init().then(({ memory }) => {
      setMemory(memory);

      const agent_positions = Array.from(
        { length: swarmalatorSettings.agents },
        () => [Math.random() * 6 - 3, Math.random() * 6 - 3]
      );

      const target = [2, 0];

      const float64_positions = new Float64Array(agent_positions.flat());
      const float64_phases = getPhases(
        swarmalatorSettings.agents,
        swarmalatorSettings.phases_type
      );
      const float64_natural_frequencies = getNaturalFrequencies(
        swarmalatorSettings.agents,
        swarmalatorSettings.natural_frequencies_type
      );
      const float64_chiral_coefficients = getChiralCoefficients(
        swarmalatorSettings.agents
      );
      const float64_target = new Float64Array(target);

      const swarm = new Swarmalator(
        swarmalatorSettings.agents,
        float64_positions,
        float64_phases,
        float64_natural_frequencies,
        swarmalatorSettings.K,
        swarmalatorSettings.J,
        swarmalatorSettings.chiral ? float64_chiral_coefficients : undefined,
        undefined
      );

      setSwarmalator(swarm);
    });
    // @eslint-ignore-next-line
  }, [swarmalatorSettings.agents]);

  useEffect(() => {
    if (swarmalator) {
      swarmalator.set_K(swarmalatorSettings.K);
    }
  }, [swarmalatorSettings.K, swarmalator]);

  useEffect(() => {
    if (swarmalator) {
      swarmalator.set_J(swarmalatorSettings.J);
    }
  }, [swarmalatorSettings.J, swarmalator]);

  useEffect(() => {
    if (swarmalator) {
      if (swarmalatorSettings.chiral) {
        swarmalator.set_chiral(
          getChiralCoefficients(swarmalatorSettings.agents)
        );
      } else {
        swarmalator.set_chiral(undefined);
      }
    }
  }, [swarmalatorSettings.chiral, swarmalator]);

  useEffect(() => {
    if (swarmalator) {
      swarmalator.set_natural_frequencies(
        getNaturalFrequencies(
          swarmalatorSettings.agents,
          swarmalatorSettings.natural_frequencies_type
        )
      );
    }
  }, [swarmalator, swarmalatorSettings.natural_frequencies_type]);

  useEffect(() => {
    if (swarmalator) {
      swarmalator.set_phases(
        getPhases(swarmalatorSettings.agents, swarmalatorSettings.phases_type)
      );
    }
  }, [swarmalator, swarmalatorSettings.phases_type]);

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

    try {
      const positionsPtr = swarmalator.positions();
      const positions = new Float64Array(
        memory.buffer,
        positionsPtr,
        agents * 2
      );
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
    } catch (e) {
      return;
    }
  }, [ctx, canvasSize, swarmalator, memory, swarmalatorSettings]);

  const setPreset = (preset: keyof Presets) => {
    console.log(preset);

    // Only change the settings if not already set
    setSwarmalatorSettings({
      ...swarmalatorSettings,
      ...presets[preset],
    });
  };

  return (
    <div>
      <div className="border-2">
        <Canvas
          draw={draw}
          establishContext={establishContext}
          establishSize={establishSize}
        />
      </div>
      <div className="pt-4 flex flex-col md:flex-row">
        <div className="flex-1">
          <h3 className="text-lg text-slate-500 pb-4">Simulation Settings</h3>
          <div className="pb-2">
            <label htmlFor="agents-range" className="">
              Agents: {swarmalatorSettings.agents}
            </label>
            <input
              id="agents-range"
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
            <label htmlFor="dT-range" className="">
              Speed: {swarmalatorSettings.dT}
            </label>
            <input
              id="dT-range"
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
          <div className="pb-2">
            <label htmlFor="K-range" className="">
              Phase synchronization strength (K): {swarmalatorSettings.K}
            </label>
            <input
              id="K-range"
              type="range"
              value={swarmalatorSettings.K}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  K: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              min={-1}
              max={1}
              step={0.1}
            />
          </div>
          <div className="pb-2">
            <label htmlFor="J-range" className="">
              Like attracts like strength (J): {swarmalatorSettings.J}
            </label>
            <input
              id="J-range"
              type="range"
              value={swarmalatorSettings.J}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  J: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              min={-1}
              max={1}
              step={0.1}
            />
          </div>
          <div className="pb-2">
            <label htmlFor="natural-frequencies-options">Phases:</label>
            <select
              id="natural-frequencies-options"
              className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 p-2"
              value={swarmalatorSettings.phases_type}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  phases_type: parseInt(e.target.value),
                })
              }
            >
              <option value="0">Random</option>
              <option value="1">Linearly Spaced</option>
            </select>
          </div>
          <div className="pb-2">
            <label htmlFor="natural-frequencies-options">
              Natural frequencies:
            </label>
            <select
              id="natural-frequencies-options"
              className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 p-2"
              value={swarmalatorSettings.natural_frequencies_type}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  natural_frequencies_type: parseInt(e.target.value),
                })
              }
            >
              <option value="0">All 0</option>
              <option value="1">All 1</option>
              <option value="2">All -1</option>
              <option value="3">Random</option>
              <option value="4">Half 1, half -1</option>
            </select>
          </div>
          <div className="pb-2">
            <label htmlFor="chiral-checkbox">Chiral: </label>
            <input
              id="chiral-checkbox"
              type="checkbox"
              className="w-4 h-4"
              checked={swarmalatorSettings.chiral}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  chiral: e.target.checked,
                })
              }
            />
          </div>
        </div>
        <div className="flex-1 md:pl-2">
          <h3 className="text-lg text-slate-500 pb-4">Simulation Presets</h3>
          <CircularButton
            text={"Bouncing Clusters"}
            onClick={() => {
              setPreset("bouncing-clusters");
            }}
          />
          <CircularButton
            text={"Rainbow Circle"}
            onClick={() => {
              setPreset("rainbow-circle");
            }}
          />
          <CircularButton
            text={"Radial Oscillation"}
            onClick={() => {
              setPreset("radial-oscillation");
            }}
          />
          <CircularButton
            text={"Dizzy"}
            onClick={() => {
              setPreset("dizzy");
            }}
          />
          <CircularButton
            text={"Swimming"}
            onClick={() => {
              setPreset("swimming");
            }}
          />
          <CircularButton
            text={"Revolving Clusters"}
            onClick={() => {
              setPreset("revolving-clusters");
            }}
          />
          <CircularButton
            text={"Overlapping Circles"}
            onClick={() => {
              setPreset("overlapping-circles");
            }}
          />
        </div>
      </div>
    </div>
  );
}
