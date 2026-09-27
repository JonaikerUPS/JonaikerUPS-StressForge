"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface LoaderCore3DProps {
  isDark?: boolean;
}

export default function LoaderCore3D({ isDark = true }: LoaderCore3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Master Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Quantum Micro-Core
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x06b6d4),
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // 2. Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      emissive: 0x10b981,
      emissiveIntensity: 0.7,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    masterGroup.add(cageMesh);

    // 3. 3 Orbital Glowing Ring Toruses (3D Atomic gyroscopic orbits)
    // Ring 1 (Cyan)
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    const ring1Wrapper = new THREE.Group();
    ring1Wrapper.add(ring1);
    ring1Wrapper.rotation.x = Math.PI / 3;
    masterGroup.add(ring1Wrapper);

    // Ring 2 (Fuchsia / Magenta)
    const ring2Geo = new THREE.TorusGeometry(2.15, 0.032, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    const ring2Wrapper = new THREE.Group();
    ring2Wrapper.add(ring2);
    ring2Wrapper.rotation.y = Math.PI / 3.5;
    ring2Wrapper.rotation.z = Math.PI / 6;
    masterGroup.add(ring2Wrapper);

    // Ring 3 (Emerald / Gold Accent)
    const ring3Geo = new THREE.TorusGeometry(2.45, 0.03, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    const ring3Wrapper = new THREE.Group();
    ring3Wrapper.add(ring3);
    ring3Wrapper.rotation.x = -Math.PI / 4;
    ring3Wrapper.rotation.y = Math.PI / 4;
    masterGroup.add(ring3Wrapper);

    // Orbiting Satellites on each ring
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const sat1 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
    sat1.position.set(1.85, 0, 0);
    ring1Wrapper.add(sat1);

    const sat2 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xfbcfe8 }));
    sat2.position.set(0, 2.15, 0);
    ring2Wrapper.add(sat2);

    const sat3 = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xa7f3d0 }));
    sat3.position.set(-2.45, 0, 0);
    ring3Wrapper.add(sat3);

    // 4. Micro Particle Cloud
    const particleCount = 280;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorA = new THREE.Color(0x38bdf8);
    const colorB = new THREE.Color(0xf472b6);
    const colorC = new THREE.Color(0x34d399);

    for (let i = 0; i < particleCount; i++) {
      const rad = 1.3 + Math.random() * 2.2;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = rad * Math.sin(ph) * Math.sin(th);
      positions[i * 3 + 2] = rad * Math.cos(ph);

      const picked = i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : colorC;
      colors[i * 3] = picked.r;
      colors[i * 3 + 1] = picked.g;
      colors[i * 3 + 2] = picked.b;
    }

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    partGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const partMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(partGeo, partMat);
    masterGroup.add(particles);

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.4);
    scene.add(ambLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 3, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const dirLight = new THREE.DirectionalLight(0x34d399, 1.8);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gyroscopic rotations
      masterGroup.rotation.y = t * 0.4;
      masterGroup.rotation.x = Math.sin(t * 0.3) * 0.2;

      ring1Wrapper.rotation.z += 0.025;
      ring2Wrapper.rotation.x += 0.03;
      ring3Wrapper.rotation.y += 0.02;

      cageMesh.rotation.y -= 0.015;
      cageMesh.rotation.x += 0.01;

      // Pulse Core
      const pulse = 1 + Math.sin(t * 4) * 0.06;
      coreMesh.scale.set(pulse, pulse, pulse);
      cageMesh.scale.set(pulse, pulse, pulse);

      particles.rotation.y = t * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none relative flex h-80 w-80 sm:h-96 sm:w-96 items-center justify-center"
    />
  );
}
