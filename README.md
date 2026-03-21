# Kartei

A personal web app for learning German from French using AI-generated contextual flashcards and spaced repetition.

## How it works

1. **Create a context** — group your learning material by topic (e.g. "Wohnungsverwaltung", "Kochen")
2. **Upload documents** — drop PDF or text files containing German text
3. **Generate flashcards** — an LLM reads your documents and creates German → French flashcard pairs
4. **Practice** — review cards using spaced repetition (SM-2 algorithm) with self-evaluation

## Features

- PDF and plain text document parsing
- AI-powered flashcard generation via [OpenRouter](https://openrouter.ai)
- Spaced repetition scheduling (SM-2)
- Per-context document management
- Flashcard mastery stats and progress tracking

## Tech stack

- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (PostgreSQL database)
- **OpenRouter** (LLM API)
- **Vercel** (deployment)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run the SQL in `supabase-schema.sql` in the SQL Editor.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Settings → API
- `OPENROUTER_API_KEY` — from [openrouter.ai/keys](https://openrouter.ai/keys)

### 4. Run

```bash
npm run dev
```

### 5. Test

```bash
npx vitest run
```
