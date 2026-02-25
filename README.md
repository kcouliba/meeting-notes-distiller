# Meeting Notes Distiller

> From chaotic notes to a professional meeting report in 10 seconds. Ready for Slack, Email, or Notion.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4)](https://ai.google.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Features

- **Zero setup** — No bots to install, no integrations to configure. Paste your notes and go.
- **Multi-format output** — Export as Markdown, Slack, Email, or Notion-ready formatting.
- **Smart extraction** — AI identifies decisions, action items with assignees and deadlines, and open questions.
- **Kanban board** — Cross-meeting task board with drag-and-drop. Action items are auto-populated when meetings are saved.
- **Meeting history** — Browse, reload, and delete past meetings from the sidebar.
- **File upload** — Import `.vtt`, `.srt`, or `.txt` transcript files directly.
- **Self-hosted** — Your data stays on your server. SQLite database with no external dependencies.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/kcouliba/meeting-notes-distiller.git
cd meeting-notes-distiller

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Google Gemini API key

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

```bash
docker build --network=host -t meeting-notes-distiller .
docker run -e GOOGLE_API_KEY=your_key_here -p 3000:3000 -v meeting-data:/app/data meeting-notes-distiller
```

The `-v meeting-data:/app/data` flag persists your meeting history and tasks across container restarts. If the build works without `--network=host`, you can omit it.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| AI | Google Gemini 2.5 Flash |
| Styling | Tailwind CSS |
| UI Components | Radix UI + shadcn/ui |
| Drag & Drop | @dnd-kit |
| Database | SQLite (better-sqlite3) |
| Testing | Jest + React Testing Library |

## Project Structure

```
├── app/
│   ├── api/distill/       # AI processing endpoint
│   ├── api/format/        # Output format conversion endpoint
│   ├── api/meetings/      # Meeting history CRUD endpoints
│   ├── api/tasks/         # Task CRUD and reorder endpoints
│   ├── kanban/            # Kanban board page
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main distiller page
├── components/
│   ├── ui/                # Reusable UI primitives (shadcn/ui)
│   ├── kanban/            # Kanban board components (columns, cards)
│   ├── AppHeader.tsx      # Shared header with nav tabs
│   ├── NotesInput.tsx     # Text input with file upload
│   ├── OutputDisplay.tsx  # Formatted report display
│   ├── FormatSelector.tsx # Markdown/Slack/Email/Notion switcher
│   ├── ActionBar.tsx      # Copy/clear actions
│   ├── HistorySidebar.tsx # Meeting history sidebar
│   └── HistoryItem.tsx    # Individual history entry
├── lib/
│   ├── db.ts              # SQLite database layer with migrations
│   ├── formatters/        # Output format transformers
│   ├── parsers/           # File parsers (VTT, SRT, TXT)
│   └── prompts.ts         # AI prompt templates
├── types/
│   └── meeting.ts         # TypeScript type definitions
└── __tests__/             # Test suite (216 tests)
```

## How It Works

1. **Paste or Upload** — Drop your raw meeting notes into the input area, or upload a `.vtt`, `.srt`, or `.txt` transcript file.
2. **Distill** — Gemini 2.5 Flash extracts structure: summary, decisions, action items, open questions, and participants.
3. **Export** — Switch between Markdown, Slack, Email, or Notion format and copy to clipboard.
4. **Track** — Action items automatically appear on the Kanban board. Drag cards between To Do, In Progress, In Review, and Done.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key ([get one here](https://aistudio.google.com/apikey)) | Yes |

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) — you're free to use, modify, and distribute it, but any network-facing deployment must also share its source code.
