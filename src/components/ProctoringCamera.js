"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function ProctoringCamera({ onFaceStatus }) {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    async function initModel() {
      // Load the blazeface model
      await tf.ready();
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
    }
    initModel();
  }, []);

  const requestCamera = async (isManual = false) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Browser API navigator.mediaDevices.getUserMedia not available");
      if (isManual) alert("Your browser doesn't support camera features. Please use Chrome or Safari.");
      setPermissionError(true);
      return;
    }
    try {
      setPermissionError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera access denied or error:", err);
      if (isManual) alert("Camera Blocked! Please click the 'Lock' icon next to the URL bar and allow Camera access.\nError: " + err.message);
      setPermissionError(true);
    }
  };

  useEffect(() => {
    requestCamera(false);
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
      top: '80px',    // Changed to top right corner
      right: '20px',

      width: '120px',
      height: '120px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '4px solid ' + (isReady ? '#00e676' : '#ff1744'),
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 9999,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
          transform: 'scaleX(-1)', // Mirror effect
          display: hasPermission && !permissionError ? 'block' : 'none'
        }}
      />
      {permissionError && (
        <button 
          onClick={() => requestCamera(true)}
          style={{
            position: 'absolute',
            background: '#ff1744',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            textAlign: 'center',
            width: '80%',
            zIndex: 10
          }}
        >
          Allow Camera
        </button>
      )}
      {!isReady && !permissionError && (
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
          Starting...
        </div>
      )}
    </div>
  );
}
