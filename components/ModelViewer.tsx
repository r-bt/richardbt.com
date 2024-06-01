"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function ModelViewer({
  children,
  cameraPosition,
}: {
  children: React.ReactNode;
  cameraPosition: [number, number, number];
}) {
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 60, near: 0.1, far: 2000 }}
      style={{
        backgroundColor: "white",
        width: "100%",
        height: "500px",
      }}
    >
      <ambientLight intensity={1.25} />
      <ambientLight intensity={0.1} />
      <directionalLight intensity={0.4} />
      {children}
      <OrbitControls />
    </Canvas>
  );
}
