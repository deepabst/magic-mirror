import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  getAllUsers,
  testDatabaseConnection,
  getDatabaseStats,
  type CreateUserData,
} from "../../lib/db";

// GET /api/users - Get all users or database stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Test database connection first
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    if (action === "stats") {
      // Return database statistics
      const stats = await getDatabaseStats();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // Return all users
    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

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

    // Check if email already exists (if provided)
    if (body.email) {
      const { getUserByEmail } = await import("../../lib/db");
      const existingUser = await getUserByEmail(body.email);
      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Create user data
    const userData: CreateUserData = {
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      faceDescriptor: body.faceDescriptor,
      photos: body.photos || [],
    };

    // Create the user
    const user = await createUser(userData);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          photoCount: Array.isArray(user.photos) ? user.photos.length : 0,
        },
        message: `User ${user.name} created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error in POST /api/users:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
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
