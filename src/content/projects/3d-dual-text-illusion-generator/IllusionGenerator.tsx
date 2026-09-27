import { useEffect, useState } from "react";

// The generator pulls in jscad-text, a CommonJS package that can't run during
// server rendering, so load it only in the browser.
const loadGenerator = () => import("./generator");
import { JSCadThreeMesh, Custom } from "jscad-fiber";
import type { Geom3 } from "@jscad/modeling/src/geometries/types";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Input from "@/components/Input";
import { Slider } from "@/components/ui/slider";
import { serialize } from "@jscad/3mf-serializer";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadGenerator()
      .then(({ getFonts }) => getFonts())
      .then((fonts) => setFonts(fonts.items))
      .catch((e) => {
        console.error(e);
        setError("Couldn't load the font list.");
      });
  }, []);

  const generateModel = () => {
    const variant = fonts[selectedFont].variants[selectedFontVariant];

    const fontUrl = fonts[selectedFont].files[variant];

    setBusy(true);
    setError(undefined);

    // Let the button repaint before the (blocking) CSG work starts.
    setTimeout(() => {
      loadGenerator()
        .then(({ generateIllusion }) =>
          generateIllusion(fontUrl, firstWord, secondWord, padding, fillet)
        )
        .then((illusion) => {
          setSolids(illusion);

          // Convert to 3MF
          const rawData = serialize({ unit: "meter" }, illusion);
          const blob = new Blob(rawData);
          if (stlURL) URL.revokeObjectURL(stlURL);
          setStlURL(URL.createObjectURL(blob));
        })
        .catch((e) => {
          console.error(e);
          setError("Couldn't build that one. Try another font or shorter words.");
        })
        .finally(() => setBusy(false));
    }, 30);
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
    <div className="panel p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ui-label" htmlFor="nameplate-first">
            First word
          </label>
          <Input id="nameplate-first" value={firstWord} onChange={handleFirstWordChange} />
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-second">
            Second word
          </label>
          <Input id="nameplate-second" value={secondWord} onChange={handleSecondWordChange} />
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-font">
            Font
          </label>
          <select
            id="nameplate-font"
            className="ui-select"
            onChange={handleFontChange}
            value={selectedFont}
            disabled={fonts.length === 0}
          >
            {fonts.length === 0 && <option>Loading fonts…</option>}
            {fonts.map((font, index) => (
              <option key={font.family} value={index}>
                {font.family}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ui-label" htmlFor="nameplate-variant">
            Variant
          </label>
          <select
            id="nameplate-variant"
            className="ui-select"
            onChange={handleFontVariantChange}
            value={selectedFontVariant}
            disabled={fonts.length === 0}
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
        <button
          className="ui-button ui-button--primary"
          onClick={generateModel}
          disabled={fonts.length === 0 || busy}
        >
          {busy ? "Generating…" : solids ? "Regenerate" : "Generate"}
        </button>
        {stlURL && (
          <a className="ui-button" href={stlURL} download="nameplate.3mf">
            Download 3MF
          </a>
        )}
        {error && <p className="ui-error">{error}</p>}
      </div>

      <div className="relative mt-4 h-[26rem] overflow-hidden rounded-[3px] border border-rule bg-paper sm:h-[30rem]">
        {!solids && (
          <p className="ui-hint absolute inset-0 flex items-center justify-center">
            {busy ? "Building the model…" : "Press generate to build the model"}
          </p>
        )}
        <Canvas camera={{ position: [2, 6, 25], fov: 50 }}>
          {solids && (
            <JSCadThreeMesh>
              <Custom geometry={solids} />
            </JSCadThreeMesh>
          )}
          <OrbitControls />
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
