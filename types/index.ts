// Webcam related types
export interface WebcamProps {
  onCapture: (imageSrc: string) => void;
  className?: string;
}

export interface WebcamComponentState {
  isActive: boolean;
  hasPermission: boolean;
  permissionError: string | null;
  isLoading: boolean;
}

// Face recognition types (for future use)
export interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  landmarks?: number[][];
  descriptor?: Float32Array;
}

export interface RecognitionResult {
  userId: string;
  name: string;
  confidence: number;
}

// User management types (for future use)
export interface User {
  id: string;
  name: string;
  email?: string;
  faceDescriptor: number[];
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Camera constraints
export interface CameraConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "user" | "environment";
}

// Common utility types
export type CaptureCallback = (imageSrc: string) => void;
export type ErrorCallback = (error: string) => void;
export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";
