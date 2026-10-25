import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("malang_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("History read error:", error);
      return Response.json(
        { error: "기록을 불러오지 못했어요." },
        { status: 500 }
      );
    }

    return Response.json({ history: data });
  } catch (error) {
    console.error("History API error:", error);
    return Response.json(
      { error: "Supabase 연결 설정을 확인해 주세요." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      original_text,
      converted_text,
      explanation,
      situation,
      tone,
    } = body;

    if (
      !original_text?.trim() ||
      !converted_text?.trim() ||
      !situation ||
      !tone
    ) {
      return Response.json(
        { error: "저장할 기록의 필수 정보가 부족해요." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("malang_history")
      .insert({
        original_text,
        converted_text,
        explanation: explanation || "",
        situation,
        tone,
      })
      .select()
      .single();

    if (error) {
      console.error("History save error:", error);
      return Response.json(
        { error: "기록을 저장하지 못했어요." },
        { status: 500 }
      );
    }

    return Response.json({ record: data });
  } catch (error) {
    console.error("History API error:", error);
    return Response.json(
      { error: "기록 저장 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json(
        { error: "삭제할 기록을 선택해 주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("malang_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("History delete error:", error);
      return Response.json(
        { error: "기록을 삭제하지 못했어요." },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("History API error:", error);
    return Response.json(
      { error: "기록 삭제 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
