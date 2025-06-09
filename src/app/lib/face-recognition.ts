"use client";

import * as faceapi from "face-api.js";
import type { FaceDetection, RecognitionResult } from "../../../types";

// Model loading status
let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

/**
 * Load all required face-api.js models
 * This function ensures models are loaded only once
 */
export const loadFaceApiModels = async (): Promise<void> => {
  // Return existing promise if already loading
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  // Return immediately if already loaded
  if (modelsLoaded) {
    return Promise.resolve();
  }

  // Create the loading promise
  modelLoadingPromise = loadModels();

  try {
    await modelLoadingPromise;
    modelsLoaded = true;
    console.log("✅ All face-api.js models loaded successfully");
  } catch (error) {
    console.error("❌ Failed to load face-api.js models:", error);
    modelLoadingPromise = null;
    throw error;
  }

  return modelLoadingPromise;
};

/**
 * Internal function to load the models
 */
const loadModels = async (): Promise<void> => {
  console.log("🔄 Loading face-api.js models...");

  try {
    // Try CDN first as fallback, then local models
    const MODEL_URL =
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/v0.22.2/weights";
    const LOCAL_PATH = "/models";

    console.log("📥 Attempting to load from CDN for compatibility...");

    try {
      // Load models sequentially from CDN for better compatibility
      console.log("📥 Loading SSD MobileNetV1 from CDN...");
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      console.log("✅ SSD MobileNetV1 loaded from CDN");

      console.log("📥 Loading Face Landmark 68 from CDN...");
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log("✅ Face Landmark 68 loaded from CDN");

      console.log("📥 Loading Face Recognition Network from CDN...");
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log("✅ Face Recognition Network loaded from CDN");

      console.log("📦 All models loaded successfully from CDN!");
    } catch (cdnError) {
      console.warn("⚠️ CDN loading failed, trying local models...", cdnError);

      // Fallback to local models
      console.log("📥 Loading SSD MobileNetV1 locally...");
      await faceapi.nets.ssdMobilenetv1.loadFromUri(LOCAL_PATH);
      console.log("✅ SSD MobileNetV1 loaded locally");

      console.log("📥 Loading Face Landmark 68 locally...");
      await faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_PATH);
      console.log("✅ Face Landmark 68 loaded locally");

      console.log("📥 Loading Face Recognition Network locally...");
      await faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_PATH);
      console.log("✅ Face Recognition Network loaded locally");

      console.log("📦 All models loaded successfully from local files!");
    }

    console.log("🎯 Model loading complete:");
    console.log("  - SSD MobileNetV1 (Face Detection)");
    console.log("  - Face Landmark 68 Points");
    console.log("  - Face Recognition Network");
  } catch (error) {
    console.error("💥 Error loading models:", error);

    // Provide more specific error information
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      });
    }

    // Additional debugging
    console.log("🔍 Model debugging info:");
    console.log(
      "- face-api.js version:",
      (faceapi as any).version || "unknown"
    );
    console.log(
      "- TensorFlow.js backend:",
      faceapi.tf?.getBackend?.() || "unknown"
    );

    throw new Error(`Failed to load face recognition models: ${error}`);
  }
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => {
  return modelsLoaded;
};

/**
 * Detect faces in an image element
 * @param imageElement - HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
 * @param options - Detection options
 */
export const detectFaces = async (
  imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  options: {
    withLandmarks?: boolean;
    withDescriptors?: boolean;
    minConfidence?: number;
  } = {}
): Promise<FaceDetection[]> => {
  // Ensure models are loaded
  await loadFaceApiModels();

  const {
    withLandmarks = true,
    withDescriptors = true,
    minConfidence = 0.5,
  } = options;

  try {
    let detections;

    if (withLandmarks && withDescriptors) {
      // Full detection with landmarks and descriptors
      detections = await faceapi
        .detectAllFaces(
          imageElement,
          new faceapi.SsdMobilenetv1Options({ minConfidence })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();
    } else if (withLandmarks) {
      // Detection with landmarks only
      detections = await faceapi
        .detectAllFaces(
          imageElement,
          new faceapi.SsdMobilenetv1Options({ minConfidence })
        )
        .withFaceLandmarks();
    } else {
      // Basic detection only
      detections = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence })
      );
    }

    // Convert to our custom format
    const results: FaceDetection[] = detections.map((detection: any) => ({
      box: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height,
      },
      confidence: detection.detection.score,
      landmarks: detection.landmarks?.positions?.map((point: any) => [
        point.x,
        point.y,
      ]),
      descriptor: detection.descriptor,
    }));

    return results;
  } catch (error) {
    console.error("❌ Face detection error:", error);
    throw new Error("Failed to detect faces in image");
  }
};

