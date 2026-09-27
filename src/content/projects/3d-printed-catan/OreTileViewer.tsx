import ModelViewer from "@/components/ModelViewer";
import OreTile from "./OreTile";

export default function OreTileViewer() {
  return (
    <ModelViewer cameraPosition={[0, 75, 75]} intensity={5} alt="Ore tile">
      <OreTile position={[0, 0, 0]} />
    </ModelViewer>
  );
}
