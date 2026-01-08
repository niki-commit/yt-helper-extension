import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NotesList } from "@/components/NotesList";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all cloud notes with video titles
  const cloudNotes = await prisma.note.findMany({
    where: {
      userId: user.id,
    },
    include: {
      video: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const formattedNotes = cloudNotes.map((n) => ({
    id: n.id,
    videoId: n.videoId,
    videoTitle: n.video?.title || "Unknown Video",
    timestamp: n.timestamp,
    text: n.text,
    updatedAt: n.updatedAt.getTime(),
    isLocal: false,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-12">
        <div className="mb-2 flex items-center gap-3 text-[10px] font-black tracking-widest text-indigo-500 uppercase">
          <div className="h-0.5 w-10 bg-indigo-500" />
          <span>Global Library</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          All Notes
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Search across every insight you've captured
        </p>
      </header>

      <NotesList initialCloudNotes={formattedNotes} />
    </div>
  );
}
