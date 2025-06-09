"use client";

import { useState } from "react";
import { FaceDetectionComponent } from "./components";
import type { FaceDetection } from "../../types";

export default function Home() {
  const [detectedFaces, setDetectedFaces] = useState<FaceDetection[]>([]);
  const [totalDetections, setTotalDetections] = useState(0);
  const [faceHistory, setFaceHistory] = useState<number[]>([]);

  const handleFaceDetected = (faces: FaceDetection[]) => {
    setDetectedFaces(faces);
    setTotalDetections((prev) => prev + 1);

    // Keep track of face count history (last 10 detections)
    setFaceHistory((prev) => {
      const newHistory = [...prev, faces.length];
      return newHistory.slice(-10);
    });

    console.log(
      `Face detection: ${faces.length} faces detected with confidences:`,
      faces.map((f) => Math.round(f.confidence * 100) + "%")
    );
  };

  const averageFaceCount =
    faceHistory.length > 0
      ? (faceHistory.reduce((a, b) => a + b, 0) / faceHistory.length).toFixed(1)
      : "0";

  const maxConfidence =
    detectedFaces.length > 0
      ? Math.max(...detectedFaces.map((f) => f.confidence))
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🪞 Magic Mirror
          </h1>
          <p className="text-gray-300 mb-4">
            Face Recognition System - Phase 1 & 2 Complete
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/train"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🎯 Train New User
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Face Detection Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              🎯 Real-time Face Detection
            </h2>
            <FaceDetectionComponent
              onFaceDetected={handleFaceDetected}
              className="w-full"
              detectionInterval={1000}
              minConfidence={0.5}
              showConfidence={true}
              showLandmarks={false}
            />

            {/* Detection Stats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">
                📊 Detection Stats
              </h3>
              <div className="space-y-2 text-gray-300">
                <p>
                  Faces Currently Detected:{" "}
                  <span className="text-green-400 font-mono text-lg">
                    {detectedFaces.length}
                  </span>
                </p>
                <p>
                  Total Detections Run:{" "}
                  <span className="text-blue-400 font-mono">
                    {totalDetections}
                  </span>
                </p>
                <p>
                  Average Faces (last 10):{" "}
                  <span className="text-purple-400 font-mono">
                    {averageFaceCount}
                  </span>
                </p>
                {maxConfidence > 0 && (
                  <p>
                    Best Confidence:{" "}
                    <span className="text-yellow-400 font-mono">
                      {Math.round(maxConfidence * 100)}%
                    </span>
                  </p>
                )}
                <p>
                  Task 1.3:{" "}
                  <span className="text-green-400">🚀 In Progress</span>
                </p>
              </div>
            </div>
          </div>

          {/* Face Details Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              👤 Face Detection Details
            </h2>
            <div className="bg-gray-800 rounded-lg p-4 aspect-video">
              {detectedFaces.length > 0 ? (
                <div className="h-full">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Detected Faces ({detectedFaces.length})
                  </h3>
                  <div className="space-y-3 overflow-y-auto max-h-80">
                    {detectedFaces.map((face, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">
                            Face #{index + 1}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              face.confidence > 0.8
                                ? "bg-green-600 text-white"
                                : face.confidence > 0.6
                                ? "bg-yellow-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {Math.round(face.confidence * 100)}% confident
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>
                            Position: ({Math.round(face.box.x)},{" "}
                            {Math.round(face.box.y)})
                          </p>
                          <p>
                            Size: {Math.round(face.box.width)} ×{" "}
                            {Math.round(face.box.height)}px
                          </p>
                          {face.landmarks && (
                            <p>Landmarks: {face.landmarks.length} points</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👁️</div>
                    <p>No faces detected</p>
                    <p className="text-sm mt-2">
                      Turn on the camera to start face detection
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Face Detection Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">
                🤖 AI Detection Info
              </h3>
              <div className="space-y-1 text-gray-300 text-sm">
                <p>
                  Model: <span className="text-blue-400">SSD MobileNetV1</span>
                </p>
                <p>
                  Confidence Threshold:{" "}
                  <span className="text-blue-400">50%</span>
                </p>
                <p>
                  Detection Interval:{" "}
                  <span className="text-blue-400">1 second</span>
                </p>
                <p>
                  Bounding Boxes:{" "}
                  <span className="text-green-400">✅ Enabled</span>
                </p>
                <p>
                  Real-time Processing:{" "}
                  <span className="text-green-400">✅ Active</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress */}
        <div className="mt-12 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6 border border-green-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            🎯 Task 1.3: Face Detection Implementation
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-900/30 rounded-lg p-3">
              <div className="text-green-400 font-medium mb-1">
                ✅ Completed (Tasks 1.1 & 1.2)
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Webcam component with permissions</li>
                <li>• Camera on/off toggle</li>
                <li>• Screenshot capture functionality</li>
                <li>• Face-api.js models loaded</li>
                <li>• Model loading utilities</li>
                <li>• Tensor shape errors resolved</li>
              </ul>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3">
              <div className="text-blue-400 font-medium mb-1">
                🚀 Task 1.3 (In Progress)
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>✅ FaceDetection component created</li>
                <li>✅ Real-time face detection</li>
                <li>✅ Bounding box visualization</li>
                <li>✅ Confidence threshold (50%)</li>
                <li>✅ Face count display</li>
                <li>✅ Detection statistics</li>
                <li>✅ Canvas overlay system</li>
              </ul>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-3">
              <div className="text-purple-400 font-medium mb-1">
                📋 Next: Phase 2
              </div>
              <ul className="text-gray-300 space-y-1">
                <li>• Database setup (Prisma + SQLite)</li>
                <li>• User model with face descriptors</li>
                <li>• Training interface for new users</li>
                <li>• Face recognition matching</li>
                <li>• User registration system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            🧪 Testing Face Detection
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="text-white font-medium mb-2">What to Test:</h4>
              <ul className="space-y-1">
                <li>• Turn camera on/off</li>
                <li>• Move your face around the frame</li>
                <li>• Try multiple people in frame</li>
                <li>• Test different lighting conditions</li>
                <li>• Check confidence scores</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">
                What You Should See:
              </h4>
              <ul className="space-y-1">
                <li>• Green bounding boxes around faces</li>
                <li>• Real-time face count updates</li>
                <li>• Confidence percentages</li>
                <li>• Face position coordinates</li>
                <li>• Detection statistics updating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
