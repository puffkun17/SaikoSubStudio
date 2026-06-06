# SaikoSubStudio

A browser-based tool for aligning, merging, and styling bilingual subtitles, with a cinema-style preview simulator.

## Features

- Align and merge two subtitle tracks (e.g. original dialogue + translation or lyrics) using sequence alignment.
- Automatically classify segments as dialogue, notes/comments, or lyrics.
- Edit timing, merge lines, and apply ASS-compatible styles (font, size, color, outline, position).
- Preview subtitles overlaid on video in different aspect ratios (16:9, 2.39:1, 4:3, 1.9:1, etc.) and lighting environments.
- Export to ASS or SRT format.

The alignment and preview logic runs client-side. The tool does not perform speech-to-text or automatic transcription.

## Getting Started

```bash
git clone https://github.com/puffkun17/SaikoSubStudio.git
cd SaikoSubStudio
npm install
npm run dev
```

Open http://localhost:3000.

Basic workflow:
1. Load source subtitle file(s).
2. Review and adjust alignment in the workbench.
3. Preview in the theater simulator and export.

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Zustand
- Framer Motion
- Tailwind CSS

## Deployment on Cloudflare Pages

This project is set up for Cloudflare Pages.

**Build settings:**
- Build command: `npm ci && npm run pages:build`
- Build output directory: `.vercel/output/static`

Local preview:
```bash
npm run pages:build
npm run preview
```

## License

MIT
