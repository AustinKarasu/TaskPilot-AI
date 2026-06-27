/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CivicParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const { positions, colors } = useMemo(() => {
    const count = 180;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#21D4FD"),
      new THREE.Color("#6366F1"),
      new THREE.Color("#10B981"),
      new THREE.Color("#F59E0B")
    ];

    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 4;
      positionArray[i * 3] = Math.cos(angle) * radius;
      positionArray[i * 3 + 1] = height;
      positionArray[i * 3 + 2] = Math.sin(angle) * radius - 2;

      const color = palette[i % palette.length];
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    return { positions: positionArray, colors: colorArray };
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = elapsed * 0.025;
      pointsRef.current.rotation.x = Math.sin(elapsed * 0.12) * 0.06;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = elapsed * 0.08;
      meshRef.current.rotation.y = elapsed * 0.11;
      meshRef.current.position.y = Math.sin(elapsed * 0.65) * 0.15;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.62}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <mesh ref={meshRef} position={[2.4, -0.2, -5]}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial
          color="#21D4FD"
          emissive="#0E7490"
          emissiveIntensity={0.25}
          roughness={0.38}
          metalness={0.42}
          transparent
          opacity={0.16}
          wireframe
        />
      </mesh>
    </>
  );
}

export default function CivicScene3D({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="civic-scene-3d" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 8], fov: 52 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={theme === "dark" ? 0.8 : 1.05} />
        <directionalLight position={[3, 4, 5]} intensity={theme === "dark" ? 1.15 : 0.8} />
        <CivicParticleField />
      </Canvas>
    </div>
  );
}