/**
 * Create face descriptor from image
 * This is used for training/registration
 */
export const createFaceDescriptor = async (
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> => {
  try {
    const detections = await detectFaces(imageElement, {
      withDescriptors: true,
      minConfidence: 0.8, // Higher confidence for training
    });

    if (detections.length === 0) {
      console.warn("⚠️ No faces detected in image");
      return null;
    }

    if (detections.length > 1) {
      console.warn("⚠️ Multiple faces detected, using the first one");
    }

    return detections[0].descriptor || null;
  } catch (error) {
    console.error("❌ Error creating face descriptor:", error);
    return null;
  }
};

/**
 * Compare two face descriptors using Euclidean distance
 * @param descriptor1 - First face descriptor
 * @param descriptor2 - Second face descriptor
 * @returns Distance between descriptors (lower = more similar)
 */
export const compareFaceDescriptors = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number => {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};

/**
 * Find best match from a list of known descriptors
 * @param inputDescriptor - Face descriptor to match
 * @param knownDescriptors - Array of known descriptors with metadata
 * @param threshold - Maximum distance for a valid match (default: 0.6)
 */
export const findBestMatch = (
  inputDescriptor: Float32Array,
  knownDescriptors: Array<{
    descriptor: Float32Array;
    userId: string;
    name: string;
  }>,
  threshold: number = 0.6
): RecognitionResult | null => {
  let bestMatch: RecognitionResult | null = null;
  let bestDistance = threshold;

  for (const known of knownDescriptors) {
    const distance = compareFaceDescriptors(inputDescriptor, known.descriptor);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = {
        userId: known.userId,
        name: known.name,
        confidence: 1 - distance, // Convert distance to confidence score
      };
    }
  }

  return bestMatch;
};

/**
 * Draw face detection boxes on canvas
 * @param canvas - Canvas element to draw on
 * @param detections - Array of face detections
 * @param options - Drawing options
 */
export const drawFaceDetections = (
  canvas: HTMLCanvasElement,
  detections: FaceDetection[],
  options: {
    boxColor?: string;
    lineWidth?: number;
    showConfidence?: boolean;
    showLandmarks?: boolean;
  } = {}
): void => {
  const {
    boxColor = "#00ff00",
    lineWidth = 2,
    showConfidence = true,
    showLandmarks = false,
  } = options;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.strokeStyle = boxColor;
  ctx.lineWidth = lineWidth;
  ctx.font = "16px Arial";
  ctx.fillStyle = boxColor;

  detections.forEach((detection) => {
    const { box, confidence, landmarks } = detection;

    // Draw bounding box
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw confidence score
    if (showConfidence) {
      const label = `${Math.round(confidence * 100)}%`;
      ctx.fillText(label, box.x, box.y - 5);
    }

    // Draw landmarks if available
    if (showLandmarks && landmarks) {
      ctx.fillStyle = "#ff0000";
      landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.fillStyle = boxColor;
    }
  });
};

/**
 * Utility function to convert image data URL to HTMLImageElement
 */
export const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
};

/**
 * Get model loading progress (for UI feedback)
 */
export const getModelLoadingStatus = (): {
  isLoading: boolean;
  isLoaded: boolean;
  error: boolean;
} => {
  return {
    isLoading: modelLoadingPromise !== null && !modelsLoaded,
    isLoaded: modelsLoaded,
    error: false, // We'll enhance this with proper error tracking later
  };
};
