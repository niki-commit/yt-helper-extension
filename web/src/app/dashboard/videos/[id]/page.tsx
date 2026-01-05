import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { VideoStudySession } from "@/components/VideoStudySession";
import { LocalVideoStudySession } from "@/components/LocalVideoStudySession";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
  });
  return {
    title: video ? `Deep Focus: ${video.title}` : "Video Not Found",
  };
}

export default async function VideoStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch from Prisma (Cloud data)
  const video = await prisma.video.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      notes: {
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });

  // 2. If not found in Prisma, it might be a local video (detected via videoId)
  // In a real app, we'd handle "Local-Only" videos here too.
  // For now, if it's not in Prisma, we search by youtubeId if id looks like one
  let activeVideo = video;
  if (!activeVideo) {
    activeVideo = (await prisma.video.findFirst({
      where: {
        youtubeId: id,
        userId: user.id,
      },
      include: {
        notes: {
          orderBy: { timestamp: "asc" },
        },
      },
    })) as any;
  }

  if (!activeVideo) {
    // Render the local handler if not in cloud
    return <LocalVideoStudySession youtubeId={id} />;
  }

  return (
    <VideoStudySession
      id={activeVideo.id}
      youtubeId={activeVideo.youtubeId}
      title={activeVideo.title}
      initialNotes={activeVideo.notes.map((n: any) => ({
        id: n.id,
        timestamp: n.timestamp,
        text: n.text,
      }))}
    />
  );
}
