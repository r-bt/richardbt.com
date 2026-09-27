import { lazy, Suspense } from "react";

// The generator and its 3D dependencies (jscad, three, opentype) include
// CommonJS packages that crash when Astro evaluates them on the server, even
// for client:only components. Importing them lazily keeps them browser-only.
const IllusionGenerator = lazy(() => import("./IllusionGenerator"));

export default function NameplateGenerator() {
  return (
    <Suspense fallback={<div className="panel ui-hint p-5">Loading generator…</div>}>
      <IllusionGenerator />
    </Suspense>
  );
}
