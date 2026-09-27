"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface StressCore3DProps {
  scrollProgress: number; // 0 to 1
  isDark: boolean;
}

export default function StressCore3D({ scrollProgress, isDark }: StressCore3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const outerRingsRef = useRef<THREE.Group[]>([]);
  const hexGridRef = useRef<THREE.Group | null>(null);
  const pointLightCoreRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // MASTER CORE GROUP
    const masterCoreGroup = new THREE.Group();
    coreGroupRef.current = masterCoreGroup;
    scene.add(masterCoreGroup);

    // 1. CENTRAL GLOWING HYPER-SPHERE (REACTOR CORE)
    const coreGeo = new THREE.IcosahedronGeometry(1.3, 3);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x10b981),
      emissive: new THREE.Color(0x059669),
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterCoreGroup.add(coreMesh);

    // 2. INNER WIREFRAME HOLOGRAM CAGE
    const cageGeo = new THREE.IcosahedronGeometry(1.65, 2);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    masterCoreGroup.add(cageMesh);

    // 3. MULTI-AXIS ORBITAL TORUS RINGS (GYROSCOPE / ACCELERATOR)
    const ringsGroup: THREE.Group[] = [];

    // Ring 1 - Emerald Cyan
    const ring1Geo = new THREE.TorusGeometry(2.35, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    const ring1Wrapper = new THREE.Group();
    ring1Wrapper.add(ring1);
    ring1Wrapper.rotation.x = Math.PI / 4;
    masterCoreGroup.add(ring1Wrapper);
    ringsGroup.push(ring1Wrapper);

    // Ring 2 - Electric Cyan
    const ring2Geo = new THREE.TorusGeometry(2.8, 0.035, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    const ring2Wrapper = new THREE.Group();
    ring2Wrapper.add(ring2);
    ring2Wrapper.rotation.y = Math.PI / 3;
    masterCoreGroup.add(ring2Wrapper);
    ringsGroup.push(ring2Wrapper);

    // Ring 3 - Violet / Fuchsia High-Stress ring
    const ring3Geo = new THREE.TorusGeometry(3.3, 0.03, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xc026d3,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    const ring3Wrapper = new THREE.Group();
    ring3Wrapper.add(ring3);
    ring3Wrapper.rotation.z = Math.PI / 5;
    masterCoreGroup.add(ring3Wrapper);
    ringsGroup.push(ring3Wrapper);

    outerRingsRef.current = ringsGroup;

    // Small orbiting satellite nodes along rings
    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const nodeMat1 = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
    const nodeMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const nodeMat3 = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    const node1 = new THREE.Mesh(nodeGeo, nodeMat1);
    node1.position.set(2.35, 0, 0);
    ring1Wrapper.add(node1);

    const node2 = new THREE.Mesh(nodeGeo, nodeMat2);
    node2.position.set(0, 2.8, 0);
    ring2Wrapper.add(node2);

    const node3 = new THREE.Mesh(nodeGeo, nodeMat3);
    node3.position.set(-3.3, 0, 0);
    ring3Wrapper.add(node3);

    // 4. HIGH DENSITY METRIC DATA PARTICLES SWARM
    const particleCount = 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x34d399); // emerald
    const c2 = new THREE.Color(0x38bdf8); // sky
    const c3 = new THREE.Color(0xe879f9); // fuchsia

    for (let i = 0; i < particleCount; i++) {
      // Swarm in spherical cloud
      const r = 2.0 + Math.random() * 5.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      const pickedColor = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      particleColors[i * 3] = pickedColor.r;
      particleColors[i * 3 + 1] = pickedColor.g;
      particleColors[i * 3 + 2] = pickedColor.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 5. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x34d399, isDark ? 2.5 : 3.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, isDark ? 2.0 : 2.6);
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x10b981, isDark ? 3.5 : 4.5, 18);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    pointLightCoreRef.current = pointLight;

    // Mouse movement interaction
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.x = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax
      const targetMouseX = mouseRef.current.x * 0.45;
      const targetMouseY = -mouseRef.current.y * 0.45;

      if (masterCoreGroup) {
        // Base auto rotation + mouse
        masterCoreGroup.rotation.y += 0.005;
        masterCoreGroup.rotation.x = THREE.MathUtils.lerp(
          masterCoreGroup.rotation.x,
          targetRotationRef.current.x + targetMouseY,
          0.06
        );
        masterCoreGroup.rotation.y = THREE.MathUtils.lerp(
          masterCoreGroup.rotation.y,
          masterCoreGroup.rotation.y + targetRotationRef.current.y + targetMouseX * 0.02,
          0.06
        );
        masterCoreGroup.rotation.z = THREE.MathUtils.lerp(
          masterCoreGroup.rotation.z,
          targetRotationRef.current.z,
          0.06
        );

        // Core pulsing
        const pulse = 1 + Math.sin(elapsedTime * 3) * 0.04;
        coreMesh.scale.set(pulse, pulse, pulse);
        cageMesh.scale.set(pulse, pulse, pulse);
        cageMesh.rotation.y -= 0.007;
        cageMesh.rotation.x += 0.004;

        // Rotate individual rings at differing speeds
        if (ringsGroup[0]) ringsGroup[0].rotation.z += 0.015;
        if (ringsGroup[1]) ringsGroup[1].rotation.x += 0.018;
        if (ringsGroup[2]) ringsGroup[2].rotation.y += 0.012;
      }

      // Rotate particle storm
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.03;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.02) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  // UPDATE 3D STAGE POSITION & ROTATION ACCORDING TO SCROLL PROGRESS
  useEffect(() => {
    if (!coreGroupRef.current) return;

    // Cinematic Storyboard Scroll Stages:
    // 0.0 - 0.25 (Hero): Centered / slightly right, monumental reactor
    // 0.25 - 0.50 (Simulador / Motores): Moves to right, tilted 45 deg, zoomed in
    // 0.50 - 0.75 (Arquitectura & Resiliencia): Moves to left side, high angle, rings align
    // 0.75 - 1.00 (Métricas & CTA): Moves center-bottom, massive cosmic core

    const p = Math.max(0, Math.min(1, scrollProgress));

    let targetX = 1.4;
    let targetY = 0;
    let targetZ = 0;
    let rotX = 0.2;
    let rotY = p * Math.PI * 4;
    let rotZ = 0;
    let scale = 1.0;

    if (p < 0.25) {
      // Hero section: centered-right
      const localP = p / 0.25;
      targetX = THREE.MathUtils.lerp(1.2, 2.2, localP);
      targetY = THREE.MathUtils.lerp(0, -0.3, localP);
      scale = THREE.MathUtils.lerp(1.05, 1.25, localP);
      rotX = 0.2 + localP * 0.4;
      rotZ = localP * 0.2;
    } else if (p < 0.5) {
      // Simulator & Concurrency: positioned to right side for text on left
      const localP = (p - 0.25) / 0.25;
      targetX = THREE.MathUtils.lerp(2.2, -2.4, localP);
      targetY = THREE.MathUtils.lerp(-0.3, 0.2, localP);
      scale = THREE.MathUtils.lerp(1.25, 1.4, localP);
      rotX = THREE.MathUtils.lerp(0.6, -0.4, localP);
      rotZ = THREE.MathUtils.lerp(0.2, -0.3, localP);
    } else if (p < 0.75) {
      // Architecture & Capabilities: positioned to left or right
      const localP = (p - 0.5) / 0.25;
      targetX = THREE.MathUtils.lerp(-2.4, 2.3, localP);
      targetY = THREE.MathUtils.lerp(0.2, -0.2, localP);
      scale = THREE.MathUtils.lerp(1.4, 1.15, localP);
      rotX = THREE.MathUtils.lerp(-0.4, 0.5, localP);
      rotZ = THREE.MathUtils.lerp(-0.3, 0.4, localP);
    } else {
      // Cases & Final CTA: centered back, monumental scale
      const localP = (p - 0.75) / 0.25;
      targetX = THREE.MathUtils.lerp(2.3, 0, localP);
      targetY = THREE.MathUtils.lerp(-0.2, -0.5, localP);
      scale = THREE.MathUtils.lerp(1.15, 1.5, localP);
      rotX = THREE.MathUtils.lerp(0.5, 0.1, localP);
      rotZ = THREE.MathUtils.lerp(0.4, 0, localP);
    }

    coreGroupRef.current.position.x = targetX;
    coreGroupRef.current.position.y = targetY;
    coreGroupRef.current.position.z = targetZ;
    coreGroupRef.current.scale.set(scale, scale, scale);

    targetRotationRef.current = {
      x: rotX,
      y: rotY,
      z: rotZ,
    };
  }, [scrollProgress]);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-10 h-screen w-screen overflow-hidden"
      style={{ opacity: 0.95 }}
    />
  );
}
