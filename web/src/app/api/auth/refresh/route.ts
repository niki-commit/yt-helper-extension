import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
    }

    // Find the session in DB
    const session = await prisma.extensionSession.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Generate new pair (Token Rotation)
    const newAccessToken = await signAccessToken(session.userId);
    const newRefreshToken = await signRefreshToken();

    // Update session in DB (and rotate the refresh token)
    await prisma.extensionSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend for another 30 days
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
