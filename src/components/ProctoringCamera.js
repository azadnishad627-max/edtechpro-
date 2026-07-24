"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function ProctoringCamera({ onFaceStatus }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ok | warning | alert | spoof
  const historyRef = useRef([]);

  useEffect(() => {
    async function initModel() {
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

  // Enhanced face + eye direction detection
  useEffect(() => {
    if (!model || !isReady || !hasPermission) return;

    let intervalId = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await model.estimateFaces(videoRef.current, false);
          
          if (predictions.length === 0) {
            // No face detected at all
            setStatus('alert');
            onFaceStatus(false);
            return;
          }

          const face = predictions[0];
          // Blazeface landmarks: [rightEye, leftEye, nose, mouth, rightEar, leftEar]
          const landmarks = face.landmarks;
          
          if (landmarks && landmarks.length >= 6) {
            const rightEye = landmarks[0];
            const leftEye = landmarks[1];
            const nose = landmarks[2];
            const rightEar = landmarks[4];
            const leftEar = landmarks[5];
            
            // Calculate face width using ears
            const faceWidth = Math.abs(leftEar[0] - rightEar[0]);
            
            // Calculate eye midpoint
            const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
            
            // Calculate nose offset from eye center (determines if looking left/right)
            const noseOffset = Math.abs(nose[0] - eyeMidX);
            const noseRatio = faceWidth > 0 ? noseOffset / faceWidth : 0;
            
            // Calculate eye distance ratio (if one eye is much closer than the other, face is turned)
            const eyeDistance = Math.abs(leftEye[0] - rightEye[0]);
            const eyeToFaceRatio = faceWidth > 0 ? eyeDistance / faceWidth : 0;
            
            // Face is looking away if:
            // 1. Nose is significantly off-center from eyes (looking left/right)
            // 2. Eye distance is too small compared to face width (face turned sideways)
            const isLookingAway = noseRatio > 0.15 || eyeToFaceRatio < 0.25;
            
            // Liveness detection (Spoof check) using variance of micro-movements
            historyRef.current.push(eyeToFaceRatio);
            if (historyRef.current.length > 5) {
              historyRef.current.shift();
            }
            
            let isSpoof = false;
            if (historyRef.current.length === 5) {
              const mean = historyRef.current.reduce((a,b) => a+b, 0) / 5;
              const variance = historyRef.current.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / 5;
              // If variance is extremely low over 4 seconds, it's a static printed photo
              if (variance < 0.0000001) {
                isSpoof = true;
              }
            }
            
            if (isSpoof) {
              setStatus('spoof');
              onFaceStatus(false);
            } else if (isLookingAway) {
              setStatus('warning');
              onFaceStatus(false); // Treat looking away same as no face
            } else {
              setStatus('ok');
              onFaceStatus(true);
            }
          } else {
            // Face detected but no reliable landmarks
            setStatus('ok');
            onFaceStatus(true);
          }
        } catch (e) {
          // Ignore tensor errors if camera drops
        }
      }
    }, 800); // Check every 800ms for better responsiveness

    return () => clearInterval(intervalId);
  }, [model, isReady, hasPermission, onFaceStatus]);

  const handleVideoPlaying = () => {
    setIsReady(true);
  };

  const getBorderColor = () => {
    switch(status) {
      case 'ok': return '#00e676';
      case 'warning': return '#ff9100';
      case 'alert': return '#ff1744';
      case 'spoof': return '#d50000'; // Dark red for spoof
      default: return '#666';
    }
  };

  const getStatusIcon = () => {
    switch(status) {
      case 'ok': return '✓';
      case 'warning': return '⚠';
      case 'alert': return '✗';
      case 'spoof': return '🤖'; // Robot icon for fake photo
      default: return '...';
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      overflow: 'visible',
      flexShrink: 0,
    }}>
      {/* Main camera circle */}
      <div style={{
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: `3px solid ${getBorderColor()}`,
        boxShadow: `0 0 15px ${getBorderColor()}40, 0 4px 15px rgba(0,0,0,0.3)`,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.3s, box-shadow 0.3s'
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
            transform: 'scaleX(-1)',
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
              padding: '0.3rem',
              fontSize: '0.6rem',
              cursor: 'pointer',
              textAlign: 'center',
              width: '70%',
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
            fontSize: '0.6rem',
            textAlign: 'center'
          }}>
            Loading...
          </div>
        )}
      </div>
      
      {/* Status badge */}
      {isReady && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: getBorderColor(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#000',
          border: '2px solid #0a0a0a',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          {getStatusIcon()}
        </div>
      )}
    </div>
  );
}
