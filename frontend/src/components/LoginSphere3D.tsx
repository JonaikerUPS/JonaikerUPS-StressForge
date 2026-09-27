"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface LoginSphere3DProps {
  isDark?: boolean;
}

export default function LoginSphere3D({ isDark = true }: LoginSphere3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
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
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Master Group
    const masterGroup = new THREE.Group();
    // Default position: slightly offset to right on desktop for cinematic split screen
    masterGroup.position.set(1.5, 0, 0);
    scene.add(masterGroup);

    // 1. Central Core Reactor
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 3);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x10b981),
      emissive: new THREE.Color(0x059669),
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // 2. Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    masterGroup.add(cageMesh);

    // 3. Orbital Torus Rings
    // Ring 1 - Emerald Cyan
    const ring1Geo = new THREE.TorusGeometry(2.1, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    const ring1Wrapper = new THREE.Group();
    ring1Wrapper.add(ring1);
    ring1Wrapper.rotation.x = Math.PI / 3.5;
    masterGroup.add(ring1Wrapper);

    // Ring 2 - Sky Cyan
    const ring2Geo = new THREE.TorusGeometry(2.5, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    const ring2Wrapper = new THREE.Group();
    ring2Wrapper.add(ring2);
    ring2Wrapper.rotation.y = Math.PI / 3;
    ring2Wrapper.rotation.z = Math.PI / 6;
    masterGroup.add(ring2Wrapper);

    // Ring 3 - Fuchsia
    const ring3Geo = new THREE.TorusGeometry(2.9, 0.025, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xc026d3,
      emissiveIntensity: 0.7,
      metalness: 0.9,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    const ring3Wrapper = new THREE.Group();
    ring3Wrapper.add(ring3);
    ring3Wrapper.rotation.x = -Math.PI / 4;
    ring3Wrapper.rotation.y = Math.PI / 4;
    masterGroup.add(ring3Wrapper);

    // Satellites
    const satGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const s1 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: 0x6ee7b7 }));
    s1.position.set(2.1, 0, 0);
    ring1Wrapper.add(s1);

    const s2 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
    s2.position.set(0, 2.5, 0);
    ring2Wrapper.add(s2);

    const s3 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
    s3.position.set(-2.9, 0, 0);
    ring3Wrapper.add(s3);

    // 4. Data Swarm Particles
    const pCount = 500;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    const c1 = new THREE.Color(0x34d399);
    const c2 = new THREE.Color(0x38bdf8);
    const c3 = new THREE.Color(0xe879f9);

    for (let i = 0; i < pCount; i++) {
      const r = 1.8 + Math.random() * 3.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);

      pPositions[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pPositions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pPositions[i * 3 + 2] = r * Math.cos(ph);

      const picked = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      pColors[i * 3] = picked.r;
      pColors[i * 3 + 1] = picked.g;
      pColors[i * 3 + 2] = picked.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    masterGroup.add(particles);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.3);
    scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0x34d399, 2.5);
    dir1.position.set(4, 6, 4);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dir2.position.set(-5, -4, -3);
    scene.add(dir2);

    const pointLight = new THREE.PointLight(0x10b981, 3, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // En móviles centrar el modelo, en desktop desplazarlo
      if (w < 1024) {
        masterGroup.position.set(0, 1.4, -1.0);
        masterGroup.scale.set(0.75, 0.75, 0.75);
      } else {
        masterGroup.position.set(1.8, 0, 0);
        masterGroup.scale.set(1.0, 1.0, 1.0);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gyroscope rotation
      masterGroup.rotation.y += 0.005;
      masterGroup.rotation.x = THREE.MathUtils.lerp(
        masterGroup.rotation.x,
        -mouseRef.current.y * 0.35,
        0.05
      );
      masterGroup.rotation.y = THREE.MathUtils.lerp(
        masterGroup.rotation.y,
        masterGroup.rotation.y + mouseRef.current.x * 0.02,
        0.05
      );

      ring1Wrapper.rotation.z += 0.015;
      ring2Wrapper.rotation.x += 0.018;
      ring3Wrapper.rotation.y += 0.012;

      cageMesh.rotation.y -= 0.008;
      cageMesh.rotation.x += 0.005;

      const pulse = 1 + Math.sin(t * 3) * 0.04;
      coreMesh.scale.set(pulse, pulse, pulse);
      cageMesh.scale.set(pulse, pulse, pulse);

      particles.rotation.y = t * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden"
    />
  );
}
