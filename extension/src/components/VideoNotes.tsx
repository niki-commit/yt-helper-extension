import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { localStore } from '@/storage/dexie';
import { Note } from '@/storage/types';
import { getCurrentTime, seekTo, formatTime, pauseVideo, playVideo, waitForPlayer } from '@/utils/youtube';
import { Bookmark, Play, Pause, Save, Trash2, Plus, Search, Pencil, Download, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface VideoNotesProps {
  videoId: string;
}

export default function VideoNotes({ videoId }: VideoNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [hasBookmark, setHasBookmark] = useState(false);
  const [bookmarkTime, setBookmarkTime] = useState<number | null>(null);
  
  // New features state
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    loadNotes();
    checkBookmark();
  }, [videoId]);

  const loadNotes = async () => {
    try {
        const loaded = await localStore.getNotes(videoId);
        setNotes(loaded);
    } catch (err) {
        // Silently fail or handle gracefully in production
    }
  };

  const checkBookmark = async () => {
    const video = await localStore.getVideo(videoId);
    if (video && video.bookmarkTimestamp !== null && video.bookmarkTimestamp !== undefined) {
      setHasBookmark(true);
      setBookmarkTime(video.bookmarkTimestamp);
    } else {
        setHasBookmark(false);
        setBookmarkTime(null);
    }
  };

  const handleAddNote = async () => {
    // Wait for player to be ready before capturing timestamp
    const isReady = await waitForPlayer();
    if (!isReady) {
      console.warn('Player not ready, cannot add note');
      return;
    }
    
    const time = getCurrentTime();
    setCurrentTimestamp(time);
    setNoteText('');
    setIsAdding(true);
    pauseVideo();
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    
    const newNote: Note = {
      id: uuidv4(),
      videoId: videoId,
      timestamp: currentTimestamp,
      text: noteText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
        await localStore.saveNote(newNote);
        await loadNotes();
        setIsAdding(false);
        playVideo();
    } catch (err) {
        // Handle error
    }
  };

  const handleCancelNote = () => {
    setIsAdding(false);
    playVideo();
  };

  const handleDeleteNote = async (id: string) => {
    await localStore.deleteNote(id);
    await loadNotes();
  };

  const handleNoteClick = (timestamp: number) => {
    seekTo(timestamp);
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditingText(note.text);
    pauseVideo();
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    playVideo();
  };

  const handleUpdateNote = async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note || !editingText.trim()) return;

      const updatedNote: Note = {
          ...note,
          text: editingText,
          updatedAt: Date.now()
      };

      try {
          await localStore.saveNote(updatedNote);
          await loadNotes();
          setEditingId(null);
          setEditingText('');
          playVideo();
      } catch (err) {
          // Handle error
      }
  };

  const handleExport = () => {
      if (notes.length === 0) return;

      const title = document.title.replace(' - YouTube', '') || 'Video Notes';
      const url = window.location.href.split('&')[0];
      
      let md = `# Notes for: ${title}\n`;
      md += `Source: ${url}\n`;
      if (bookmarkTime !== null) {
          const timestamp = formatTime(bookmarkTime);
          const seekUrl = `${url}&t=${Math.floor(bookmarkTime)}s`;
          md += `Bookmark: [${timestamp}](${seekUrl})\n`;
      }
      md += `\n`;
      
      notes.forEach(note => {
          const timestamp = formatTime(note.timestamp);
          const seekUrl = `${url}&t=${Math.floor(note.timestamp)}s`;
          md += `### [${timestamp}](${seekUrl})\n${note.text}\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
  };

  const filteredNotes = notes.filter(n => 
      n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookmark = async () => {
    if (hasBookmark) {
      await localStore.setBookmark(videoId, null);
      setHasBookmark(false);
    } else {
      // Wait for player to be ready before capturing timestamp
      const isReady = await waitForPlayer();
      if (!isReady) {
        console.warn('Player not ready, cannot set bookmark');
        return;
      }
      
      const time = getCurrentTime();
      await localStore.setBookmark(videoId, time);
      setHasBookmark(true);
      setBookmarkTime(time);
    }
  };

  const resumeVideo = () => {
      if (bookmarkTime !== null) {
          seekTo(bookmarkTime);
      }
  }

  return (
    <div className="my-4 font-sans text-base antialiased text-slate-900 dark:text-slate-50">
      <Card className="w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            VideoNotes
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400">
              {notes.length}
            </span>
          </CardTitle>
          <div className="flex gap-2">
            {hasBookmark && (
                 <Button variant="outline" size="sm" onClick={resumeVideo} className="h-8 text-xs">
                    Resume {bookmarkTime ? formatTime(bookmarkTime) : ''}
                 </Button>
            )}
            <Button
              variant={hasBookmark ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleBookmark}
              title="Toggle Bookmark"
            >
              <Bookmark className={`h-4 w-4 ${hasBookmark ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleExport}
              title="Export to Markdown"
              disabled={notes.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddNote} className="h-8 gap-1">
              <Plus className="h-4 w-4" /> Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
                type="search"
                placeholder="Search notes..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isAdding && (
            <div className="mb-4 space-y-2 border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Timestamp: {formatTime(currentTimestamp)}</span>
              </div>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type your note here..."
                className="min-h-[80px] text-sm resize-none"
                autoFocus
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    // Stop propagation aggressively to prevent YouTube shortcuts
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    
                    if (e.key === 'Enter' && e.ctrlKey) {
                        handleSaveNote();
                    } else if (e.key === 'Escape') {
                        handleCancelNote();
                    }
                }}
                onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}
                onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelNote} className="h-7 text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNote} className="h-7 text-xs gap-1">
                  <Save className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {notes.length === 0 && !isAdding && (
                <div className="text-center text-sm text-slate-400 py-8">
                  No notes yet. Add one to start learning!
                </div>
              )}
              {notes.length > 0 && filteredNotes.length === 0 && searchQuery && (
                <div className="text-center text-sm text-slate-400 py-8">
                  No notes found matching "{searchQuery}"
                </div>
              )}
              {filteredNotes.map((note) => (
                <div key={note.id} className="group flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-md transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => handleNoteClick(note.timestamp)}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-700 font-mono font-medium hover:underline self-start mt-0.5"
                    >
                      {formatTime(note.timestamp)}
                    </button>

                    {editingId === note.id ? (
                        <div className="flex-grow space-y-2">
                            <Textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="min-h-[60px] text-sm resize-none"
                                autoFocus
                                onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    if (e.key === 'Enter' && e.ctrlKey) handleUpdateNote(note.id);
                                    if (e.key === 'Escape') cancelEditing();
                                }}
                                onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                }}
                                onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-7 px-2 text-xs">
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={() => handleUpdateNote(note.id)} className="h-7 px-2 text-xs">
                                    Update
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-grow text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {note.text}
                            </div>
                            <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditing(note)}
                                    className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                    title="Edit note"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete note"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
