import { supabase } from "@/lib/supabase";
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

  let query = supabase
    .from("flashcards")
    .select("*")
    .eq("context_id", contextId);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("flashcards").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

