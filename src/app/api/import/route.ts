import { supabase } from "@/lib/supabase";
import { parseFlashcardCsv } from "@/lib/parse-flashcard-csv";
import { NextRequest, NextResponse } from "next/server";
import type { FlashcardType } from "@/lib/database.types";

const VALID_TYPES: FlashcardType[] = ["sentence", "vocabulary"];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const contextId = formData.get("context_id") as string | null;
  const type = (formData.get("type") as FlashcardType) || "sentence";

  if (!file || !contextId) {
    return NextResponse.json(
      { error: "File and context_id are required" },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "type must be 'sentence' or 'vocabulary'" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const pairs = parseFlashcardCsv(text);

  if (pairs.length === 0) {
    return NextResponse.json(
      { error: "No valid flashcard pairs found in file. Expected CSV or TSV with two columns (front, back)." },
      { status: 400 }
    );
  }

  // Deduplicate against existing cards of same type in this context
  const { data: existing } = await supabase
    .from("flashcards")
    .select("front_de")
    .eq("context_id", contextId)
    .eq("type", type);

  const existingFronts = new Set(existing?.map((c) => c.front_de) ?? []);

  const newPairs = pairs.filter((p) => !existingFronts.has(p.front_de));

  if (newPairs.length === 0) {
    return NextResponse.json(
      { error: "All flashcards in the file already exist in this context" },
      { status: 409 }
    );
  }

  const inserts = newPairs.map((pair) => ({
    context_id: contextId,
    type,
    front_de: pair.front_de,
    back_fr: pair.back_fr,
  }));

  const { data: cards, error } = await supabase
    .from("flashcards")
    .insert(inserts)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { imported: cards?.length ?? 0, skipped: pairs.length - newPairs.length, cards },
    { status: 201 }
  );
}

