import { lazy, Suspense } from "react";

// The generator uses a Web Worker, WASM and three.js, none of which can run
// when Astro evaluates modules on the server (it does so even for client:only
// components). Importing it lazily keeps all of that browser-only.
const IllusionGenerator = lazy(() => import("./IllusionGenerator"));

export default function NameplateGenerator() {
  return (
    <Suspense fallback={<div className="panel ui-hint p-5">Loading generator…</div>}>
      <IllusionGenerator />
    </Suspense>
  );
}
