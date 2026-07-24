"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function ProctoringCamera({ onFaceStatus }) {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function initModel() {
      // Load the blazeface model
      await tf.ready();
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
    }
    initModel();
  }, []);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Browser API navigator.mediaDevices.getUserMedia not available");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
      }
    }
    setupCamera();
  }, []);

  useEffect(() => {
    if (!model || !isReady || !hasPermission) return;

    let intervalId = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await model.estimateFaces(videoRef.current, false);
          // If predictions array has elements, a face is detected
          const faceDetected = predictions.length > 0;
          onFaceStatus(faceDetected);
        } catch (e) {
          // Ignore tensor errors if camera drops
        }
      }
    }, 1000); // Check every 1 second to save performance

    return () => clearInterval(intervalId);
  }, [model, isReady, hasPermission, onFaceStatus]);

  const handleVideoPlaying = () => {
    setIsReady(true);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '4px solid ' + (isReady ? '#00e676' : '#ff1744'),
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 9999,
      background: '#000'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlaying={handleVideoPlaying}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)' // Mirror effect
        }}
      />
      {!isReady && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          Starting Camera...
        </div>
      )}
    </div>
  );
}
