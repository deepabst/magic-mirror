"use client";

import * as faceapi from "face-api.js";

// Simple model loading status
let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

/**
 * Load only the essential face detection model (SSD MobileNet)
 * This is a minimal approach to avoid tensor shape issues
 */
export const loadBasicFaceModel = async (): Promise<void> => {
  // Return existing promise if already loading
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  // Return immediately if already loaded
  if (modelsLoaded) {
    return Promise.resolve();
  }

  // Create the loading promise
  modelLoadingPromise = loadBasicModel();

  try {
    await modelLoadingPromise;
    modelsLoaded = true;
    console.log("✅ Basic face detection model loaded successfully");
  } catch (error) {
    console.error("❌ Failed to load basic face detection model:", error);
    modelLoadingPromise = null;
    throw error;
  }

  return modelLoadingPromise;
};

/**
 * Internal function to load only the SSD MobileNet model
 */
const loadBasicModel = async (): Promise<void> => {
  console.log("🔄 Loading basic face detection model...");

  try {
    // Try multiple model sources
    const modelSources = [
      "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model",
      "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/v0.22.2/weights",
      "/models",
    ];

    let loaded = false;
    let lastError: Error | null = null;

    for (const modelPath of modelSources) {
      try {
        console.log(`📥 Trying to load from: ${modelPath}`);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
        console.log(`✅ Successfully loaded from: ${modelPath}`);
        loaded = true;
        break;
      } catch (error) {
        console.warn(`⚠️ Failed to load from ${modelPath}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    if (!loaded) {
      throw lastError || new Error("Failed to load from all sources");
    }

    console.log("📦 Basic face detection ready");
  } catch (error) {
    console.error("💥 Error loading basic model:", error);
    throw new Error(`Failed to load face detection model: ${error}`);
  }
};

/**
 * Check if basic model is loaded
 */
export const isBasicModelLoaded = (): boolean => {
  return modelsLoaded;
};

/**
 * Simple face detection (bounding boxes only)
 * @param imageElement - HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
 * @param minConfidence - Minimum confidence threshold (default: 0.5)
 */
export const detectFacesBasic = async (
  imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  minConfidence: number = 0.5
): Promise<
  Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>
> => {
  // Ensure model is loaded
  await loadBasicFaceModel();

  try {
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence })
    );

    return detections.map((detection) => ({
      x: detection.box.x,
      y: detection.box.y,
      width: detection.box.width,
      height: detection.box.height,
      confidence: detection.score,
    }));
  } catch (error) {
    console.error("❌ Basic face detection error:", error);
    throw new Error("Failed to detect faces");
  }
};

/**
 * Draw simple detection boxes on canvas
 */
export const drawBasicDetections = (
  canvas: HTMLCanvasElement,
  detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>,
  options: {
    boxColor?: string;
    lineWidth?: number;
    showConfidence?: boolean;
  } = {}
): void => {
  const {
    boxColor = "#00ff00",
    lineWidth = 2,
    showConfidence = true,
  } = options;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.strokeStyle = boxColor;
  ctx.lineWidth = lineWidth;
  ctx.font = "16px Arial";
  ctx.fillStyle = boxColor;

  detections.forEach((detection) => {
    // Draw bounding box
    ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

    // Draw confidence score
    if (showConfidence) {
      const label = `${Math.round(detection.confidence * 100)}%`;
      ctx.fillText(label, detection.x, detection.y - 5);
    }
  });
};
