import { useState, useEffect } from "react";

// 1. 본인의 Make.com Webhook URL
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
  const [status, setStatus] = useState(null); 
  const [statusMsg, setStatusMsg] = useState("");
  const [saved, setSaved] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("theme-journal-v2") || "[]");
      setSaved(list);
    } catch (e) {
      console.error("로컬 스토리지 로드 실패", e);
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function saveToNotion() {
    if (!form.title.trim()) {
      setStatus("error"); setStatusMsg("⚠ 뉴스 제목을 입력해줘"); return;
    }
    
    setStatus("saving"); 
    setStatusMsg("데이터 전송 중...");

    // [수정 포인트] review 내용을 노션의 텍스트 속성으로 매핑하기 위해 payload 구조 조정
    const payload = {
      ...form,
      // review 변수를 그대로 보내며, Make에서 이를 노션의 '텍스트 속성'에 연결합니다.
      review_content: form.review 
    };

    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      });

      if (!res.ok) throw new Error("전송 실패");

      setStatus("success");
      setStatusMsg("✓ 노션 전송 완료!");

      const newItem = { ...form, savedAt: new Date().toISOString() };
      const newList = [newItem, ...saved].slice(0, 50);
      setSaved(newList);
      localStorage.setItem("theme-journal-v2", JSON.stringify(newList));
      resetForm();

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
    <div style={{ background: "#f5f3ee", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isDesktop ? "1fr 480px" : "1fr", 
        gap: isDesktop ? 28 : 0, 
        padding: isDesktop ? "32px" : "20px", 
        maxWidth: "1600px", 
        margin: "0 auto",
        paddingBottom: "80px"
      }}>
        
        {/* 입력 폼 파트 */}
        <div>
          <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: 20, marginBottom: 28 }}>
            <span style={{ fontSize: 10, color: "#b8860b", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Theme Detection Journal</span>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>테마 <span style={{ color: "#b8860b", borderBottom: "3px solid #b8860b" }}>감지</span> 일기</h1>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid #e0dbd0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 상단 섹션: 제목, 날짜, 판정 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {VERDICTS.map(v => (
                  <span key={v.key} onClick={() => set("verdict", v.key)}
                    style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, cursor: "pointer", background: form.verdict === v.key ? v.color : v.bg, color: form.verdict === v.key ? "#fff" : v.color, border: `1px solid ${v.color}` }}>
                    {v.key}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="뉴스 제목" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
            </div>

            <textarea value={form.news} onChange={e => set("news", e.target.value)} placeholder="뉴스 주요 내용" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", minHeight: 60 }} />

            {/* Q1~Q3 섹션 */}
            <div style={{ background: "#f9f9f9", padding: 15, borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={form.q1} onChange={e => set("q1", e.target.value)} placeholder="Q1. 수혜 회사가 여러 개인가?" style={{ padding: 10, borderRadius: 6, border: "1px solid #eee" }} />
              <input value={form.q2} onChange={e => set("q2", e.target.value)} placeholder="Q2. 새로운 이야기인가?" style={{ padding: 10, borderRadius: 6, border: "1px solid #eee" }} />
              <input value={form.q3} onChange={e => set("q3", e.target.value)} placeholder="Q3. 6개월 후에도 유효할까?" style={{ padding: 10, borderRadius: 6, border: "1px solid #eee" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <textarea value={form.chain} onChange={e => set("chain", e.target.value)} placeholder="밸류체인" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", minHeight: 80 }} />
              <textarea value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="판단 근거" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", minHeight: 80 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
               <div>
                  <label style={{fontSize: 9, color: "#999"}}>검증일</label>
                  <input type="date" value={form.checkDate} onChange={e => set("checkDate", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
               </div>
               <div>
                  <label style={{fontSize: 9, color: "#999"}}>실제 결과</label>
                  <input value={form.result} onChange={e => set("result", e.target.value)} placeholder="결과 기록" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
               </div>
            </div>

            <textarea value={form.review} onChange={e => set("review", e.target.value)} placeholder="본문 (분석 통찰)" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", minHeight: 120 }} />

            {statusMsg && <div style={{ fontSize: 12, color: status === "error" ? "red" : "green", textAlign: "center" }}>{statusMsg}</div>}

            <button onClick={saveToNotion} disabled={status === "saving"} style={{ padding: 16, borderRadius: 10, background: "#1a1a1a", color: "#e8c84a", fontWeight: "bold", cursor: "pointer" }}>
              {status === "saving" ? "저장 중..." : "노션에 저장하기"}
            </button>
          </div>
        </div>

        {/* 오른쪽 히스토리 패널 (생략 가능) */}
        {isDesktop && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e0dbd0", padding: 20, height: "fit-content" }}>
            <h2 style={{ fontSize: 12, color: "#999", marginBottom: 15 }}>최근 기록 ({saved.length})</h2>
            {saved.slice(0, 5).map((s, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: 13 }}>{s.title}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}