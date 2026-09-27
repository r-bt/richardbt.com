import { useState, useCallback, useEffect } from "react";
import Canvas from "@/components/Canvas";
import init, { Swarmalator } from "wasm-swarmalators";
import { mapRange, HSVtoCanvasFillStyle } from "./utils";

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
    // Only change the settings if not already set
    setSwarmalatorSettings({
      ...swarmalatorSettings,
      ...presets[preset],
    });
  };

  const ranges: {
    key: "agents" | "dT" | "K" | "J";
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: "agents", label: "Agents", min: 1, max: 1000, step: 1 },
    { key: "dT", label: "Speed", min: 0.005, max: 0.1, step: 0.005 },
    { key: "K", label: "Phase coupling (K)", min: -1, max: 1, step: 0.1 },
    { key: "J", label: "Like attracts like (J)", min: -1, max: 1, step: 0.1 },
  ];

  const presetButtons: [keyof Presets, string][] = [
    ["bouncing-clusters", "Bouncing clusters"],
    ["rainbow-circle", "Rainbow circle"],
    ["radial-oscillation", "Radial oscillation"],
    ["dizzy", "Dizzy"],
    ["swimming", "Swimming"],
    ["revolving-clusters", "Revolving clusters"],
    ["overlapping-circles", "Overlapping circles"]
  ];

  return (
    <div className="panel p-3 sm:p-4">
      <div className="overflow-hidden rounded-[3px]">
        <Canvas
          draw={draw}
          establishContext={establishContext}
          establishSize={establishSize}
        />
      </div>

      <div className="pt-4">
        <span className="ui-label">Presets</span>
        <div className="flex flex-wrap gap-2">
          {presetButtons.map(([key, label]) => (
            <button key={key} type="button" className="ui-button" onClick={() => setPreset(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-3 pt-5 sm:grid-cols-2">
        {ranges.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <label htmlFor={`${key}-range`} className="ui-label">
              {label} · {swarmalatorSettings[key]}
            </label>
            <input
              id={`${key}-range`}
              type="range"
              value={swarmalatorSettings[key]}
              onChange={(e) =>
                setSwarmalatorSettings({
                  ...swarmalatorSettings,
                  [key]: key === "agents" ? parseInt(e.target.value) : parseFloat(e.target.value),
                })
              }
              className="w-full cursor-pointer accent-[var(--ink)]"
              min={min}
              max={max}
              step={step}
            />
          </div>
        ))}
        <div>
          <label htmlFor="phases-options" className="ui-label">
            Phases
          </label>
          <select
            id="phases-options"
            className="ui-select"
            value={swarmalatorSettings.phases_type}
            onChange={(e) =>
              setSwarmalatorSettings({
                ...swarmalatorSettings,
                phases_type: parseInt(e.target.value),
              })
            }
          >
            <option value="0">Random</option>
            <option value="1">Linearly spaced</option>
          </select>
        </div>
        <div>
          <label htmlFor="natural-frequencies-options" className="ui-label">
            Natural frequencies
          </label>
          <select
            id="natural-frequencies-options"
            className="ui-select"
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
        <label htmlFor="chiral-checkbox" className="ui-hint flex cursor-pointer items-center gap-2">
          <input
            id="chiral-checkbox"
            type="checkbox"
            className="accent-[var(--accent)]"
            checked={swarmalatorSettings.chiral}
            onChange={(e) =>
              setSwarmalatorSettings({
                ...swarmalatorSettings,
                chiral: e.target.checked,
              })
            }
          />
          Chiral
        </label>
      </div>
    </div>
  );
}
