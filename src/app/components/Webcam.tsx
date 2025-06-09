"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import type {
  WebcamProps,
  WebcamComponentState,
  CameraConstraints,
} from "../../../types";

const WebcamComponent: React.FC<WebcamProps> = ({
  onCapture,
  className = "",
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [state, setState] = useState<WebcamComponentState>({
    isActive: false,
    hasPermission: false,
    permissionError: null,
    isLoading: false,
  });

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

  // Toggle camera on/off
  const toggleCamera = useCallback(async () => {
    if (!state.isActive) {
      if (!state.hasPermission) {
        await requestCameraPermission();
        if (!state.hasPermission) return;
      }
      setState((prev) => ({ ...prev, isActive: true }));
    } else {
      setState((prev) => ({ ...prev, isActive: false }));
    }
  }, [state.isActive, state.hasPermission, requestCameraPermission]);

  // Capture screenshot
  const capturePhoto = useCallback(() => {
    if (webcamRef.current && state.isActive) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      } else {
        console.error("Failed to capture screenshot");
      }
    }
  }, [onCapture, state.isActive]);

  // Auto-request permission on component mount
  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
  };

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* Camera View */}
      <div className="relative aspect-video bg-gray-800">
        {state.isActive && state.hasPermission ? (
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {state.isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>Requesting camera access...</p>
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
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">📷</div>
                <p>Camera is off</p>
              </div>
            )}
          </div>
        )}
      </div>

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

        {/* Capture Button */}
        <button
          onClick={capturePhoto}
          disabled={!state.isActive || state.isLoading}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            state.isActive && !state.isLoading
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          📸 Capture
        </button>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            state.isActive
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              state.isActive ? "bg-green-300 animate-pulse" : "bg-gray-500"
            }`}
          ></div>
          <span>{state.isActive ? "Live" : "Off"}</span>
        </div>
      </div>
    </div>
  );
};

export default WebcamComponent;
