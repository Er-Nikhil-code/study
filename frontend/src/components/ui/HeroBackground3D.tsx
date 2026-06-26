"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Environment } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

function AnimatedGridAndBeam() {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // Smooth mouse tracking
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Track mouse
    mouseTarget.current.x = (state.pointer.x * Math.PI) / 10;
    mouseTarget.current.y = (state.pointer.y * Math.PI) / 10;

    // Interpolate
    mouseCurrent.current.x = THREE.MathUtils.lerp(
      mouseCurrent.current.x,
      mouseTarget.current.x,
      delta * 2
    );
    mouseCurrent.current.y = THREE.MathUtils.lerp(
      mouseCurrent.current.y,
      mouseTarget.current.y,
      delta * 2
    );

    if (groupRef.current) {
      // Parallax effect based on mouse
      groupRef.current.rotation.x = -mouseCurrent.current.y * 0.5 + 0.2;
      groupRef.current.rotation.y = mouseCurrent.current.x * 0.5;
    }

    if (beamRef.current) {
      // Subtle pulsing for the beam
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9;
      beamRef.current.scale.set(pulse, 1, 1);
      
      // Make the material emissive intensity pulse
      if (beamRef.current.material instanceof THREE.MeshStandardMaterial) {
        beamRef.current.material.emissiveIntensity = pulse * 12;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Grid */}
      <Grid
        position={[0, -2, -5]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={1}
        cellColor="#333333"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#555555"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      <Grid
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -10]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={1}
        cellColor="#333333"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#555555"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      {/* The glowing vertical beam */}
      <mesh ref={beamRef} position={[0, 0, -8]}>
        <planeGeometry args={[1.5, 30]} />
        <meshStandardMaterial
          color="#ff4e00"
          emissive="#ff2000"
          emissiveIntensity={10}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Ambient glow behind the beam */}
      <mesh position={[0, 0, -8.1]}>
        <planeGeometry args={[8, 30]} />
        <meshBasicMaterial
          color="#ff4e00"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function HeroBackground3D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#09090b] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.5} />
        <AnimatedGridAndBeam />
        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            mipmapBlur
            intensity={2.5}
            radius={0.8}
          />
        </EffectComposer>
        <Environment preset="city" />
      </Canvas>
      {/* Overlay gradient to fade bottom into black */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/80 z-10" />
    </div>
  );
}
