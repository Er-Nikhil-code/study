"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

interface ChessPieceProps {
  role: string;
}

// Highly stylized glass/metallic material for the pieces
const pieceMaterial = new THREE.MeshPhysicalMaterial({
  color: "#ff3333", // Red tint
  metalness: 0.8,
  roughness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  transmission: 0.2, // slight glass effect
  ior: 1.5,
});

const Pawn = () => {
  return (
    <group position={[0, -1, 0]}>
      {/* Base */}
      <mesh material={pieceMaterial} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.4, 32]} />
      </mesh>
      {/* Body */}
      <mesh material={pieceMaterial} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.4, 0.7, 2, 32]} />
      </mesh>
      {/* Collar */}
      <mesh material={pieceMaterial} position={[0, 2.2, 0]}>
        <torusGeometry args={[0.45, 0.1, 16, 32]} />
      </mesh>
      {/* Head */}
      <mesh material={pieceMaterial} position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
      </mesh>
    </group>
  );
};

const Knight = () => {
  return (
    <group position={[0, -1.2, 0]}>
      {/* Base */}
      <mesh material={pieceMaterial} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.4, 32]} />
      </mesh>
      {/* Body/Neck */}
      <mesh material={pieceMaterial} position={[0, 1.3, -0.2]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1, 2, 1.2]} />
      </mesh>
      {/* Snout */}
      <mesh material={pieceMaterial} position={[0, 2.2, 0.4]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 1.2]} />
      </mesh>
      {/* Ears */}
      <mesh material={pieceMaterial} position={[-0.3, 2.8, -0.5]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.2, 0.6, 16]} />
      </mesh>
      <mesh material={pieceMaterial} position={[0.3, 2.8, -0.5]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.2, 0.6, 16]} />
      </mesh>
    </group>
  );
};

const King = () => {
  return (
    <group position={[0, -1.5, 0]}>
      {/* Base */}
      <mesh material={pieceMaterial} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1, 1.2, 0.4, 32]} />
      </mesh>
      <mesh material={pieceMaterial} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.9, 1, 0.2, 32]} />
      </mesh>
      {/* Body */}
      <mesh material={pieceMaterial} position={[0, 2, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 3, 32]} />
      </mesh>
      {/* Collar */}
      <mesh material={pieceMaterial} position={[0, 3.5, 0]}>
        <torusGeometry args={[0.6, 0.15, 16, 32]} />
      </mesh>
      {/* Crown base */}
      <mesh material={pieceMaterial} position={[0, 3.8, 0]}>
        <cylinderGeometry args={[0.7, 0.5, 0.5, 32]} />
      </mesh>
      {/* Cross */}
      <mesh material={pieceMaterial} position={[0, 4.4, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
      </mesh>
      <mesh material={pieceMaterial} position={[0, 4.4, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.2]} />
      </mesh>
    </group>
  );
};

const AnimatedPiece = ({ role }: { role: string }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += 0.01;
      // Gentle up and down movement handled by Float, but we can add secondary motion here if needed
    }
  });

  return (
    <group ref={groupRef}>
      {role === "INTERN" || role === "STUDENT" ? <Pawn /> : null}
      {role === "TEACHER" ? <Knight /> : null}
      {role === "ADMIN" ? <King /> : null}
    </group>
  );
};

export default function ChessPiece3D({ role }: ChessPieceProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#ff0000" />

        {/* Environment for shiny reflections */}
        <Environment preset="city" />

        {/* Floating Animation Wrapper */}
        <Float
          speed={2} // Animation speed
          rotationIntensity={0.2} // XYZ rotation intensity
          floatIntensity={1} // Up/down float intensity
          floatingRange={[-0.2, 0.2]} // Range of y-axis values
        >
          <AnimatedPiece role={role} />
        </Float>

        {/* Soft Shadow on the ground */}
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />

        {/* Controls - auto rotate disabled since we do it manually, but allow user to interact */}
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}
