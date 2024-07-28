"use client";

import { useEffect, useState, useRef } from "react";
import { generateIllusion, getFonts } from "./generator";
import { JSCadThreeMesh, Custom } from "jscad-fiber";
import { Geom3 } from "@jscad/modeling/src/geometries/types";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Input from "@/components/Input";
import { Slider } from "@/components/ui/slider";
const { serialize } = require("@jscad/3mf-serializer");

export default function IllusionGenerator() {
  const [solids, setSolids] = useState<Geom3>();
  const [fonts, setFonts] = useState<any[]>([]);

  const [firstWord, setFirstWord] = useState<string>("BUSY");
  const [secondWord, setSecondWord] = useState<string>("FREE");
  const [selectedFont, setSelectedFont] = useState<number>(0);
  const [selectedFontVariant, setSelectedFontVariant] = useState<number>(0);
  const [padding, setPadding] = useState<number>(2.5);
  const [fillet, setFillet] = useState<number>(50);

  const [stlURL, setStlURL] = useState<string | undefined>();

  useEffect(() => {
    getFonts().then((fonts) => {
      setFonts(fonts.items);
    });
  }, []);

  const generateModel = () => {
    const variant = fonts[selectedFont].variants[selectedFontVariant];

    const fontUrl = fonts[selectedFont].files[variant];

    generateIllusion(fontUrl, firstWord, secondWord, padding, fillet).then(
      (illusion) => {
        setSolids(illusion);

        // Convert to STL
        const rawData = serialize({ unit: "meter" }, illusion);
        const blob = new Blob(rawData);
        const url = URL.createObjectURL(blob);
        setStlURL(url);
      }
    );
  };

  const handleFirstWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstWord(e.target.value);
  };

  const handleSecondWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondWord(e.target.value);
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontIndex = parseInt(e.target.value);

    setSelectedFont(fontIndex);

    let defaultVariant = fonts[fontIndex].variants.indexOf("regular");

    if (defaultVariant == -1) defaultVariant = 0;

    setSelectedFontVariant(defaultVariant);
  };

  const handleFontVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFontVariant(parseInt(e.target.value));
  };

  return (
    <div>
      <div>
        <p className="pb-4">
          Create a dual-text illusion, ready to be 3D printed!
        </p>
        <p className="pb-4">
          Note if both words aren&apos;t the same length, the longer word will
          be truncated. Also, if you use lowercase letters, results may be
          strange due to differing letter heights.
        </p>
        <div className="flex gap-4 flex-col md:flex-row pb-4">
          <div className="flex-1">
            <label className="text-slate-600 text-sm">First word:</label>
            <Input value={firstWord} onChange={handleFirstWordChange} />
          </div>
          <div className="flex-1">
            <label className="text-slate-600 text-sm">Second word:</label>
            <Input value={secondWord} onChange={handleSecondWordChange} />
          </div>
        </div>
        <div className="flex gap-4 flex-col md:flex-row pb-4">
          <div className="flex-1">
            <label className="text-slate-600 text-sm">Font:</label>
            <select
              className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 p-2"
              onChange={handleFontChange}
              value={selectedFont}
            >
              {fonts.map((font, index) => (
                <option key={font.family} value={index}>
                  {font.family}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-slate-600 text-sm">Font variant:</label>
            <select
              className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 p-2"
              onChange={handleFontVariantChange}
              value={selectedFontVariant}
            >
              {fonts.length > 0 &&
                fonts[selectedFont].variants.map(
                  (variant: string, index: number) => (
                    <option key={variant} value={index}>
                      {variant}
                    </option>
                  )
                )}
            </select>
          </div>
        </div>
        <div className="flex gap-4 flex-col md:flex-row pb-8">
          <div className="flex-1">
            <label className="text-slate-600 text-sm">
              Base padding: {padding}
            </label>
            <div className="pt-2">
              <Slider
                defaultValue={[2.0]}
                max={10.0}
                step={0.1}
                value={[padding]}
                onValueChange={(value) => setPadding(value[0])}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-slate-600 text-sm">
              Base fillet: {fillet}%
            </label>
            <div className="pt-2">
              <Slider
                defaultValue={[2.0]}
                max={100}
                step={1}
                value={[fillet]}
                onValueChange={(value) => setFillet(value[0])}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4 flex-col md:flex-row pb-4 items-center">
          <div className="flex-1 self-stretch">
            <button
              className="bg-violet-500 text-white px-4 py-2 rounded-md hover:bg-violet-600 focus:bg-violet-600 active:bg-violet-700 transition duration-150 ease-in-out mr-4"
              onClick={generateModel}
            >
              Generate
            </button>
          </div>
          <div className="flex-1 self-stretch flex items-center">
            {stlURL && (
              <a
                className=" bg-violet-500 text-white px-4 py-2 rounded-md hover:bg-violet-600 focus:bg-violet-600 active:bg-violet-700 transition duration-150 ease-in-out mr-4 flex-shrink-0"
                href={stlURL}
                download="illusion.3mf"
              >
                Download 3MF
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-dvh border border-gray-300 mt-4">
        <Canvas camera={{ position: [2, 6, 25], fov: 50 }}>
          {solids && (
            <JSCadThreeMesh>
              <Custom geometry={solids} />
            </JSCadThreeMesh>
          )}
          <OrbitControls />
          <directionalLight
            position={[5, 5, 0]} // East
            intensity={1}
            castShadow
          />
          <directionalLight
            position={[-5, 5, 0]} // West
            intensity={1}
            castShadow
          />
          <directionalLight
            position={[0, 5, 5]} // North
            intensity={1}
            castShadow
          />
          <directionalLight
            position={[0, 5, -5]} // South
            intensity={1}
            castShadow
          />
        </Canvas>
      </div>
    </div>
  );
}
