import { supabase } from "@/lib/supabase";
import { generateFlashcards } from "@/lib/openrouter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { context_id, document_id } = await request.json();

  if (!context_id) {
    return NextResponse.json(
      { error: "context_id is required" },
      { status: 400 }
    );
  }

  // Get documents for this context (or a specific document)
  let query = supabase.from("documents").select("content").eq("context_id", context_id);
  if (document_id) {
    query = query.eq("id", document_id);
  }
  const { data: docs, error: docsError } = await query;

  if (docsError || !docs?.length) {
    return NextResponse.json(
      { error: "No documents found for this context" },
      { status: 404 }
    );
  }

  // Get existing flashcards to avoid duplicates
  const { data: existing } = await supabase
    .from("flashcards")
    .select("front_de")
    .eq("context_id", context_id);

  const existingCards = existing?.map((c) => c.front_de) ?? [];
  const combinedContent = docs.map((d) => d.content).join("\n\n---\n\n");

  const pairs = await generateFlashcards(combinedContent, existingCards);

  // Insert generated flashcards
  const inserts = pairs.map((pair) => ({
    context_id,
    document_id: document_id || null,
    front_de: pair.front_de,
    back_fr: pair.back_fr,
  }));

  const { data: cards, error: insertError } = await supabase
    .from("flashcards")
    .insert(inserts)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(cards, { status: 201 });
}

