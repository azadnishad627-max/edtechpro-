"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

type Props = {
  fileUrl: string;
  scale?: number;
  cameraPosition?: [number, number, number];
};

export function ModelViewer({ fileUrl, scale = 1, cameraPosition = [0, 0, 5] }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2f2a27"); // Matches anatomy dark theme
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(...cameraPosition);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Load Model
    setLoading(true);
    let loadedModel: THREE.Group | null = null;
    
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      fileUrl,
      (gltf) => {
        loadedModel = gltf.scene;
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.x += (loadedModel.position.x - center.x);
        loadedModel.position.y += (loadedModel.position.y - center.y);
        loadedModel.position.z += (loadedModel.position.z - center.z);
        
        loadedModel.scale.setScalar(scale);
        
        // Enable shadows
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(loadedModel);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setLoading(false);
      }
    );

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      dracoLoader.dispose();
      
      if (loadedModel) {
        scene.remove(loadedModel);
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [fileUrl, scale]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {loading && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0,0,0,0.5)",
          color: "white",
          zIndex: 10,
          borderRadius: "12px"
        }}>
          Loading 3D Model...
        </div>
      )}
      <div ref={mountRef} style={{ width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden" }} />
    </div>
  );
}
