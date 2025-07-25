## Overview

This project is a multi-featured, WebSocket-based application that combines a terminal for interacting with a Supabase database and a real-time chat room with voice and sound command capabilities. It leverages NLP (Natural Language Processing) to interpret user inputs and execute corresponding SQL queries against the database. The project is deployed on Render and uses environment variables to securely manage Supabase credentials.

### Key Features

- **Dual-Mode Interface:** A terminal for database queries and a real-time chat room.

- **Guest Chat System:** Users can join a chat room, set a guest name, and communicate with others.

- **🎙️ Walkie-Talkie Push-to-Talk:** Advanced voice messaging system with authentic walkie-talkie sound effects (beep on start, double-beep on stop), visual recording indicators, and keyboard shortcuts (hold SPACEBAR).

- **🎵 Creative Voice Message Replay:** Voice messages feature play count tracking (×1, ×2, ×3...), auto-play for recipients (but not senders), and beautiful UI containers with animated badges.

- **🔒 Private Chat Rooms:** Create isolated chat rooms via `/request?chatId=yourroom&name=yourname` URLs with full feature parity including voice messages and sound commands.

- **Shared Sound Commands:** Play sounds for everyone in the chat instantly by either pasting a direct `.mp3` URL or using the `scream:<search_term>` command to query an external sound API.

- **TTS on Chat for broadcast:** Text to Speech function available for chat room for everyone broadcast with language-specific voices.

- **🎯 Enhanced UX:** Cached microphone permissions (no repeated popups), smart auto-play behavior, and comprehensive error handling.

- **Persistent Sessions:** The app remembers a user's name for their session. A "Reconnect" button allows for easy session restoration if the connection drops.

- **Cross-Platform Audio:** Advanced audio context management with iOS/mobile browser compatibility and autoplay unlocking.

- **NLP-Powered Queries:** Interprets natural language to query database tables.

- **Direct SQL Execution:** Supports raw SQL queries for testing and direct database interaction.

- **Interactive Guide:** An `/about` page provides a rich, interactive overview of the project's features and architecture.

## Prerequisites

- **Node.js** (v18 or higher).

- **npm** (v6 or higher).

* A **Supabase** account and project.

* A **Render** account for deployment.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/alejandrosuarez/appTerminal.git
cd appTerminal
```

### 2. Install Dependencies

This will install `express`, `ws`, and other packages. We also need `node-fetch` for our sound command feature.
```bash
npm install
npm install node-fetch@2
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

* Replace `your-supabase-url` with your Supabase Project URL.

* Replace `your-supabase-anon-key` with your Supabase `anon` key.

### 4. Set Up Supabase (For Testing)

- **Create Tables**: Use the Supabase dashboard to create tables (e.g., a `properties` table).

- **Create Custom SQL Function**: For raw SQL queries, create the custom PostgreSQL `query` function in the Supabase SQL Editor as described in the original README.

## Running the Project Locally

### 1. Start the Server

```bash
npm start
```

The server will run on `http://localhost:5000` (or the `PORT` specified in your environment).

### 2. Open in Browser

The primary interface is the web UI. Open your browser and navigate to:

- **Main App:** `http://localhost:5000`

- **Interactive Guide:** `http://localhost:5000/about`

## Usage

The application has two main modes: the **Terminal** (default) and the **Chat Room**.

### Terminal Commands

These commands are available when you first connect.

- **`sql <query>`**: Execute a raw SQL query.

  * Example: `sql SELECT * FROM properties`

- **`<table_name>`**: Use NLP to query a table directly.

  * Example: `properties`

- **`chat`**: Enter the real-time chat room. You will be prompted for a guest name.

- **`exit`**: Close the entire WebSocket session.

### Chat Room Commands

These commands are available after you type `chat` and enter your name.

- **Send a Text Message:** Type any text and press Enter.

- **🎙️ Send a Voice Message (Walkie-Talkie):** 
  * **Click Method:** Click the red microphone button to start recording, click again to stop
  * **Keyboard Method:** Hold SPACEBAR to record, release to send (hands-free operation)
  * **Features:** Authentic beep sounds, visual recording indicator, cached microphone permissions

- **🎵 Voice Message Playback:**
  * **Auto-play:** Recipients hear voice messages automatically once
  * **Manual Replay:** Click "Replay" button to hear again (increments play count: ×1, ×2, ×3...)
  * **Sender Experience:** Your own messages don't auto-play but can be manually replayed

- **Play a Sound via URL:** Paste a direct link to an `.mp3` file and press Enter. The sound will autoplay for everyone else.

  * Example: `https://www.myinstants.com/media/sounds/identificate-en-esa-monda.mp3`

- **Play a Sound via Search:** Use the `scream:` command to search for a sound and play the first result for everyone else.

  * Example: `scream:victory fanfare`

- **Play a Text-to-Speech Message:** Use the `speak:` command to play a text-to-speech message for everyone else, optionally specifying the language with `en:` (English) or `es:` (Spanish).

  * Example: `speak:en: Hello everyone` (uses UK English Female voice)
  * Example: `speak:es: Hola a todos` (uses Spanish Latin American Male voice)
  * Example: `speak: Hello` (defaults to UK English Female voice)  

- **`exit-chat`:** Leave the chat room and return to the main terminal mode.

### 🔒 Private Chat Rooms

Create isolated chat rooms with custom URLs:

- **URL Format:** `http://localhost:5000/request?chatId=yourroom&name=yourname`
- **Features:** All chat features work in private rooms (voice messages, sound commands, etc.)
- **Isolation:** Private rooms are completely separate from the main chat
- **Example:** `http://localhost:5000/request?chatId=team-meeting&name=Alice`

## Project Structure

- **`server.js`**: Main application file: Express server, WebSocket setup, Supabase client, and terminal command handling. It also serves the `about.html` page.

- **`index.html`**: The main terminal and chat front-end user interface with walkie-talkie features and voice message replay system.

- **`about.html`**: A separate, single-page interactive guide explaining the project's features with bilingual support.

- **`chat.js`**: Server-side module to manage the chat room, users, and messages with session persistence.

- **`request.js`**: Server-side module to handle private chat rooms with isolated functionality and full feature parity.

- **`voice.js`**: Client-side module for the walkie-talkie push-to-talk system with cached microphone permissions and sound effects.

- **`walkie-sounds.js`**: Client-side module for synthetic walkie-talkie sound effects (beeps, static) with cross-platform audio context management.

- **`sound-commands.js`**: Server-side module to handle the `.mp3` and `scream:` commands by calling an external API, with support for private chat rooms.

- **`talk.js`**: Client-side module to handle the `speak:` command for text-to-speech with language-specific voices.

- **`package.json`**: Lists project dependencies and scripts.

## Troubleshooting

- **iOS Audio Issues:** On iOS devices (iPhone/iPad), you must interact with the page once (e.g., tap the command input field or send a message) before sound commands will autoplay. This is due to Apple's security policies.

- **Connection Lost:** If the connection drops, a "Reconnect" button will appear. Clicking it will reload the page and attempt to restore your session automatically.
