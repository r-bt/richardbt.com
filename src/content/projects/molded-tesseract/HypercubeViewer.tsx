import ModelViewer from "@/components/ModelViewer";
import { Model } from "./Hypercube";

export default function HypercubeViewer() {
  return (
    <ModelViewer cameraPosition={[30, 50, 100]} intensity={1}>
      <Model position={[0, 0, 0]} />
    </ModelViewer>
  );
}
