# Journal Storybook

An AI-assisted journal-to-storybook interface that turns an uploaded journal image into a short illustrated narrative.

## Overview

This course-project prototype uses a React interface and browser-side OpenAI calls. Its pipeline reads text from an image, writes a four-sentence story, establishes character/style context, and generates an illustration for each sentence.

## Features

- Upload a journal image and provide optional generation instructions.
- Extract journal text with a vision-capable text model.
- Generate a short narrative and character description.
- Generate illustrations using DALL-E 3.
- Display the result as a storybook in a chat-like interface.
- Regenerate results, copy text, and download an HTML storybook.

## Architecture

`src/App.tsx` manages image selection, conversation state, staged generation, and rendering. OpenAI GPT-4o-mini is used for image-text extraction and story/character generation; DALL-E 3 supplies images. `src/utils/nlpParser.ts` parses user instructions for preferences. Results live in React state rather than a backend database.

## Tech stack

React 19, TypeScript, Vite 7, Tailwind CSS 4, Radix/shadcn-style UI components, and the OpenAI JavaScript SDK.

## Project structure

- `src/App.tsx` — interface and generation pipeline.
- `src/utils/nlpParser.ts` — instruction parsing.
- `src/components/ui/` — reusable interface components.
- `src/index.css` and `src/App.css` — styling.
- `vite.config.ts`, TypeScript configs, and `package.json` — development/build tooling.
- `vercel.json` and `DEPLOYMENT.md` — static deployment configuration/notes.

## Run locally

Use Node.js/npm compatible with the committed Vite 7 dependency versions.

```bash
git clone https://github.com/anishkganesh/journal-storybook.git
cd journal-storybook
npm ci
```

Create `.env.local` in the application directory:

```dotenv
VITE_OPENAI_API_KEY=your-openai-key
```

```bash
npm run dev
```

Open the address printed by Vite, normally `http://localhost:5173`.

The root application is the entry point described here. `journal-storybook/` is a second committed application copy; inspect that copy's own package/configuration before running it separately.

## Configuration and data

The application explicitly enables browser access to OpenAI with `dangerouslyAllowBrowser: true`. Vite variables are bundled into client code: **this API key is visible to anyone who can load the built application**. Use a restricted local development key. A public production demo requires a server-side credential boundary, which is not part of this snapshot.

Image uploads and generation require outbound access to OpenAI and models enabled for your account. Generated image URLs may expire; downloading the HTML does not bundle image bytes, so the file's remote images may later become unavailable.

## Usage

Attach an image of a journal entry, add optional style/content instructions, and submit. Review the extracted narrative and images, then copy text or download the HTML storybook. Generated details can diverge from the source journal.

## Validation

```bash
npm run lint
npm run build
npm run preview
```

No automated test suite is configured. Check uploads, each generation stage, error handling, regeneration, and HTML download using your local credentials. This documentation review did not execute paid image/text generation or claim these checks passed.

## Deployment

The frontend builds to `dist/` for static hosting. The committed Vercel notes describe that build, but the current client-side secret handling is unsuitable for publishing a reusable private API key. Configure a backend boundary before offering a public credential-backed demo.

## Limitations

- OCR, narratives, and illustrations are model-generated and can be inaccurate.
- Each story invokes several paid API operations.
- Conversation state is not persisted in a database.
- Downloaded HTML references externally hosted image URLs.

## Attribution and license

This is a course-project prototype; generated content and dependencies retain applicable provider terms. No standalone license file is included; this README does not grant a new license.
