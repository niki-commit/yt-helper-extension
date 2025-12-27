# WXT + VideoNotes - YouTube Study Companion

VideoNotes is a high-performance browser extension designed to transform YouTube into a professional study and research workspace. It allows you to take timestamped notes, manage bookmarks, and maintain a distraction-free learning environment directly within the YouTube interface.

## 🚀 Key Features

### 📝 Professional Note-Taking
- **Keyboard Optimized**: Take notes instantly with `Alt+N`.
- **Spacebar Isolation**: Confidently type notes without triggering YouTube's playback shortcuts.
- **Inline Editing**: Double-click or hover to edit notes on the fly. Cursor automatically positions at the end for seamless updates.
- **Clickable Timestamps**: Every note is linked to the exact second in the video.

### 🔍 Smart Organization
- **Sidebar Search**: Instantly filter through your notes for specific keywords.
- **Auto-Syncing**: Notes are automatically saved to your local browser storage (IndexedDB) and tied to the specific video ID.
- **Persistence Guard**: Robust mounting logic ensures the sidebar stays visible even during complex YouTube SPA navigations and hard refreshes.

### 🛡️ Deep Focus Mode
- **No-Distraction Settings**: Hide recommendations and ads while keeping necessary components like comments visible for doubts.
- **Auto-Pause**: Automatically pause playback when you're focused on writing, ensuring you don't miss a beat.

### 📤 Seamless Export
- **Markdown Export**: Download your entire session's notes as a clean, professionally formatted `.md` file, perfect for Obsidian, Notion, or Roam Research.

## 🛠️ Technology Stack
- **Framework**: [WXT](https://wxt.dev/) (Web Extension Toolbox)
- **UI Architecture**: React + Tailwind CSS + Shadcn/UI
- **Storage Layer**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **Language**: TypeScript

## 📦 Getting Started

1. Clone the repository.
2. Install dependencies: `npm install` (in the `extension` folder).
3. Start development: `npm run dev`.
4. Build for production: `npm run build`.

---
*Built for developers, researchers, and lifelong learners.*
