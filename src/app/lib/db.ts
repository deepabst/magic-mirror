import { PrismaClient } from "@prisma/client";

// Global is used to maintain a single Prisma client instance during development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with proper configuration
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

// In development, store the client on global to avoid re-creating
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Basic types for our application
export interface CreateUserData {
  name: string;
  email?: string;
  faceDescriptor: number[]; // Face embedding as number array
  photos?: string[]; // Array of photo URLs or base64 strings
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  faceDescriptor?: number[];
  photos?: string[];
}

export interface UserData {
  id: string;
  name: string;
  email?: string | null;
  faceDescriptor: any; // JSON data
  photos?: any; // JSON data
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  id: string;
  userId: string;
  timestamp: Date;
  confidence: number;
}

// User CRUD Operations

/**
 * Create a new user with face descriptor
 */
export async function createUser(data: CreateUserData): Promise<UserData> {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        faceDescriptor: data.faceDescriptor,
        photos: data.photos || [],
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.id})`);
    return user as UserData;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as UserData | null;
  } catch (error) {
    console.error("❌ Error getting user by ID:", error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as UserData | null;
  } catch (error) {
    console.error("❌ Error getting user by email:", error);
    return null;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users as UserData[];
  } catch (error) {
    console.error("❌ Error getting all users:", error);
    return [];
  }
}

/**
 * Update user data
 */
export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<UserData | null> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.faceDescriptor && { faceDescriptor: data.faceDescriptor }),
        ...(data.photos && { photos: data.photos }),
      },
    });

    console.log(`✅ Updated user: ${user.name} (${user.id})`);
    return user as UserData;
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return null;
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id },
    });

    console.log(`✅ Deleted user: ${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return false;
  }
}

// Face Descriptor Operations

/**
 * Get all face descriptors for matching
 * Returns array of descriptors with user info for face recognition
 */
export async function getAllFaceDescriptors(): Promise<
  Array<{
    descriptor: number[];
    userId: string;
    name: string;
  }>
> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        faceDescriptor: true,
      },
    });

    return users.map((user: any) => ({
      descriptor: user.faceDescriptor as number[],
      userId: user.id,
      name: user.name,
    }));
  } catch (error) {
    console.error("❌ Error getting face descriptors:", error);
    return [];
  }
}

/**
 * Find user by face descriptor similarity
 */
export async function findUserByFaceDescriptor(
  inputDescriptor: number[],
  threshold: number = 0.6
): Promise<UserData | null> {
  try {
    const users = await getAllFaceDescriptors();

    // Simple Euclidean distance calculation
    let bestMatch: { user: UserData | null; distance: number } = {
      user: null,
      distance: threshold,
    };

    for (const userData of users) {
      const distance = calculateEuclideanDistance(
        inputDescriptor,
        userData.descriptor
      );

      if (distance < bestMatch.distance) {
        const user = await getUserById(userData.userId);
        bestMatch = { user, distance };
      }
    }

    if (bestMatch.user) {
      console.log(
        `✅ Found matching user: ${
          bestMatch.user.name
        } (distance: ${bestMatch.distance.toFixed(3)})`
      );
    }

    return bestMatch.user;
  } catch (error) {
    console.error("❌ Error finding user by face descriptor:", error);
    return null;
  }
}

// Session Operations

/**
 * Create a recognition session
 */
export async function createSession(
  userId: string,
  confidence: number
): Promise<SessionData | null> {
  try {
    const session = await prisma.session.create({
      data: {
        userId,
        confidence,
      },
    });

    console.log(
      `✅ Created session for user: ${userId} (confidence: ${confidence.toFixed(
        3
      )})`
    );
    return session as SessionData;
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return null;
  }
}

/**
 * Get recent sessions for a user
 */
export async function getUserSessions(
  userId: string,
  limit: number = 10
): Promise<SessionData[]> {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return sessions as SessionData[];
  } catch (error) {
    console.error("❌ Error getting user sessions:", error);
    return [];
  }
}

/**
 * Get all recent sessions with user data
 */
export async function getAllSessions(
  limit: number = 50
): Promise<Array<SessionData & { user: UserData }>> {
  try {
    const sessions = await prisma.session.findMany({
      include: { user: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return sessions as Array<SessionData & { user: UserData }>;
  } catch (error) {
    console.error("❌ Error getting all sessions:", error);
    return [];
  }
}

// Utility Functions

/**
 * Calculate Euclidean distance between two face descriptors
 */
function calculateEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error("Descriptors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  userCount: number;
  sessionCount: number;
  recentSessions: number;
}> {
  try {
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const recentSessions = await prisma.session.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return { userCount, sessionCount, recentSessions };
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
    return { userCount: 0, sessionCount: 0, recentSessions: 0 };
  }
}

// Export Prisma client for direct use if needed
export default prisma;
