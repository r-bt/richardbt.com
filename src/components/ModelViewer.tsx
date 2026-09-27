import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function ModelViewer({
  children,
  cameraPosition,
  intensity = 1,
  alt,
}: {
  children: React.ReactNode;
  cameraPosition: [number, number, number];
  intensity: number;
  alt?: string;
}) {
  return (
    <figure className="m-0">
      <div className="panel h-[22rem] overflow-hidden sm:h-[30rem]">
        <Canvas camera={{ position: cameraPosition, fov: 60, near: 0.1, far: 2000 }}>
          <ambientLight intensity={intensity} />
          <directionalLight intensity={intensity} position={[5, 5, 5]} />
          <directionalLight intensity={intensity} position={[-5, -5, -5]} />
          <pointLight intensity={intensity * 1.5} position={[-5, -5, -5]} />
          <spotLight
            intensity={intensity * 2}
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
          />
          {children}
          <OrbitControls />
        </Canvas>
      </div>
      <figcaption className="caption">{alt ?? "Interactive model · drag to orbit, scroll to zoom"}</figcaption>
    </figure>
  );
}
