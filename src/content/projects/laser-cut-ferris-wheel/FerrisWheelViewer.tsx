import ModelViewer from "@/components/ModelViewer";
import { Model } from "./FerrisWheel";

export default function FerrisWheelViewer() {
  return (
    <ModelViewer cameraPosition={[150, 120, 480]} intensity={1.6}>
      {/* The GLB is in metres; scale to millimetres to match the viewer's camera range. */}
      <Model scale={1000} position={[0, -235, 0]} />
    </ModelViewer>
  );
}
