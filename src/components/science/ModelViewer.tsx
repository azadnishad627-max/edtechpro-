"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { Hotspot } from "../../lib/science/science-data";

type Props = {
  fileUrl: string;
  scale?: number;
  cameraPosition?: [number, number, number];
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
};

export function ModelViewer({ fileUrl, scale = 1, cameraPosition = [0, 0, 5], hotspots, onHotspotClick }: Props) {
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
    
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      fileUrl,
      (gltf) => {
        loadedModel = gltf.scene;
        
        // Use a pivot group to handle centering and scaling correctly
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        // Use 3.8 to match the anatomy-data.ts coordinate space
        const fitScale = 3.8 / maxDim;
        const finalScale = fitScale * scale;
        
        loadedModel.scale.setScalar(finalScale);
        loadedModel.position.copy(center.multiplyScalar(-finalScale));
        
        const pivot = new THREE.Group();
        pivot.add(loadedModel);
        
        // Enable shadows and collect meshes for snapping
        const meshes: THREE.Mesh[] = [];
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            meshes.push(child);
          }
        });

        scene.add(pivot);
        loadedModel = pivot; // Keep reference to pivot for cleanup
        
        // Snap hotspots to the nearest surface vertex to prevent parallax drift
        if (hotspots && hotspots.length > 0) {
          pivot.updateWorldMatrix(true, true);
          const toPivot = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
          const local = new THREE.Matrix4();
          const vertex = new THREE.Vector3();
          
          const anchors = hotspots.map(h => new THREE.Vector3(...h.position));
          const closestDist = hotspots.map(() => Infinity);
          
          for (const mesh of meshes) {
            const position = mesh.geometry.getAttribute("position");
            if (!position) continue;
            local.multiplyMatrices(toPivot, mesh.matrixWorld);
            
            for (let i = 0; i < position.count; i++) {
              vertex.fromBufferAttribute(position, i).applyMatrix4(local);
              for (let h = 0; h < anchors.length; h++) {
                const dist = vertex.distanceToSquared(anchors[h]);
                if (dist < closestDist[h]) {
                  closestDist[h] = dist;
                  // Store snapped position, adding a tiny lift so it sits just outside the surface
                  anchors[h].copy(vertex).add(vertex.clone().normalize().multiplyScalar(0.02));
                }
              }
            }
          }
          // Store snapped anchors on the pivot object for the render loop to use
          pivot.userData.hotspotAnchors = anchors;
        }

        setLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setLoading(false);
      }
    );

    // Handle hotspots projection
    const updateHotspots = () => {
      if (!currentMount || !loadedModel || !hotspots) return;
      
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      
      hotspots.forEach((hotspot, index) => {
        const el = document.getElementById(`hotspot-${hotspot.id}`);
        if (!el) return;
        
        // Convert local position to world space based on the pivot
        // Use snapped anchor if available, otherwise fallback to authored position
        const anchors = loadedModel!.userData.hotspotAnchors;
        const vector = anchors && anchors[index] 
          ? anchors[index].clone() 
          : new THREE.Vector3(...hotspot.position);
          
        loadedModel!.localToWorld(vector);
        vector.project(camera);
        
        // If it's behind the camera, hide it
        if (vector.z > 1) {
          el.style.display = 'none';
          return;
        }
        
        const x = (vector.x * 0.5 + 0.5) * width;
        const y = (-(vector.y * 0.5) + 0.5) * height;
        
        el.style.display = 'flex';
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      });
    };

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      controls.update();
      updateHotspots();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    // Handle resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(currentMount);

    // Initial resize to ensure correct dimensions after layout
    setTimeout(handleResize, 100);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      
      if (loadedModel) {
        scene.remove(loadedModel);
      }
    };
  }, [fileUrl, scale, cameraPosition, hotspots, onHotspotClick]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {loading && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2f2a27", zIndex: 10 }}>
          <div style={{ color: "#8d847c" }}>Loading 3D Model...</div>
        </div>
      )}
      <div ref={mountRef} style={{ width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden" }} />
      
      {/* Hotspots Overlay */}
      {hotspots && hotspots.length > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden", zIndex: 5 }}>
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              id={`hotspot-${hotspot.id}`}
              onClick={() => onHotspotClick && onHotspotClick(hotspot)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "24px",
                height: "24px",
                backgroundColor: "rgba(235, 124, 107, 0.8)",
                border: "2px solid white",
                borderRadius: "50%",
                pointerEvents: "auto",
                cursor: "pointer",
                boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                display: "none", // initially hidden until projected
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <div style={{ width: "6px", height: "6px", backgroundColor: "white", borderRadius: "50%" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
