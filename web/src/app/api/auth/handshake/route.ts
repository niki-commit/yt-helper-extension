import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = data.claims.sub;

  // PASSIVE CLEANUP: Remove expired handshake codes for this user
  // This keeps the table lean without requiring a separate cron job
  await prisma.authHandshake.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { userId: userId }],
    },
  });

  // Generate a random 64-character code
  const code = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Store in DB with a 5-minute expiry
  await prisma.authHandshake.create({
    data: {
      code,
      userId: userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  return NextResponse.json({ code });
}
