"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  loadFaceApiModels,
  detectFaces,
  drawFaceDetections,
  dataUrlToImage,
  areModelsLoaded,
} from "../lib/face-recognition";
import type { FaceDetection, WebcamComponentState } from "../../../types";

interface FaceDetectionProps {
  className?: string;
  detectionInterval?: number; // milliseconds between detections
  minConfidence?: number;
  showConfidence?: boolean;
  showLandmarks?: boolean;
  onFaceDetected?: (faces: FaceDetection[]) => void;
}

interface FaceDetectionState extends WebcamComponentState {
  isDetecting: boolean;
  detectedFaces: FaceDetection[];
  totalDetections: number;
  detectionError: string | null;
  modelsLoaded: boolean;
}

const FaceDetectionComponent: React.FC<FaceDetectionProps> = ({
  className = "",
  detectionInterval = 1000, // 1 second default
  minConfidence = 0.5,
  showConfidence = true,
  showLandmarks = false,
  onFaceDetected,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<FaceDetectionState>({
    isActive: false,
    hasPermission: false,
    permissionError: null,
    isLoading: false,
    isDetecting: false,
    detectedFaces: [],
    totalDetections: 0,
    detectionError: null,
    modelsLoaded: false,
  });

  // Load face-api models on component mount
  useEffect(() => {
    const initializeModels = async () => {
      if (areModelsLoaded()) {
        setState((prev) => ({ ...prev, modelsLoaded: true }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        await loadFaceApiModels();
        setState((prev) => ({
          ...prev,
          modelsLoaded: true,
          isLoading: false,
          detectionError: null,
        }));
        console.log("✅ Face detection models ready");
      } catch (error) {
        console.error("❌ Failed to load face detection models:", error);
        setState((prev) => ({
          ...prev,
          modelsLoaded: false,
          isLoading: false,
          detectionError: "Failed to load AI models",
        }));
      }
    };

    initializeModels();
  }, []);

  // Request camera permissions
  const requestCameraPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, permissionError: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      // Stop the stream immediately - we just needed it for permission
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        hasPermission: true,
        isLoading: false,
        permissionError: null,
      }));
    } catch (error) {
      console.error("Camera permission error:", error);
      let errorMessage = "Camera access denied";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        }
      }

      setState((prev) => ({
        ...prev,
        hasPermission: false,
        isLoading: false,
        permissionError: errorMessage,
      }));
    }
  }, []);

  // Perform face detection on current video frame
  const performFaceDetection = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !state.modelsLoaded) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      return; // Video not ready
    }

    setState((prev) => ({ ...prev, isDetecting: true, detectionError: null }));

    try {
      // Check video readiness
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("⚠️ Video not ready for detection (0 dimensions)");
        setState((prev) => ({ ...prev, isDetecting: false }));
        return;
      }

      // Detect faces in the video element
      const faces = await detectFaces(video, {
        withLandmarks: showLandmarks,
        withDescriptors: false, // Not needed for basic detection
        minConfidence,
      });

      console.log(`✅ Face detection completed: ${faces.length} faces found`);

      // Update canvas size to match video
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Draw face detections
      if (faces.length > 0) {
        drawFaceDetections(canvas, faces, {
          boxColor: "#00ff00",
          lineWidth: 3,
          showConfidence,
          showLandmarks,
        });
      }

      setState((prev) => ({
        ...prev,
        isDetecting: false,
        detectedFaces: faces,
        totalDetections: prev.totalDetections + 1,
      }));

      // Call callback if provided
      if (onFaceDetected) {
        onFaceDetected(faces);
      }
    } catch (error) {
      console.error("Face detection error:", error);
      setState((prev) => ({
        ...prev,
        isDetecting: false,
        detectionError: "Face detection failed",
      }));
    }
  }, [
    state.modelsLoaded,
    minConfidence,
    showConfidence,
    showLandmarks,
    onFaceDetected,
  ]);

  // Start/stop face detection
  const toggleDetection = useCallback(() => {
    if (state.isDetecting || detectionIntervalRef.current) {
      // Stop detection
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setState((prev) => ({ ...prev, isDetecting: false }));
    } else {
      // Start detection
      if (state.isActive && state.modelsLoaded) {
        detectionIntervalRef.current = setInterval(
          performFaceDetection,
          detectionInterval
        );
      }
    }
  }, [
    state.isActive,
    state.modelsLoaded,
    state.isDetecting,
    performFaceDetection,
    detectionInterval,
  ]);

  // Toggle camera on/off
  const toggleCamera = useCallback(async () => {
    if (!state.isActive) {
      if (!state.hasPermission) {
        await requestCameraPermission();
        if (!state.hasPermission) return;
      }
      setState((prev) => ({ ...prev, isActive: true }));
    } else {
      // Stop detection when turning off camera
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setState((prev) => ({
        ...prev,
        isActive: false,
        isDetecting: false,
        detectedFaces: [],
      }));
    }
  }, [state.isActive, state.hasPermission, requestCameraPermission]);

  // Auto-request permission and start detection when camera is active
  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  // Auto-start detection when camera becomes active and models are loaded
  useEffect(() => {
    if (state.isActive && state.modelsLoaded && !detectionIntervalRef.current) {
      detectionIntervalRef.current = setInterval(
        performFaceDetection,
        detectionInterval
      );
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [
    state.isActive,
    state.modelsLoaded,
    performFaceDetection,
    detectionInterval,
  ]);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  };

  const canShowFaceDetection =
    state.isActive && state.hasPermission && state.modelsLoaded;

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* Camera View with Overlay */}
      <div className="relative aspect-video bg-gray-800">
        {state.isActive && state.hasPermission ? (
          <div className="relative w-full h-full">
            <Webcam
              ref={webcamRef}
              audio={false}
              width="100%"
              height="100%"
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
              onUserMediaError={(error) => {
                console.error("Webcam error:", error);
                setState((prev) => ({
                  ...prev,
                  permissionError: "Failed to access camera",
                  isActive: false,
                }));
              }}
            />
            {/* Face detection overlay canvas */}
            {canShowFaceDetection && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ mixBlendMode: "normal" }}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {state.isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>
                  {!state.modelsLoaded
                    ? "Loading AI models..."
                    : "Requesting camera access..."}
                </p>
              </div>
            ) : state.permissionError ? (
              <div className="text-center p-4">
                <div className="text-red-400 mb-2">⚠️</div>
                <p className="text-sm">{state.permissionError}</p>
                <button
                  onClick={requestCameraPermission}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : state.detectionError ? (
              <div className="text-center p-4">
                <div className="text-red-400 mb-2">🤖</div>
                <p className="text-sm">{state.detectionError}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">🎯</div>
                <p>Face Detection Ready</p>
                <p className="text-sm text-gray-500 mt-1">
                  Models: {state.modelsLoaded ? "✅ Loaded" : "❌ Not loaded"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Face Detection Stats */}
      {canShowFaceDetection && (
        <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3 text-white text-sm">
          <div className="flex items-center space-x-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${
                state.isDetecting
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-green-400"
              }`}
            ></div>
            <span>Faces: {state.detectedFaces.length}</span>
          </div>
          <div className="text-xs text-gray-300">
            Detections: {state.totalDetections}
          </div>
          {state.detectedFaces.length > 0 && (
            <div className="text-xs text-gray-300 mt-1">
              Confidence:{" "}
              {Math.round(
                Math.max(...state.detectedFaces.map((f) => f.confidence)) * 100
              )}
              %
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        {/* Camera Toggle Button */}
        <button
          onClick={toggleCamera}
          disabled={state.isLoading}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            state.isActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          } ${state.isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {state.isLoading
            ? "Loading..."
            : state.isActive
            ? "Turn Off"
            : "Turn On"}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            state.isActive && state.modelsLoaded
              ? "bg-green-600 text-white"
              : state.modelsLoaded
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              state.isActive && state.modelsLoaded
                ? "bg-white"
                : state.modelsLoaded
                ? "bg-blue-200"
                : "bg-gray-400"
            }`}
          ></div>
          <span>
            {state.isActive && state.modelsLoaded
              ? "Detecting"
              : state.modelsLoaded
              ? "Ready"
              : "Loading"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FaceDetectionComponent;
