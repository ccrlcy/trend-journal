import { useState, useEffect } from "react";

// 1. 본인의 Make.com Webhook URL (동일하게 유지)
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/v9nx8wi5gn0ycv83ye21nwvc6s8ugdnm";

const VERDICTS = [
  { key: "테마 됨",  cls: "green",  bg: "#dcfce7", color: "#15803d" },
  { key: "지켜봐야", cls: "yellow", bg: "#fef9c3", color: "#a16207" },
  { key: "아닌듯",   cls: "red",    bg: "#fee2e2", color: "#b91c1c" },
];

function getToday() {
  const d = new Date();
  // 한국 시간 기준으로 정확한 날짜 생성
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function getCheckDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

export default function App() {
  const [form, setForm] = useState({
    title: "", date: getToday(), verdict: "",
    news: "", q1: "", q2: "", q3: "",
    chain: "", reason: "",
    checkDate: getCheckDate(), result: "", review: "",
    url: "", // 뉴스 링크 필드 추가
  });
  const [status, setStatus] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("theme-journal-v2") || "[]");
      setSaved(list);
    } catch (e) { console.error(e); }
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function saveToNotion() {
    if (!form.title.trim()) {
      setStatus("error"); setStatusMsg("⚠ 뉴스 제목을 입력해줘"); return;
    }
    
    setStatus("saving"); 
    setStatusMsg("AI 분석 및 노션 전송 중...");

    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), 
      });

      if (!res.ok) throw new Error("전송 실패");

      setStatus("success");
      setStatusMsg("✓ 노션에 예쁘게 저장됐어!");

      const newItem = { ...form, savedAt: new Date().toISOString() };
      const newList = [newItem, ...saved].slice(0, 50);
      setSaved(newList);
      localStorage.setItem("theme-journal-v2", JSON.stringify(newList));
      resetForm();

      setTimeout(() => { setStatus(null); setStatusMsg(""); }, 3000);
    } catch (e) {
      setStatus("error");
      setStatusMsg("⚠ 오류: " + e.message);
    }
  }

  function resetForm() {
    setForm({ 
      title: "", date: getToday(), verdict: "",
      news: "", q1: "", q2: "", q3: "",
      chain: "", reason: "",
      checkDate: getCheckDate(), result: "", review: "",
      url: "" 
    });
  }

  return (
    <div style={{ background: "#f5f3ee", minHeight: "100vh", fontFamily: "'Noto Serif KR', serif", padding: "20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", paddingBottom: "80px" }}>

        {/* 헤더 */}
        <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: 20, marginBottom: 28 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: "#b8860b", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            AI-Powered Theme Journal
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
            테마 <span style={{ color: "#b8860b", borderBottom: "3px solid #b8860b" }}>자동분석</span> 일기
          </h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>뉴스만 넣으면 AI가 밸류체인과 판단을 돕습니다.</p>
        </div>

        {/* 입력 카드 */}
        <div style={{ background: "#fff", border: "1.5px solid #e0dbd0", borderRadius: 12, overflow: "hidden", marginBottom: 24, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          
          <div style={{ background: "#fafaf7", borderBottom: "1px solid #e0dbd0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#999" }}>ANALYSIS FORM</span>
            <div style={{ display: "flex", gap: 8 }}>
              {VERDICTS.map(v => (
                <button key={v.key}
                  onClick={() => set("verdict", form.verdict === v.key ? "" : v.key)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    border: "1.5px solid", transition: "all 0.15s",
                    background: form.verdict === v.key ? v.color : v.bg,
                    color: form.verdict === v.key ? "#fff" : v.color,
                    borderColor: v.color,
                  }}>
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="뉴스 제목 (또는 종목명)"
                style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "12px", fontSize: 15, outline: "none" }} />
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "12px", fontSize: 13, outline: "none" }} />
            </div>

            <input value={form.url} onChange={e => set("url", e.target.value)}
              placeholder="뉴스 원문 링크 (URL)"
              style={{ width: "100%", background: "#f0f4f8", border: "1px solid #d1d9e6", borderRadius: 7, padding: "10px 14px", fontSize: 13, outline: "none", color: "#1a6ea8" }} />

            <div>
              <label style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", marginBottom: 4, display: "block" }}>뉴스 요약 (AI가 이 내용을 분석합니다)</label>
              <textarea rows={4} value={form.news} onChange={e => set("news", e.target.value)}
                placeholder="뉴스의 핵심 내용을 붙여넣으세요. AI가 밸류체인과 판단을 도와줍니다."
                style={{ width: "100%", background: "#fafaf7", border: "1px solid #e0dbd0", borderRadius: 7, padding: "14px", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6 }} />
            </div>

            {/* 수동 입력 섹션 (AI가 채워주지만 직접 수정도 가능) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", marginBottom: 4, display: "block" }}>밸류체인</label>
                <textarea rows={3} value={form.chain} onChange={e => set("chain", e.target.value)}
                  placeholder="AI 분석 대기 중..."
                  style={{ width: "100%", background: "#fff", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: "#bbb", marginBottom: 4, display: "block" }}>판단 근거</label>
                <textarea rows={3} value={form.reason} onChange={e => set("reason", e.target.value)}
                  placeholder="AI 분석 대기 중..."
                  style={{ width: "100%", background: "#fff", border: "1px solid #e0dbd0", borderRadius: 7, padding: "10px", fontSize: 13, outline: "none" }} />
              </div>
            </div>

            {status && (
              <div style={{ textAlign: "center", fontSize: 11, padding: "10px", borderRadius: 8, background: status === "saving" ? "#fff9db" : status === "success" ? "#ebfbee" : "#fff5f5", color: status === "saving" ? "#f08c00" : status === "success" ? "#2f9e44" : "#e03131", border: "1px solid currentColor" }}>
                {statusMsg}
              </div>
            )}

            <button onClick={saveToNotion} disabled={status === "saving"}
              style={{ width: "100%", background: "#1a1a1a", color: "#e8c84a", border: "none", borderRadius: 10, padding: "18px", fontSize: 13, fontWeight: "bold", letterSpacing: 2, cursor: "pointer" }}>
              {status === "saving" ? "AI 분석 및 저장 중..." : "AI 분석 결과 노션에 저장"}
            </button>
          </div>
        </div>

        {/* 저장 목록 */}
        <div style={{ opacity: 0.8 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#999", marginBottom: 14, textAlign: "center" }}>RECENT ARCHIVES</div>
          {saved.map((item, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e0dbd0", borderRadius: 8, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>
              <span style={{ fontSize: 10, color: "#999" }}>{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}