"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, ContactShadows, useCursor, Text } from "@react-three/drei";
import * as THREE from "three";

interface ChessPieceProps {
  role: string;
  progressPct?: number;
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

const WarriorPiece = ({ progressPct }: { progressPct?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useCursor(hovered);

  const spinVelocity = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Continuous slow rotation like the other pieces, but we control it here
      // so it can be sped up by interaction
      if (!clicked && spinVelocity.current < 0.1) {
         groupRef.current.rotation.y += 0.01;
      }

      // Bouncy scale on hover
      const targetScale = hovered ? 1.1 : 1;
      groupRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as THREE.Vector3, 0.15);
      
      // Playful bounce & wobble on hover
      if (hovered && spinVelocity.current < 0.1) {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.05;
      } else {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      }
      
      // Wild spin on click with gentle decay
      if (clicked) {
        spinVelocity.current = 20; // Powerful initial spin
        setClicked(false);
      }
      
      if (spinVelocity.current > 0.1) {
        groupRef.current.rotation.y += spinVelocity.current * delta;
        spinVelocity.current *= 0.95; // Smoothly and gently drop the speed
      }
    }
  });

  return (
    <group 
      ref={groupRef}
      position={[0, 0.5, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); setClicked(true); }}
    >
      {/* Shield (Center) */}
      <mesh material={pieceMaterial} position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.2, 32]} />
      </mesh>
      
      {/* Percentage Text on the Shield Boss */}
      {progressPct !== undefined ? (
        <Text
          position={[0, 0, 0.45]}
          fontSize={0.65}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
          fontWeight="bold"
        >
          {`${progressPct}%`}
        </Text>
      ) : (
        <mesh material={pieceMaterial} position={[0, 0, 0.45]}>
          <sphereGeometry args={[0.3, 16, 16]} />
        </mesh>
      )}
      
      {/* Sword 1 (backslash) */}
      <group position={[0, 0, -0.1]} rotation={[0, 0, -Math.PI / 4]}>
        <mesh material={pieceMaterial} position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 3, 0.05]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.2, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.1]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.5]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.8, 0]}>
          <sphereGeometry args={[0.15]} />
        </mesh>
      </group>

      {/* Sword 2 (forward slash) */}
      <group position={[0, 0, -0.2]} rotation={[0, 0, Math.PI / 4]}>
        <mesh material={pieceMaterial} position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 3, 0.05]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.2, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.1]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.5]} />
        </mesh>
        <mesh material={pieceMaterial} position={[0, -1.8, 0]}>
          <sphereGeometry args={[0.15]} />
        </mesh>
      </group>
    </group>
  );
};

const AnimatedPiece = ({ role, progressPct }: { role: string, progressPct?: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Only spin non-student pieces globally so we don't interfere with WarriorPiece's own spin logic
      if (role !== "STUDENT") {
        groupRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {role === "INTERN" ? <Pawn /> : null}
      {role === "STUDENT" ? <WarriorPiece progressPct={progressPct} /> : null}
      {role === "TEACHER" ? <Knight /> : null}
      {role === "ADMIN" ? <King /> : null}
    </group>
  );
};

export default function ChessPiece3D({ role, progressPct }: ChessPieceProps) {
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
