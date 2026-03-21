import { supabase } from "@/lib/supabase";
import { computeNextReview, type ReviewQuality } from "@/lib/spaced-repetition";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const contextId = request.nextUrl.searchParams.get("context_id");
  const type = request.nextUrl.searchParams.get("type");

  if (!contextId) {
    return NextResponse.json(
      { error: "context_id is required" },
      { status: 400 }
    );
  }

  // Get cards due for review (next_review_at <= now), ordered by priority
  let query = supabase
    .from("flashcards")
    .select("*")
    .eq("context_id", contextId)
    .lte("next_review_at", new Date().toISOString());

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("next_review_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { flashcard_id, quality } = await request.json();

  if (!flashcard_id || !quality) {
    return NextResponse.json(
      { error: "flashcard_id and quality are required" },
      { status: 400 }
    );
  }

  const validQualities: ReviewQuality[] = [1, 3, 5];
  if (!validQualities.includes(quality)) {
    return NextResponse.json(
      { error: "quality must be 1, 3, or 5" },
      { status: 400 }
    );
  }

  // Get current card state
  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcard_id)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
  }

  const result = computeNextReview(
    quality as ReviewQuality,
    card.ease_factor,
    card.interval_days,
    card.repetitions
  );

  const { error: updateError } = await supabase
    .from("flashcards")
    .update(result)
    .eq("id", flashcard_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...result });
}

