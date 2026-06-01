# Dev-Pocket 📱

> A modern, premium, offline-first mobile application built for developers to save, organize, manage, and dynamically understand code snippets directly on their device.

[![Watch the Demo Video](https://img.shields.io/badge/Watch%20Demo%20Video-X%20(Twitter)-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/Sameer_1_1_9/status/2061435795358310690?s=20)

### 🎥 Demo Video Link
👉 **[Watch the Dev-Pocket Demo Video on X (Twitter)](https://x.com/Sameer_1_1_9/status/2061435795358310690?s=20)**

---

## ✨ Core Features

### 1. Snippet Playground & Starred Bookmarks
* **Local Offline Storage**: All code snippets are stored offline on the device using a structured **SQLite** database. No internet required to browse, create, edit, or delete items.
* **Instant Star Filters**: Bookmark and tag key routines to access them instantly from the starred Quick-Access view.

### 2. High-Performance Tokenizer (CodeViewer)
* **Custom Syntax Highlighter**: Built a custom, high-speed sequential regex tokenizer that colorizes code scopes line-by-line natively without heavy external libraries.
* **Supported Languages**: Colorizes and styles variables, strings, comments, numbers, keywords, and operators for **11 languages**:
  * *TypeScript (`.ts`), JavaScript (`.js`), Python (`.py`), Go (`.go`), Rust (`.rs`), SQL (`.sql`), HTML (`.html`), CSS (`.css`), JSON (`.json`), Shell (`.sh`), and plain Text (`.txt`).*
* **One-tap Copy**: Easily copy the snippet to your device clipboard with real-time HUD confirmation.

### 3. Intelligent AI Developer Briefing
* **Offline Static AI Engine**: Analyzes your imports, functional keywords, asynchronous routines, and rendering cycles locally on the device thread to generate code logic summaries and recommended improvements.
* **Secure Gemini Cloud API**: Option to securely store a Google Gemini API Key in the device's **SecureStore** to consult advanced `gemini-2.5-flash` models for deep live compiler audits.
* **Smart Persistence Cache**: AI explanations are saved directly inside SQLite, letting you read them completely offline forever after they are generated.

### 4. Sandboxed Terminal Explorer
* **Expo FileSystem Sandbox**: Operates inside a secure app Document directory sandbox `dev_pocket/`.
* **Seeded Cheat Sheets**: Pre-populated with React Lifecycle summaries, SQL indexing crash courses, and TypeScript utility type cheat sheets on the first launch.
* **Folder Actions**: Supports creating subdirectories, deleting folders, moving or copying files, and attaching references/screenshots using `expo-image-picker`.

### 5. Management Toolbar & Native Sharing
* **Multi-Format Export**: Write snippets into your Sandbox folders in `.TXT`, `.JS`, or `.JSON` representations.
* **System OS Sheets**: Leverages `expo-sharing` to launch native OS sharing panels, letting you send files directly to external apps like Slack, Discord, Mail, or Notes.

---

## 🛠️ Technology Stack

* **Core Framework**: Expo SDK 55 (React Native & TypeScript)
* **Database engine**: `expo-sqlite@55.0.16` (Synchronous thread calls)
* **Encryption Storage**: `expo-secure-store@55.0.14`
* **Local File Sandbox**: `expo-file-system@55.0.22` (Class-based Directory/File API)
* **Theme Cache**: `@react-native-async-storage/async-storage@2.2.0`
* **Safe Inset Management**: `react-native-safe-area-context`
* **Tactile Styling**: HSL tailored theme variables (Obsidian Dark first & Slate Light secondary)

---

## 🏛️ Application Directory Tree

```
src/
├── app/
│   ├── _layout.tsx              # Root Layout, unified DB, AI, and Theme context hooks
│   ├── index.tsx                # Base Redirector routing to tabs
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar navigator (Icons: snippets, stars, sandbox, settings)
│   │   ├── index.tsx            # Home Screen: Search boxes, language pills selection, preview grids
│   │   ├── favorites.tsx        # Starred Screen: Starred SQLite list query
│   │   ├── files.tsx            # File Manager: Directory navigation breadcrumbs
│   │   └── settings.tsx         # Preferences: Gemini secure inputs, SQLite stats
│   ├── snippet/
│   │   ├── [id].tsx             # Details Screen: CodeViewer, cached AI explanations, utilities
│   │   ├── create.tsx           # New Snippet Form: Code editors, tags, image pickers
│   │   └── edit.tsx             # Edit Snippet Form: SQLite update execution
│   └── files/
│       └── viewer.tsx           # File Viewer: Tokenized text highlighters & image scalers
├── components/
│   ├── CodeViewer.tsx           # Regex tokenized syntax highlighting scrolls
│   ├── GlassCard.tsx            # Translucent glassmorphic dark container cards
│   └── Button.tsx               # Tactics active-state feedback buttons
├── constants/
│   ├── theme.ts                 # Premium theme colors and shadows constants
│   └── languages.ts             # Keyword mappings for syntax highlighting
├── context/
│   ├── ThemeContext.tsx         # Preference toggles cached in AsyncStorage
│   ├── ApiKeyContext.tsx        # Sensitive API key encryption in SecureStore
│   └── DBContext.tsx            # SQLite query actions & seeds
└── services/
    ├── ai.ts                    # Live Gemini & Offline regex static analyzer
    ├── filesystem.ts            # Sandboxed FileSystem Directory & File wrappers
    └── export.ts                # TXT, JS, JSON export compilers
```

---

## 🚀 Get Started

### 1. Installation

Clone this repository to your system, enter the workspace directory, and install dependency packages using `bun` (or `npm`):

```bash
bun install
```

### 2. Launch the Metro Bundler

Fire up your local bundling server:

```bash
bun start
```

### 3. Clear Metro Cache (Recommended on Setup)

If you are changing packages or setting up the WASM web configurations for the first time, run with a cleared Metro bundler cache:

```bash
bun start --clear
```

In your active server CLI, press:
* **`a`** to open in Android Emulators.
* **`i`** to open in iOS Simulators.
* **`w`** to launch web mode.
