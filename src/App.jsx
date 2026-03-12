import { useState, useEffect } from "react";

// 1. 본인의 Make.com Webhook URL을 여기에 넣으세요.
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/v9nx8wi5gn0ycv83ye21nwvc6s8ugdnm";

const VERDICTS = [
  { key: "테마 됨",  cls: "green",  bg: "#dcfce7", color: "#15803d" },
  { key: "지켜봐야", cls: "yellow", bg: "#fef9c3", color: "#a16207" },
  { key: "아닌듯",   cls: "red",    bg: "#fee2e2", color: "#b91c1c" },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getCheckDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
}

export default function App() {
  const [form, setForm] = useState({
    title: "", date: getToday(), verdict: "",
    news: "", q1: "", q2: "", q3: "",
    chain: "", reason: "",
    checkDate: getCheckDate(), result: "", review: "",
  });
  const [status, setStatus] = useState(null); // null | 'saving' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState("");
  const [saved, setSaved] = useState([]);

  // 로컬 스토리지에서 최근 기록 불러오기
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("theme-journal-v2") || "[]");
      setSaved(list);
    } catch (e) {
      console.error("로컬 스토리지 로드 실패", e);
    }
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Make.com Webhook을 통해 노션으로 전송
  async function saveToNotion() {
    if (!form.title.trim()) {
      setStatus("error"); setStatusMsg("⚠ 뉴스 제목을 입력해줘"); return;
    }
    
    setStatus("saving"); 
    setStatusMsg("데이터 전송 중...");

    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), 
      });

      if (!res.ok) throw new Error("전송 실패");

      setStatus("success");
      setStatusMsg("✓ 노션 전송 완료!");

      // 저장 성공 시 로컬 목록 업데이트 및 폼 초기화
      const newItem = { ...form, savedAt: new Date().toISOString() };
      const newList = [newItem, ...saved].slice(0, 50);
      setSaved(newList);
      localStorage.setItem("theme-journal-v2", JSON.stringify(newList));
      resetForm();

      // 3초 후 상태 메시지 제거
      setTimeout(() => { setStatus(null); setStatusMsg(""); }, 3000);

    } catch (e) {
      setStatus("error");
      setStatusMsg("⚠ 오류 발생: " + (e.message || "다시 시도해봐"));
    }
  }

  function resetForm() {
    setForm({ 
      title: "", date: getToday(), verdict: "",
      news: "", q1: "", q2: "", q3: "",
      chain: "", reason: "",
      checkDate: getCheckDate(), result: "", review: "" 
    });
  }

  return (
    <div style={{ background: "#f5f3ee", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", paddingBottom: "80px" }}>

        {/* 헤더 */}
        <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: 20, marginBottom: 28 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#b8860b", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Theme Detection Journal
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
            테마 <span style={{ color: "#b8860b", borderBottom: "3px solid #b8860b" }}>감지</span> 일기
          </h1>
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#000", color: "#fff", fontFamily: "monospace", fontSize: 10, letterSpacing: 1, padding: "4px 12px", borderRadius: 20 }}>
            ◼ 노션 자동 저장 활성화
          </div>
        </div>

        {/* 입력 폼 카드 */}
        <div style={{ background: "#fff", border: "1.5px solid #e0dbd0", borderRadius: 12, overflow: "hidden", marginBottom: 24, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
          
          <div style={{ background: "#fafaf7", borderBottom: "1px solid #e0dbd0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#999", textTransform: "uppercase" }}>새 분석 기록</span>
            <div style={{ display: "flex", gap: 8 }}>
              {VERDICTS.map(v => (
                <span key={v.key}
                  onClick={() => set("verdict", form.verdict === v.key ? "" : v.key)}
                  style={{
                    fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                    padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    letterSpacing: 1, border: "1.5px solid transparent",
                    transition: "all 0.15s",
                    background: form.verdict === v.key ? v.color : v.bg,
                    color: form.verdict === v.key ? "#fff" : v.color,
                    borderColor: v.color,
                  }}>
                  {v.key}
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", display: "block", marginBottom: 4 }}>뉴스 제목</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="핵심 키워드 요약"
                  style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", display: "block", marginBottom: 4 }}>날짜</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                  style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", display: "block", marginBottom: 4 }}>뉴스 주요 내용</label>
              <textarea rows={2} value={form.news} onChange={e => set("news", e.target.value)}
                placeholder="핵심 내용을 간단히 기록하세요..."
                style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px 14px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* 즉각 판단 3문 */}
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#e8c84a", textTransform: "uppercase", marginBottom: 12 }}>즉각 판단 3문</div>
              {[
                { key: "q1", ph: "수혜 회사가 여러 개인가? (테마성)" },
                { key: "q2", ph: "이전에 없던 새로운 이야기인가?" },
                { key: "q3", ph: "6개월 후에도 이 재료가 유효할까?" },
              ].map((q, i) => (
                <div key={q.key} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                  <span style={{ fontSize: 9, color: "rgba(232,200,74,0.6)", minWidth: 18, paddingTop: 11 }}>Q{i+1}</span>
                  <textarea rows={1} value={form[q.key]} onChange={e => set(q.key, e.target.value)}
                    placeholder={q.ph}
                    style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "9px 12px", fontSize: 13, color: "#ddd", outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", display: "block", marginBottom: 4 }}>밸류체인</label>
                <textarea rows={3} value={form.chain} onChange={e => set("chain", e.target.value)}
                  placeholder="대장주:&#10;관련주:&#10;부품사:"
                  style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px 14px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", display: "block", marginBottom: 4 }}>판단 근거</label>
                <textarea rows={3} value={form.reason} onChange={e => set("reason", e.target.value)}
                  placeholder="테마화 가능성 판단 이유..."
                  style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px 14px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ background: "#f0f7ff", border: "1.5px solid rgba(26,110,168,0.18)", borderRadius: 8, padding: "14px 16px" }}>
              <span style={{ fontSize: 9, letterSpacing: 2, color: "#1a6ea8", textTransform: "uppercase", display: "block", marginBottom: 10 }}>사후 검증 (3개월 후)</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="date" value={form.checkDate} onChange={e => set("checkDate", e.target.value)}
                  style={{ background: "#fff", border: "1px solid rgba(26,110,168,0.2)", borderRadius: 6, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
                <input value={form.result} onChange={e => set("result", e.target.value)}
                  placeholder="실제 결과 기록"
                  style={{ background: "#fff", border: "1px solid rgba(26,110,168,0.2)", borderRadius: 6, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>

            {status && (
              <div style={{
                textAlign: "center", fontSize: 11, padding: "10px", borderRadius: 8,
                background: status === "saving" ? "#fef9c3" : status === "success" ? "#dcfce7" : "#fee2e2",
                color: status === "saving" ? "#a16207" : status === "success" ? "#15803d" : "#b91c1c",
              }}>
                {statusMsg}
              </div>
            )}

            <button onClick={saveToNotion}
              disabled={status === "saving"}
              style={{
                width: "100%", background: status === "saving" ? "#555" : "#1a1a1a",
                color: "#e8c84a", border: "none", borderRadius: 10, padding: 16,
                fontSize: 12, fontWeight: "bold", letterSpacing: 2, cursor: status === "saving" ? "not-allowed" : "pointer",
                transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
              ◼ {status === "saving" ? "전송 중..." : "노션에 저장하기"}
            </button>
          </div>
        </div>

        {/* 하단 리스트 */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#999", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            최근 저장된 기록 (로컬)
            <span style={{ flex: 1, height: 1, background: "#e0dbd0", display: "block" }} />
          </div>

          {saved.length === 0 ? (
            <div style={{ textAlign: "center", fontSize: 11, color: "#ccc", padding: 32, border: "1.5px dashed #e0dbd0", borderRadius: 10 }}>
              저장된 기록이 없습니다. 첫 기록을 남겨보세요!
            </div>
          ) : saved.map((item, i) => {
            const v = VERDICTS.find(x => x.key === item.verdict);
            return (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #e0dbd0", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#aaa" }}>{item.date}</span>
                  {v && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: v.bg, color: v.color }}>
                      {v.key}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}