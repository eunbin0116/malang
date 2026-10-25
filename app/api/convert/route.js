export async function POST(request) {
  try {
    const { text, situation, tone } = await request.json();

    if (!text || typeof text !== "string" || !text.trim()) {
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

상황: ${situation || "일반적인 대화"}
원하는 말투: ${tone || "부드러운 쿠션어"}

규칙:
1. 원문의 핵심 의미와 의도를 유지해.
2. 원문에 없는 사실이나 약속을 추가하지 마.
3. 자연스럽고 실제로 사용할 수 있는 한국어를 사용해.
4. 필요 이상으로 길거나 과장된 표현은 피 해.
5. 변환 결과와 수정 이유를 작성해.
6. 반드시 다음 JSON 형식으로 답해.
{"result":"변환된 문장","explanation":"수정 이유"}

사용자 원문:
${text}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
      console.error("Gemini API error:", {
        status: response.status,
        details: data.error?.message
      });

      return Response.json(
        {
          error: `Gemini API 오류 (${response.status}): ${
            data.error?.message || "응답을 받지 못했어요."
          }`
        },
        { status: 502 }
      );
    }

    const candidate = data.candidates?.[0];
    const output = candidate?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!output) {
      console.error("Gemini empty response:", {
        finishReason: candidate?.finishReason,
        promptFeedback: data.promptFeedback
      });

      return Response.json(
        { error: "AI가 결과를 반환하지 않았어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    let parsed;

    try {
      const cleanedOutput = output
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      parsed = JSON.parse(cleanedOutput);
    } catch {
      console.error("Gemini JSON parse error:", output);

      // JSON이 아닌 응답도 결과로 사용할 수 있도록 처리
      parsed = {
        result: output,
        explanation: "입력한 문장을 바탕으로 AI가 응답했어요."
      };
    }

    if (
      !parsed.result ||
      typeof parsed.result !== "string"
    ) {
      return Response.json(
        { error: "변환 결과가 비어 있어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return Response.json({
      result: parsed.result,
      explanation:
        typeof parsed.explanation === "string"
          ? parsed.explanation
          : ""
    });
  } catch (error) {
    console.error("Convert API error:", error);

    return Response.json(
      { error: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
