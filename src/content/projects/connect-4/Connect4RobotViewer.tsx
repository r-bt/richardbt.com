import ModelViewer from "@/components/ModelViewer";
import Connect4Robot from "./Connect4Robot";

export default function Connect4RobotViewer() {
  return (
    <ModelViewer cameraPosition={[3, 5, 20]} intensity={5} alt="Connect-4 Robot">
      <Connect4Robot position={[-3, 0, 0]} />
    </ModelViewer>
  );
}
