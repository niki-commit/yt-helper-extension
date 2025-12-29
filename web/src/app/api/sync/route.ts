import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videos, notes } = await request.json();

    // We need the profile for foreign key constraints in Video and Note
    const profile = await prisma.profile.findUnique({
      where: { id: session.userId },
    });

    if (!profile) {
      await prisma.profile.create({
        data: {
          id: session.userId,
          email: `${session.userId}@sync.local`, // Enriched on dashboard visit
          fullName: "Extension User",
        },
      });
    }

    // 1. Sync Videos (UPSERT)
    if (videos && Array.isArray(videos)) {
      for (const video of videos) {
        try {
          await prisma.video.upsert({
            where: {
              userId_youtubeId: {
                userId: session.userId,
                youtubeId: video.youtubeId,
              },
            },
            update: {
              title: video.title,
              thumbnailUrl:
                video.thumbnailUrl ||
                `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`,
              bookmarkTime: video.bookmarkTime,
              lastWatchedAt: video.lastWatchedAt
                ? new Date(video.lastWatchedAt)
                : undefined,
            },
            create: {
              userId: session.userId,
              youtubeId: video.youtubeId,
              title: video.title,
              thumbnailUrl:
                video.thumbnailUrl ||
                `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`,
              bookmarkTime: video.bookmarkTime,
              lastWatchedAt: video.lastWatchedAt
                ? new Date(video.lastWatchedAt)
                : new Date(),
            },
          });
        } catch (vError) {
          console.error(
            `Sync: Failed to upsert video ${video.youtubeId}:`,
            vError
          );
        }
      }
    }

    // 2. Sync Notes with RECONCILIATION
    const incomingNotesByVideo: Record<string, any[]> = {};
    if (notes && Array.isArray(notes)) {
      for (const note of notes) {
        if (!incomingNotesByVideo[note.youtubeId]) {
          incomingNotesByVideo[note.youtubeId] = [];
        }
        incomingNotesByVideo[note.youtubeId].push(note);
      }
    }

    // Iterate through all provided videos to reconcile notes
    const youtubeIdsToReconcile =
      videos && Array.isArray(videos)
        ? videos.map((v) => v.youtubeId)
        : Object.keys(incomingNotesByVideo);

    for (const youtubeId of youtubeIdsToReconcile) {
      try {
        const incomingNotes = incomingNotesByVideo[youtubeId] || [];

        // Find the video ID
        const videoRecord = await prisma.video.findUnique({
          where: {
            userId_youtubeId: {
              userId: session.userId,
              youtubeId: youtubeId,
            },
          },
        });

        if (!videoRecord) {
          continue;
        }

        // 1. Upsert incoming notes for this video
        for (const note of incomingNotes) {
          await prisma.note.upsert({
            where: { id: note.id },
            update: {
              text: note.text,
              timestamp: note.timestamp,
              updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
            },
            create: {
              id: note.id,
              userId: session.userId,
              videoId: videoRecord.id,
              text: note.text,
              timestamp: note.timestamp,
              createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
              updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
            },
          });
        }

        // 2. Reconciliation: Delete notes in DB that are NOT in the incoming list for THIS video
        const incomingIds = incomingNotes.map((n) => n.id);
        await prisma.note.deleteMany({
          where: {
            videoId: videoRecord.id,
            userId: session.userId,
            id: { notIn: incomingIds },
          },
        });
      } catch (reconError) {
        console.error(
          `Sync: Reconciliation failed for video ${youtubeId}:`,
          reconError
        );
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        videos: videos?.length || 0,
        notes: notes?.length || 0,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
