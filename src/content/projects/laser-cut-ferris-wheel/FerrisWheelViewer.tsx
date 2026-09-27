import ModelViewer from "@/components/ModelViewer";
import { Model } from "./FerrisWheel";

export default function FerrisWheelViewer() {
  return (
    <ModelViewer cameraPosition={[0, 200, 600]} intensity={1}>
      <Model position={[0, -200, 0]} />
    </ModelViewer>
  );
}
