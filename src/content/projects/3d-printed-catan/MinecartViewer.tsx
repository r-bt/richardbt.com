import ModelViewer from "@/components/ModelViewer";
import Minecart from "./Minecart";

export default function MinecartViewer() {
  return (
    <ModelViewer cameraPosition={[-6, 6, 10]} intensity={1} alt="Minecart">
      <Minecart position={[0, 0, 0]} />
    </ModelViewer>
  );
}
