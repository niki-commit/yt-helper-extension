import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    // Find and validate the handshake code
    const handshake = await prisma.authHandshake.findUnique({
      where: { code },
    });

    if (!handshake) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (handshake.expiresAt < new Date()) {
      // Delete the expired code
      await prisma.authHandshake.delete({
        where: { id: handshake.id },
      });
      return NextResponse.json({ error: "Expired code" }, { status: 400 });
    }

    // Consume the code (delete it so it can't be used again)
    await prisma.authHandshake.delete({
      where: { id: handshake.id },
    });

    // Generate tokens
    const accessToken = await signAccessToken(handshake.userId);
    const refreshToken = await signRefreshToken();

    const userAgent = request.headers.get("user-agent");

    // PASSIVE CLEANUP: Remove expired or redundant sessions
    // 1. Delete all expired sessions for this user
    await prisma.extensionSession.deleteMany({
      where: {
        userId: handshake.userId,
        expiresAt: { lt: new Date() },
      },
    });

    // 2. Limit concurrent sessions for the same User-Agent (max 5)
    const existingSessions = await prisma.extensionSession.findMany({
      where: {
        userId: handshake.userId,
        userAgent: userAgent,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existingSessions.length >= 5) {
      const idsToDelete = existingSessions.slice(4).map((s) => s.id);
      await prisma.extensionSession.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // Store the extension session
    await prisma.extensionSession.create({
      data: {
        userId: handshake.userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userAgent: userAgent,
      },
    });

    return NextResponse.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
