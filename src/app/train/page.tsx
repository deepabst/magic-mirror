"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Camera, User, Mail, AlertCircle } from "lucide-react";

interface TrainingPhoto {
  id: number;
  imageData: string;
  faceDetected: boolean;
  descriptor?: Float32Array;
}

interface UserFormData {
  name: string;
  email: string;
}

export default function TrainingPage() {
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
  });
  const [currentStep, setCurrentStep] = useState<
    "form" | "capture" | "processing" | "complete"
  >("form");

  // Photo capture state
  const [photos, setPhotos] = useState<TrainingPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Camera and face detection
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const TARGET_PHOTOS = 8; // Number of photos to capture
  const CAPTURE_DELAY = 3; // Countdown seconds

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
        setError("Failed to load face recognition models");
      }
    };
    loadModels();
  }, []);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setCurrentStep("capture");
  };

  // Detect face in image
  const detectFaceInImage = async (
    imageElement: HTMLImageElement
  ): Promise<Float32Array | null> => {
    try {
      const detection = await faceapi
        .detectSingleFace(
          imageElement,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection?.descriptor || null;
    } catch (error) {
      console.error("Face detection error:", error);
      return null;
    }
  };

  // Capture photo with countdown
  const startPhotoCapture = useCallback(() => {
    if (!modelsLoaded || isCapturing) return;

    setIsCapturing(true);
    setCaptureCountdown(CAPTURE_DELAY);

    const countdown = setInterval(() => {
      setCaptureCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [modelsLoaded, isCapturing]);

  // Capture and process photo
  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture image");
        setIsCapturing(false);
        return;
      }

      // Create image element for face detection
      const img = new Image();
      img.onload = async () => {
        const descriptor = await detectFaceInImage(img);

        const newPhoto: TrainingPhoto = {
          id: Date.now(),
          imageData: imageSrc,
          faceDetected: descriptor !== null,
          descriptor: descriptor || undefined,
        };

        setPhotos((prev) => [...prev, newPhoto]);
        setCurrentPhotoIndex((prev) => prev + 1);
        setIsCapturing(false);

        if (currentPhotoIndex + 1 >= TARGET_PHOTOS) {
          // All photos captured, move to processing
          setCurrentStep("processing");
        }
      };
      img.src = imageSrc;
    } catch (error) {
      console.error("Error capturing photo:", error);
      setError("Failed to process captured image");
      setIsCapturing(false);
    }
  }, [currentPhotoIndex]);

  // Process all photos and submit training data
  const processTrainingData = useCallback(async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Filter photos with valid face descriptors
      const validPhotos = photos.filter((photo) => photo.descriptor);

      if (validPhotos.length < 3) {
        setError(
          `Need at least 3 photos with detected faces. Got ${validPhotos.length}.`
        );
        setIsProcessing(false);
        return;
      }

      // Average the face descriptors for better accuracy
      const descriptorArrays = validPhotos.map((photo) =>
        Array.from(photo.descriptor!)
      );
      const avgDescriptor = descriptorArrays[0].map(
        (_, i) =>
          descriptorArrays.reduce((sum, desc) => sum + desc[i], 0) /
          descriptorArrays.length
      );

      // Submit to API
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          faceDescriptor: avgDescriptor,
          photos: validPhotos.map((p) => ({
            imageData: p.imageData,
            timestamp: new Date().toISOString(),
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(
          `Successfully registered ${formData.name}! Used ${validPhotos.length} photos for training.`
        );
        setCurrentStep("complete");
      } else {
        setError(result.error || "Failed to register user");
      }
    } catch (error) {
      console.error("Error processing training data:", error);
      setError("Failed to process training data");
    } finally {
      setIsProcessing(false);
    }
  }, [photos, formData]);

  // Auto-process when step changes to processing
  useEffect(() => {
    if (currentStep === "processing" && photos.length > 0) {
      processTrainingData();
    }
  }, [currentStep, photos, processTrainingData]);

  // Reset training
  const resetTraining = () => {
    setFormData({ name: "", email: "" });
    setPhotos([]);
    setCurrentPhotoIndex(0);
    setCurrentStep("form");
    setError("");
    setSuccess("");
  };

  // Render form step
  const renderFormStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Registration
        </CardTitle>
        <CardDescription>
          Enter your details to start face recognition training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Start Training
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Render capture step
  const renderCaptureStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Capture ({currentPhotoIndex + 1}/{TARGET_PHOTOS})
          </CardTitle>
          <CardDescription>
            We'll capture {TARGET_PHOTOS} photos to train the face recognition
            system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress
            value={(currentPhotoIndex / TARGET_PHOTOS) * 100}
            className="w-full"
          />

          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
            />

            {captureCountdown > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-6xl font-bold">
                  {captureCountdown}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={startPhotoCapture}
              disabled={!modelsLoaded || isCapturing}
              size="lg"
            >
              {isCapturing
                ? "Capturing..."
                : `Capture Photo ${currentPhotoIndex + 1}`}
            </Button>
          </div>

          {!modelsLoaded && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Loading face recognition models...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Photo preview grid */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.imageData}
                    alt={`Capture ${photo.id}`}
                    className="w-full h-24 object-cover rounded border-2"
                    style={{
                      borderColor: photo.faceDetected ? "#22c55e" : "#ef4444",
                    }}
                  />
                  <div className="absolute top-1 right-1">
                    {photo.faceDetected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Processing Training Data</CardTitle>
        <CardDescription>
          Analyzing your photos and creating face recognition profile...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          This may take a few moments...
        </p>
      </CardContent>
    </Card>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          Training Complete!
        </CardTitle>
        <CardDescription>
          Your face recognition profile has been created successfully
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button onClick={resetTraining} variant="outline" className="flex-1">
            Train Another User
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="flex-1"
          >
            Go to Mirror
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Face Recognition Training
          </h1>
          <p className="text-gray-600">
            Register yourself for personalized greetings
          </p>
        </div>

        {error && (
          <Alert className="mb-6 max-w-md mx-auto" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === "form" && renderFormStep()}
        {currentStep === "capture" && renderCaptureStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "complete" && renderCompleteStep()}
      </div>
    </div>
  );
}
