import { NextRequest, NextResponse } from "next/server";
import {
  findUserByFaceDescriptor,
  createSession,
  getAllFaceDescriptors,
} from "../../lib/db";

// POST /api/recognize - Recognize a face from descriptor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate face descriptor
    if (!body.faceDescriptor || !Array.isArray(body.faceDescriptor)) {
      return NextResponse.json(
        { error: "Valid face descriptor is required" },
        { status: 400 }
      );
    }

    // Validate face descriptor length (face-api.js typically uses 128 dimensions)
    if (body.faceDescriptor.length !== 128) {
      return NextResponse.json(
        { error: "Face descriptor must be 128 dimensions" },
        { status: 400 }
      );
    }

    // Get recognition threshold (default: 0.6)
    const threshold = body.threshold || 0.6;
    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: "Threshold must be between 0 and 1" },
        { status: 400 }
      );
    }

    // Find matching user
    const matchedUser = await findUserByFaceDescriptor(
      body.faceDescriptor,
      threshold
    );

    if (matchedUser) {
      // Calculate confidence score (1 - distance, approximated)
      const confidence = body.confidence || 0.8; // Default if not provided

      // Create a session record
      await createSession(matchedUser.id, confidence);

      return NextResponse.json({
        success: true,
        recognized: true,
        data: {
          userId: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          confidence: confidence,
          timestamp: new Date().toISOString(),
        },
        message: `Welcome back, ${matchedUser.name}!`,
      });
    } else {
      return NextResponse.json({
        success: true,
        recognized: false,
        data: null,
        message: "No matching user found",
        threshold: threshold,
      });
    }
  } catch (error) {
    console.error("❌ Error in POST /api/recognize:", error);
    return NextResponse.json(
      { error: "Face recognition failed" },
      { status: 500 }
    );
  }
}

// GET /api/recognize - Get recognition statistics or test data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "descriptors") {
      // Return all face descriptors for testing
      const descriptors = await getAllFaceDescriptors();
      return NextResponse.json({
        success: true,
        data: descriptors.map((d) => ({
          userId: d.userId,
          name: d.name,
          descriptorLength: d.descriptor.length,
        })),
        count: descriptors.length,
      });
    }

    if (action === "test") {
      // Return test endpoint info
      return NextResponse.json({
        success: true,
        message: "Face recognition API is working",
        endpoints: {
          POST: "/api/recognize - Recognize face from descriptor",
          GET_descriptors:
            "/api/recognize?action=descriptors - Get stored descriptors",
          GET_test: "/api/recognize?action=test - This endpoint",
        },
        requirements: {
          faceDescriptor: "Array of 128 numbers",
          threshold: "Optional, 0-1, default 0.6",
          confidence: "Optional, 0-1, for session recording",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error in GET /api/recognize:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
