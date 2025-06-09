"use client";

import { useState, useEffect } from "react";
import WebcamComponent from "./components/Webcam";
import {
  loadFaceApiModels,
  getModelLoadingStatus,
} from "./lib/face-recognition";
import {
  loadBasicFaceModel,
  isBasicModelLoaded,
} from "./lib/face-recognition-simple";

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [modelStatus, setModelStatus] = useState(getModelLoadingStatus());
  const [modelType, setModelType] = useState<"full" | "basic" | "none">("none");

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCaptureCount((prev) => prev + 1);
    console.log("Image captured:", imageSrc.substring(0, 50) + "...");
  };

  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelStatus({ isLoading: true, isLoaded: false, error: false });

        // Try full models first, fallback to basic model
        try {
          console.log("🎯 Attempting to load full face-api models...");
          await loadFaceApiModels();
          setModelStatus({ isLoading: false, isLoaded: true, error: false });
          setModelType("full");
          console.log("✅ Full models loaded successfully!");
        } catch (fullModelError) {
          console.warn(
            "⚠️ Full models failed, trying basic model...",
            fullModelError
          );

          // Fallback to basic model
          await loadBasicFaceModel();
          setModelStatus({ isLoading: false, isLoaded: true, error: false });
          setModelType("basic");
          console.log("✅ Basic face detection model loaded successfully!");
        }
      } catch (error) {
        console.error("❌ All model loading attempts failed:", error);
        setModelStatus({ isLoading: false, isLoaded: false, error: true });
      }
    };

    loadModels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🪞 Magic Mirror
          </h1>
          <p className="text-gray-300">
            Face Recognition System - Testing Webcam Component
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Webcam Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              📹 Camera Feed
            </h2>
            <WebcamComponent onCapture={handleCapture} className="w-full" />

            {/* Capture Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">📊 Stats</h3>
              <div className="space-y-2 text-gray-300">
                <p>
                  Total Captures:{" "}
                  <span className="text-blue-400 font-mono">
                    {captureCount}
                  </span>
                </p>
                <p>
                  Models Status:{" "}
                  {modelStatus.isLoading && (
                    <span className="text-yellow-400">🔄 Loading...</span>
                  )}
                  {modelStatus.isLoaded && (
                    <span className="text-green-400">
                      ✅ Ready (
                      {modelType === "full" ? "Full AI" : "Basic Detection"})
                    </span>
                  )}
                  {modelStatus.error && (
                    <span className="text-red-400">❌ Error</span>
                  )}
                </p>
                <p>
                  Task 1.2: <span className="text-green-400">✅ Complete</span>
                </p>
              </div>
            </div>
          </div>

          {/* Captured Image Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              📸 Last Captured Image
            </h2>
            <div className="bg-gray-800 rounded-lg p-4 aspect-video">
              {capturedImage ? (
                <div className="h-full">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p>No image captured yet</p>
                    <p className="text-sm mt-2">
                      Click "Capture" to take a photo
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Info */}
            {capturedImage && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  📝 Image Details
                </h3>
                <div className="space-y-1 text-gray-300 text-sm">
                  <p>
                    Format: <span className="text-blue-400">JPEG</span>
                  </p>
                  <p>
                    Size:{" "}
                    <span className="text-blue-400">
                      {Math.round(capturedImage.length / 1024)} KB
                    </span>
                  </p>
                  <p>
                    Captured:{" "}
                    <span className="text-blue-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            🚀 Tasks 1.1 & 1.2 Complete - Next Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-900/30 rounded-lg p-3">
              <div className="text-green-400 font-medium mb-1">
                ✅ Completed
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Webcam component created</li>
                <li>• Camera permissions handling</li>
                <li>• Screenshot capture functionality</li>
                <li>• Camera on/off toggle</li>
                <li>• Face-api.js models downloaded</li>
                <li>• Model loading utility created</li>
              </ul>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3">
              <div className="text-blue-400 font-medium mb-1">
                ⏳ Task 1.3 Next
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Create FaceDetection component</li>
                <li>• Load face-api models on mount</li>
                <li>• Implement face detection on images</li>
                <li>• Draw bounding boxes on faces</li>
              </ul>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-3">
              <div className="text-purple-400 font-medium mb-1">
                📋 Task 1.3 After
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Face detection component</li>
                <li>• Load face-api models</li>
                <li>• Draw bounding boxes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
