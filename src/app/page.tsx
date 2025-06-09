"use client";

import { useState } from "react";
import WebcamComponent from "./components/Webcam";

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState(0);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCaptureCount((prev) => prev + 1);
    console.log("Image captured:", imageSrc.substring(0, 50) + "...");
  };

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
                  Status:{" "}
                  <span className="text-green-400">Ready for Phase 1</span>
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
            🚀 Task 1.1 Complete - Next Steps
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
              </ul>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3">
              <div className="text-blue-400 font-medium mb-1">
                ⏳ Task 1.2 Next
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Download face-api.js models</li>
                <li>• Setup model loading utility</li>
                <li>• Place in public/models/</li>
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
