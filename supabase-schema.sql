-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Contexts (folders for grouping documents and flashcards)
create table contexts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

-- Documents (uploaded text/PDF content)
create table documents (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  filename text not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Flashcards (German/French pairs with spaced repetition state)
create table flashcards (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  document_id uuid references documents(id) on delete set null,
  front_de text not null,
  back_fr text not null,
  ease_factor real default 2.5 not null,
  interval_days integer default 0 not null,
  repetitions integer default 0 not null,
  next_review_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Indexes for performance
create index idx_documents_context on documents(context_id);
create index idx_flashcards_context on flashcards(context_id);
create index idx_flashcards_review on flashcards(context_id, next_review_at);

-- Row Level Security (disabled for personal use — enable if needed)
alter table contexts enable row level security;
alter table documents enable row level security;
alter table flashcards enable row level security;

-- Allow all operations (personal app, single user)
create policy "Allow all on contexts" on contexts for all using (true) with check (true);
create policy "Allow all on documents" on documents for all using (true) with check (true);
create policy "Allow all on flashcards" on flashcards for all using (true) with check (true);

