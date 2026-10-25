"use client";

import { useEffect, useState } from "react";

const situations = [
  "업무 부탁",
  "일정 및 답변 재촉",
  "정중한 거절",
  "사과",
  "감사",
  "의견 전달",
];

const tones = [
  "부드러운 쿠션어",
  "정중한 비즈니스 말투",
  "간결한 말투",
  "친근하지만 예의 있는 말투",
];

export default function Home() {
  const [situation, setSituation] = useState("업무 부탁");
  const [tone, setTone] = useState("부드러운 쿠션어");
  const [original, setOriginal] = useState("");
  const [result, setResult] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/history", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "기록을 불러오지 못했어요.");
      }

      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || "기록을 불러오지 못했어요.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function convertText() {
    if (!original.trim()) {
      setError("변환할 문장을 먼저 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setExplanation("");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: original, situation, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "변환에 실패했어요.");
      }

      setResult(data.result || "");
      setExplanation(data.explanation || "");

      if (data.result) {
        await saveHistory(
          original.trim(),
          data.result,
          data.explanation || "",
          situation,
          tone
        );
      }
    } catch (err) {
      setError(err.message || "오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveHistory(
    originalText,
    convertedText,
    explanationText,
    selectedSituation,
    selectedTone
  ) {
    setSaving(true);

    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_text: originalText,
          converted_text: convertedText,
          explanation: explanationText,
          situation: selectedSituation,
          tone: selectedTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "기록 저장에 실패했어요.");
      }

      await loadHistory();
    } catch (err) {
      setError(
        `문장은 변환했지만 기록 저장에 실패했어요. ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteHistory(id) {
    const confirmed = window.confirm("이 기록을 삭제할까요?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "삭제에 실패했어요.");
      }

      setHistory((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(err.message || "기록을 삭제하지 못했어요.");
    }
  }

  async function copyResult(text) {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("문장을 복사했어요!");
    } catch {
      setError("복사에 실패했어요. 문장을 직접 선택해 복사해 주세요.");
    }
  }

  function useHistory(item) {
    setOriginal(item.original_text);
    setSituation(item.situation);
    setTone(item.tone);
    setResult(item.converted_text);
    setExplanation(item.explanation || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="page">
      <header className="header">
        <a className="logo" href="/">malang<span>.</span></a>
        <span className="header-label">AI 말투 도우미</span>
      </header>

      <section className="hero">
        <div className="eyebrow">YOUR COMMUNICATION PARTNER</div>
        <h1>
          말은 부드럽게,
          <br />
          <span>뜻은 정확하게.</span>
        </h1>
        <p>
          어려운 사회생활 말투, 말랑이 자연스럽게 다듬어 드릴게요.
          <br />
          상황에 맞는 쿠션어로 마음은 지키고 뜻은 전달해 보세요.
        </p>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <span className="step">01</span>
          <div>
            <h2>어떤 상황인가요?</h2>
            <p>문장을 사용할 상황을 선택해 주세요.</p>
          </div>
        </div>

        <div className="options">
          {situations.map((item) => (
            <button
              key={item}
              type="button"
              className={`option ${situation === item ? "selected" : ""}`}
              onClick={() => setSituation(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="section-heading second-heading">
          <span className="step">02</span>
          <div>
            <h2>원하는 말투를 골라 주세요.</h2>
            <p>상황에 어울리는 말투를 선택할 수 있어요.</p>
          </div>
        </div>

        <div className="options">
          {tones.map((item) => (
            <button
              key={item}
              type="button"
              className={`option ${tone === item ? "selected" : ""}`}
              onClick={() => setTone(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="section-heading second-heading">
          <span className="step">03</span>
          <div>
            <h2>전하고 싶은 말을 적어 주세요.</h2>
            <p>원래 의미는 유지하면서 자연스럽게 바꿔 드릴게요.</p>
          </div>
        </div>

        <textarea
          className="original-input"
          value={original}
          onChange={(event) => setOriginal(event.target.value)}
          maxLength={2000}
          placeholder="예: 이 자료 오늘까지 보내 주세요."
        />

        <div className="input-footer">
          <span>개인적인 정보는 입력하지 않는 것을 권장해요.</span>
          <span>{original.length}/2000</span>
        </div>

        <button
          type="button"
          className="convert-button"
          onClick={convertText}
          disabled={loading || saving}
        >
          {loading
            ? "말랑이 문장을 다듬고 있어요..."
            : saving
              ? "기록을 저장하고 있어요..."
              : "말랑하게 바꾸기 →"}
        </button>

        {error && <p className="error">{error}</p>}

        {result && (
          <section className="result-card">
            <div className="result-top">
              <span className="result-label">MALANG'S SUGGESTION</span>
              <span className="result-tag">{tone}</span>
            </div>

            <h2>이렇게 전해 보면 어떨까요?</h2>
            <div className="result-text">{result}</div>

            {explanation && (
              <div className="explanation">
                <strong>이렇게 바꿨어요</strong>
                <p>{explanation}</p>
              </div>
            )}

            <button
              type="button"
              className="copy-button"
              onClick={() => copyResult(result)}
            >
              결과 복사하기
            </button>

            <p className="saved-note">
              {saving
                ? "변환 기록을 저장하고 있어요."
                : "변환 결과를 저장하도록 요청했어요."}
            </p>
          </section>
        )}
      </section>

      <section className="history-section">
        <div className="history-heading">
          <div>
            <div className="eyebrow">YOUR SAVED SENTENCES</div>
            <h2>변환 기록</h2>
            <p>이전에 바꾼 문장을 다시 확인할 수 있어요.</p>
          </div>
          <button
            type="button"
            className="refresh-button"
            onClick={loadHistory}
            disabled={historyLoading}
          >
            {historyLoading ? "불러오는 중..." : "새로고침 ↻"}
          </button>
        </div>

        {historyLoading && history.length === 0 ? (
          <div className="empty-state">기록을 불러오고 있어요.</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            아직 저장된 기록이 없어요.
            <br />
            첫 문장을 변환해 보세요!
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <article className="history-card" key={item.id}>
                <div className="history-meta">
                  <span>{item.situation}</span>
                  <span>{item.tone}</span>
                  <time>{formatDate(item.created_at)}</time>
                </div>

                <div className="history-label">원문</div>
                <p className="history-original">{item.original_text}</p>

                <div className="history-label">변환 결과</div>
                <p className="history-result">{item.converted_text}</p>

                {item.explanation && (
                  <p className="history-explanation">
                    {item.explanation}
                  </p>
                )}

                <div className="history-actions">
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => copyResult(item.converted_text)}
                  >
                    결과 복사
                  </button>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => useHistory(item)}
                  >
                    다시 사용
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteHistory(item.id)}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <span className="footer-logo">malang.</span>
        <p>더 부드러운 대화, 더 편안한 소통.</p>
        <small>AI가 제안한 문장은 전송 전에 꼭 확인해 주세요.</small>
      </footer>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #faf9ff;
          color: #29253b;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        button, textarea { font: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: wait; opacity: 0.65; }
        .page {
          min-height: 100vh;
          background: radial-gradient(ellipse at 50% 0%, #f0eaff 0%, transparent 45%), #faf9ff;
        }
        .header {
          max-width: 1000px; margin: auto; padding: 26px 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .logo, .footer-logo {
          color: #6e54c8; font-size: 27px; font-weight: 800;
          letter-spacing: -1.5px; text-decoration: none;
        }
        .logo span { color: #ed9bb7; }
        .header-label { color: #827b96; font-size: 13px; }
        .hero { text-align: center; padding: 65px 20px 48px; }
        .eyebrow {
          color: #8a72d5; font-size: 11px; font-weight: 800;
          letter-spacing: 2px; margin-bottom: 16px;
        }
        .hero h1 {
          font-size: clamp(36px, 6vw, 58px); line-height: 1.35;
          letter-spacing: -2.5px; margin: 0;
        }
        .hero h1 span { color: #8067d5; }
        .hero p { color: #817b91; font-size: 14px; line-height: 1.9; margin-top: 22px; }
        .workspace, .history-section {
          width: calc(100% - 32px); max-width: 760px;
          margin: 0 auto 35px; background: white;
          border: 1px solid #eee9f8; border-radius: 24px;
          padding: 32px; box-shadow: 0 15px 50px #6250920b;
        }
        .section-heading { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
        .step {
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; width: 36px; height: 36px;
          background: #f0ebff; color: #795fc9; border-radius: 12px;
          font-size: 12px; font-weight: 800;
        }
        .section-heading h2 { margin: 2px 0 7px; font-size: 17px; }
        .section-heading p, .history-heading p { margin: 0; color: #9690a4; font-size: 12px; line-height: 1.7; }
        .options { display: flex; flex-wrap: wrap; gap: 9px; margin: 0 0 32px 50px; }
        .option {
          border: 1px solid #e9e5f1; background: white; color: #686176;
          border-radius: 12px; padding: 12px 15px; font-size: 13px;
        }
        .option.selected { background: #f0ebff; border-color: #a895e7; color: #694fc0; font-weight: 700; }
        .second-heading { margin-top: 30px; }
        .original-input {
          display: block; width: 100%; min-height: 150px; padding: 18px;
          resize: vertical; border: 1px solid #e9e5f1; background: #fdfcff;
          color: #302a43; border-radius: 15px; outline: none; line-height: 1.8;
          font-size: 14px;
        }
        .original-input:focus { border-color: #a895e7; }
        .input-footer { display: flex; justify-content: space-between; gap: 10px; color: #a09aaf; font-size: 11px; margin-top: 10px; }
        .convert-button {
          width: 100%; border: 0; border-radius: 14px; padding: 17px;
          margin-top: 24px; color: white; font-weight: 700; font-size: 14px;
          background: linear-gradient(100deg, #9178e5, #7660cf);
        }
        .error { color: #c94d67; font-size: 13px; margin-top: 14px; overflow-wrap: anywhere; }
        .result-card { margin-top: 28px; padding: 24px; background: #faf8ff; border: 1px solid #e9e1fb; border-radius: 18px; }
        .result-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
        .result-label { color: #8973ce; font-size: 10px; font-weight: 800; letter-spacing: 1.3px; }
        .result-tag { background: #eee8ff; color: #7157c2; border-radius: 20px; padding: 6px 10px; font-size: 11px; }
        .result-card h2 { font-size: 18px; margin: 20px 0 14px; }
        .result-text { white-space: pre-wrap; overflow-wrap: anywhere; color: #453b60; font-size: 15px; line-height: 1.9; }
        .explanation { margin-top: 22px; border-top: 1px solid #e9e1f7; padding-top: 18px; font-size: 12px; line-height: 1.8; }
        .explanation strong { color: #785fc3; }
        .explanation p { color: #817990; margin-bottom: 0; }
        .copy-button, .refresh-button, .delete-button {
          padding: 10px 13px; border: 1px solid #dcd1fa; border-radius: 10px;
          background: white; color: #7157c2; font-size: 12px; font-weight: 700;
        }
        .saved-note { color: #8c81a4; font-size: 11px; margin-bottom: 0; }
        .history-section { margin-bottom: 75px; }
        .history-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .history-heading h2 { margin: 0 0 8px; font-size: 23px; }
        .refresh-button { flex-shrink: 0; }
        .empty-state {
          text-align: center; padding: 36px 15px; border: 1px dashed #e3dcf1;
          border-radius: 16px; color: #9690a4; font-size: 13px; line-height: 2;
        }
        .history-list { display: grid; gap: 14px; }
        .history-card { min-width: 0; border: 1px solid #eee9f6; border-radius: 16px; padding: 18px; }
        .history-meta { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 18px; }
        .history-meta span { background: #f0ebff; color: #7157c2; border-radius: 20px; padding: 6px 9px; font-size: 10px; }
        .history-meta time { color: #a09aaf; font-size: 10px; margin-left: auto; }
        .history-label { color: #8973ce; font-size: 11px; font-weight: 700; margin-top: 14px; }
        .history-original, .history-result { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.8; }
        .history-original { color: #827b91; }
        .history-result { color: #453b60; }
        .history-explanation { color: #827b91; font-size: 12px; line-height: 1.8; }
        .history-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .delete-button { color: #b44f6a; border-color: #f0d7df; }
        .footer { text-align: center; padding: 35px 20px 45px; border-top: 1px solid #eee9f6; }
        .footer-logo { font-size: 23px; }
        .footer p { color: #777087; font-size: 12px; margin: 10px 0; }
        .footer small { color: #aaa4b5; font-size: 10px; }
        @media (max-width: 600px) {
          .header { padding: 20px; }
          .hero { padding: 45px 18px 35px; }
          .hero p { font-size: 12px; }
          .workspace, .history-section { padding: 22px 17px; border-radius: 19px; }
          .options { margin-left: 0; }
          .option { padding: 11px 12px; font-size: 12px; }
          .input-footer { font-size: 10px; }
          .result-card { padding: 18px; }
          .history-heading { align-items: flex-start; }
        }
      `}</style>
    </main>
  );
}
