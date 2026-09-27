import ModelViewer from "@/components/ModelViewer";
import { Model } from "./PirateShip";

export default function PirateShipViewer() {
  return (
    <ModelViewer cameraPosition={[0, 500, 1000]} intensity={1}>
      <Model position={[150, -100, 0]} />
    </ModelViewer>
  );
}
