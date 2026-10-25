export async function POST(request) {
  try {
    const { text, situation, tone } = await request.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "변환할 문장을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return Response.json(
        { error: "문장은 2,000자 이내로 입력해 주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Gemini API 키가 설정되지 않았어요." },
        { status: 500 }
      );
    }

    const prompt = `
너는 한국어 사회생활 말투 전문 도우미 '말랑'이야.

사용자의 문장을 상황과 원하는 말투에 맞게 자연스럽게 바꿔 줘.

[상황]
${situation || "일반적인 대화"}

[원하는 말투]
${tone || "부드러운 쿠션어"}

[규칙]
1. 원문의 핵심 의미와 의도를 유지해.
2. 원문에 없는 사실이나 약속을 임의로 추가하지 마.
3. 상황에 맞는 쿠션어와 자연스러운 한국어를 사용해.
4. 필요 이상으로 길거나 과장된 표현은 피하고 실제로 사용할 수 있게 작성해.
5. 상대방을 무시하거나 지나치게 비굴한 표현은 사용하지 마.
6. 변환 결과와 수정 이유를 한국어로 작성해.
7. 결과는 반드시 JSON 형식으로만 반환해.
8. JSON 형식은 다음과 같아:
{
  "result": "변환된 문장",
  "explanation": "어떤 표현을 왜 바꾸었는지에 대한 짧은 설명"
}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 700,
            responseMimeType: "application/json"
          }
        }),
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return Response.json(
        { error: "AI 변환에 실패했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const output = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!output) {
      return Response.json(
        { error: "AI 결과를 받지 못했어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(output);
    } catch {
      return Response.json(
        { error: "AI 결과를 읽지 못했어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    if (!parsed.result) {
      return Response.json(
        { error: "변환 결과가 비어 있어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return Response.json({
      result: parsed.result,
      explanation: parsed.explanation || ""
    });
  } catch (error) {
    console.error("Convert API error:", error);

    return Response.json(
      { error: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
