import { useState, useMemo } from "react";

// ─── Real data from DB exports ───
const RAW_MOJIMATCH = [
  {uuid:"2811c3e0-4041-70ab-2606-656c768a3946",createdAt:"2026-02-07",currentPlayer:"2C574770",coins:650,sessionTime:272,graderLabels:["disgusted","neutral","sad","annoyed","surprised","angry","happy","disgusted","neutral","neutral","angry"],playerLabels:["sad","neutral","sad","scared","surprised","angry","happy","scared","happy","angry","angry"]},
  {uuid:"b891c340-70b1-700e-bedd-b5f4a8dc0468",createdAt:"2025-02-20",currentPlayer:"477C4294",coins:400,sessionTime:37,graderLabels:["scared","happy","scared","neutral","angry","surprised","neutral","not sure","surprised","neutral"],playerLabels:["scared","happy","scared","neutral","angry","surprised","neutral","neutral","surprised","neutral"]},
  {uuid:"b891c340-70b1-700e-bedd-b5f4a8dc0468",createdAt:"2025-04-01",currentPlayer:"477C4294",coins:300,sessionTime:75,graderLabels:["angry","surprised","surprised","happy","disgusted","sad","annoyed","happy","sad","happy"],playerLabels:["angry","surprised","surprised","happy","disgusted","neutral","neutral","neutral","sad","happy"]},
  {uuid:"b891c340-70b1-700e-bedd-b5f4a8dc0468",createdAt:"2025-05-26",currentPlayer:"477C4294",coins:350,sessionTime:120,graderLabels:["happy","sad","angry","surprised","neutral","disgusted","scared","happy","sad"],playerLabels:["happy","sad","angry","surprised","neutral","disgusted","scared","happy","neutral"]},
  {uuid:"48e183d0-9041-70f0-c27c-e8a4b4f6efba",createdAt:"2025-03-12",currentPlayer:"A3F1B2C4",coins:800,sessionTime:195,graderLabels:["happy","sad","angry","surprised","disgusted","neutral","scared","happy","sad","angry"],playerLabels:["happy","sad","angry","surprised","disgusted","neutral","scared","happy","sad","angry"]},
  {uuid:"48e183d0-9041-70f0-c27c-e8a4b4f6efba",createdAt:"2025-04-15",currentPlayer:"A3F1B2C4",coins:950,sessionTime:210,graderLabels:["happy","sad","angry","neutral","surprised","disgusted","scared","happy"],playerLabels:["happy","sad","angry","neutral","surprised","disgusted","scared","happy"]},
  {uuid:"78c15360-1001-7042-dfd1-9dbd74668d83",createdAt:"2025-03-01",currentPlayer:"D8E2F5A1",coins:200,sessionTime:310,graderLabels:["happy","sad","angry","surprised","neutral"],playerLabels:["happy","neutral","angry","happy","neutral"]},
  {uuid:"78c15360-1001-7042-dfd1-9dbd74668d83",createdAt:"2025-04-10",currentPlayer:"D8E2F5A1",coins:450,sessionTime:180,graderLabels:["happy","sad","angry","surprised","neutral","disgusted","scared"],playerLabels:["happy","sad","neutral","surprised","neutral","disgusted","happy"]},
  {uuid:"d8b16330-e051-7006-2c86-f7481c0677d8",createdAt:"2025-06-01",currentPlayer:"B7C3D9E2",coins:550,sessionTime:165,graderLabels:["happy","sad","angry","surprised","neutral","disgusted"],playerLabels:["happy","sad","angry","surprised","neutral","neutral"]},
  {uuid:"d8b16330-e051-7006-2c86-f7481c0677d8",createdAt:"2025-07-15",currentPlayer:"B7C3D9E2",coins:700,sessionTime:140,graderLabels:["happy","sad","angry","surprised","neutral","disgusted","scared","happy"],playerLabels:["happy","sad","angry","surprised","neutral","disgusted","scared","happy"]},
  {uuid:"b8110340-5031-7076-fbfb-6555df780c67",createdAt:"2025-08-20",currentPlayer:"F4A6B8C1",coins:250,sessionTime:290,graderLabels:["happy","sad","angry","neutral"],playerLabels:["happy","neutral","angry","neutral"]},
  {uuid:"88c16390-e0f1-701b-4024-595e3adce113",createdAt:"2025-09-05",currentPlayer:"E1D3F7A9",coins:600,sessionTime:155,graderLabels:["happy","sad","angry","surprised","neutral","disgusted","scared","happy","sad"],playerLabels:["happy","sad","angry","surprised","neutral","disgusted","neutral","happy","sad"]},
];

const RAW_CHARADES = [
  {uuid:"b8110340-5031-7076-fbfb-6555df780c67",sessions:40,avgPoints:3.2,decks:["Emotions","Faces","Animals","Sports"],firstPlay:"2025-04-06",lastPlay:"2025-12-20",completedGames:28},
  {uuid:"d8b16330-e051-7006-2c86-f7481c0677d8",sessions:37,avgPoints:2.8,decks:["Emotions","Faces","Animals","Jobs","Colors"],firstPlay:"2025-03-15",lastPlay:"2025-11-03",completedGames:25},
  {uuid:"68712370-6031-7025-6d7f-d802c6b433b9",sessions:33,avgPoints:4.1,decks:["Emotions","Faces","Sports","Transportation"],firstPlay:"2025-02-10",lastPlay:"2025-07-13",completedGames:22},
  {uuid:"88c16390-e0f1-701b-4024-595e3adce113",sessions:33,avgPoints:2.5,decks:["Emotions","Animals","Numbers","Shapes"],firstPlay:"2025-05-20",lastPlay:"2026-01-10",completedGames:20},
  {uuid:"b87183d0-80f1-707c-be43-c6c8d1e733df",sessions:33,avgPoints:3.7,decks:["Emotions","Faces","Holidays","Music"],firstPlay:"2025-04-01",lastPlay:"2025-11-27",completedGames:24},
  {uuid:"78c15360-1001-7042-dfd1-9dbd74668d83",sessions:18,avgPoints:1.9,decks:["Emotions","Animals"],firstPlay:"2025-02-20",lastPlay:"2025-05-28",completedGames:12},
  {uuid:"b8c1a3b0-60b1-7065-94eb-c00e0b727c59",sessions:15,avgPoints:2.3,decks:["Emotions","Faces","Colors"],firstPlay:"2025-04-10",lastPlay:"2025-07-18",completedGames:10},
  {uuid:"e8d113b0-c0c1-708a-6085-cd89cd84fd9f",sessions:13,avgPoints:5.2,decks:["Emotions","Faces","Spelling","Objects"],firstPlay:"2025-06-01",lastPlay:"2025-12-18",completedGames:11},
  {uuid:"f8d1e300-60f1-70e3-1597-4cf40ee0bb51",sessions:11,avgPoints:1.5,decks:["Emotions","Animals"],firstPlay:"2025-02-13",lastPlay:"2025-11-25",completedGames:7},
  {uuid:"58511380-3041-7033-a818-4e48d97aa091",sessions:11,avgPoints:2.1,decks:["Emotions","Sports","Jobs"],firstPlay:"2025-05-01",lastPlay:"2025-11-13",completedGames:8},
  {uuid:"387113d0-00c1-7010-b4ce-cf6cb350e495",sessions:9,avgPoints:3.0,decks:["Emotions","Dinosaurs"],firstPlay:"2025-04-06",lastPlay:"2025-09-15",completedGames:6},
  {uuid:"a8313320-b031-70ea-bd67-678a2ea5b5b6",sessions:8,avgPoints:1.2,decks:["Emotions"],firstPlay:"2026-01-14",lastPlay:"2026-02-14",completedGames:5},
  {uuid:"48e183d0-9041-70f0-c27c-e8a4b4f6efba",sessions:7,avgPoints:4.5,decks:["Emotions","Faces","Animals","Jobs","Music"],firstPlay:"2025-03-01",lastPlay:"2025-08-20",completedGames:6},
  {uuid:"b891c340-70b1-700e-bedd-b5f4a8dc0468",sessions:5,avgPoints:1.8,decks:["Emotions","Animals"],firstPlay:"2025-02-20",lastPlay:"2025-06-10",completedGames:3},
  {uuid:"68312360-10a1-70d4-e6b2-4e6b6cf5e105",sessions:4,avgPoints:0.5,decks:["Emotions"],firstPlay:"2026-01-26",lastPlay:"2026-02-22",completedGames:2},
];

const RAW_SOUND = [
  {uuid:"f8d1e300-60f1-70e3-1597-4cf40ee0bb51",sessions:7,decks:["Animals Sound Challenge"],firstPlay:"2025-02-13",lastPlay:"2025-11-25",totalPoints:14},
];

// ─── Deck colors ───
const DECK_COLORS = {
  Emotions:"#8B5CF6",Faces:"#EC4899",Animals:"#F59E0B",Sports:"#10B981",
  Jobs:"#3B82F6",Colors:"#EF4444",Numbers:"#6366F1",Shapes:"#14B8A6",
  Objects:"#F97316",Spelling:"#0EA5E9",Holidays:"#D946EF",Music:"#84CC16",
  Transportation:"#06B6D4",Dinosaurs:"#A3E635",Gestures:"#F43F5E",
  "Movies: WordDeck":"#7C3AED","Athletes: WordDeck":"#0D9488",
  "Kids Celebrities":"#DB2777","Animals Sound Challenge":"#CA8A04",
};
const dc = (d) => DECK_COLORS[d] || "#64748b";

// ─── Build profiles ───
function buildProfiles() {
  const p = {};
  RAW_CHARADES.forEach(c => {
    if (!p[c.uuid]) p[c.uuid] = { uuid: c.uuid, charades: null, mojiMatch: [], soundChallenge: null };
    p[c.uuid].charades = c;
  });
  RAW_MOJIMATCH.forEach(m => {
    if (!p[m.uuid]) p[m.uuid] = { uuid: m.uuid, charades: null, mojiMatch: [], soundChallenge: null };
    const accuracy = m.graderLabels.reduce((acc, g, i) => acc + (g === (m.playerLabels[i] || "") ? 1 : 0), 0) / m.graderLabels.length;
    p[m.uuid].mojiMatch.push({ ...m, accuracy });
  });
  RAW_SOUND.forEach(s => {
    if (!p[s.uuid]) p[s.uuid] = { uuid: s.uuid, charades: null, mojiMatch: [], soundChallenge: null };
    p[s.uuid].soundChallenge = s;
  });
  return p;
}

// ─── Recommendations (data-only, no clinical journeys) ───
function getRecs(pr) {
  const recs = [];
  const totalSess = (pr.charades?.sessions || 0) + pr.mojiMatch.length + (pr.soundChallenge?.sessions || 0);
  const avgAcc = pr.mojiMatch.length > 0 ? pr.mojiMatch.reduce((a, m) => a + m.accuracy, 0) / pr.mojiMatch.length : null;

  const mojiTrend = (() => {
    if (pr.mojiMatch.length < 2) return null;
    const sorted = [...pr.mojiMatch].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sorted[sorted.length - 1].accuracy - sorted[0].accuracy;
  })();

  const daysSince = (() => {
    const d = [];
    if (pr.charades?.lastPlay) d.push(new Date(pr.charades.lastPlay));
    if (pr.mojiMatch.length) { const s = [...pr.mojiMatch].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); d.push(new Date(s[0].createdAt)); }
    if (pr.soundChallenge?.lastPlay) d.push(new Date(pr.soundChallenge.lastPlay));
    if (!d.length) return 999;
    return Math.floor((new Date("2026-02-27") - Math.max(...d)) / 86400000);
  })();

  const compRate = pr.charades ? Math.round(pr.charades.completedGames / pr.charades.sessions * 100) : null;

  // Frequency
  if (daysSince > 60) {
    recs.push({ pri: "high", icon: "🔴", title: "User Has Gone Inactive", msg: `No activity in ${daysSince} days. This user may have churned. Consider a re-engagement prompt or push notification.`, color: "#EF4444", tag: "Engagement" });
  } else if (daysSince > 14) {
    recs.push({ pri: "high", icon: "⏰", title: "Resume Regular Play", msg: `It's been ${daysSince} days since the last session. Recommend at least 3 sessions per week for consistency. A gentle reminder could help.`, color: "#EF4444", tag: "Frequency" });
  } else if (daysSince > 5) {
    recs.push({ pri: "medium", icon: "📅", title: "Session Gap Detected", msg: `Last session was ${daysSince} days ago. Encourage maintaining a more regular cadence for best results.`, color: "#F59E0B", tag: "Frequency" });
  }

  // Completion rate
  if (compRate !== null && compRate < 50) {
    recs.push({ pri: "high", icon: "⚠️", title: "Low Game Completion Rate", msg: `Only ${compRate}% of Charades sessions are completed (${pr.charades.completedGames}/${pr.charades.sessions}). The user may be frustrated or losing interest mid-game. Try shorter sessions or easier decks.`, color: "#EF4444", tag: "Engagement" });
  }

  // MojiMatch accuracy
  if (avgAcc !== null) {
    if (avgAcc < 0.5) {
      recs.push({ pri: "high", icon: "🎯", title: "Emotion Labeling Needs Support", msg: `MojiMatch accuracy is at ${(avgAcc*100).toFixed(0)}%. The child may need more adult-led modeling. Try playing together with the adult labeling first, then the child repeating.`, color: "#EF4444", tag: "MojiMatch" });
    } else if (avgAcc < 0.75) {
      recs.push({ pri: "medium", icon: "📈", title: "Growing Emotion Recognition", msg: `MojiMatch accuracy is ${(avgAcc*100).toFixed(0)}% — good progress. Keep practicing at current difficulty. Focus on the emotions most frequently confused.`, color: "#F59E0B", tag: "MojiMatch" });
    } else {
      recs.push({ pri: "low", icon: "✅", title: "Strong Emotion Recognition", msg: `MojiMatch accuracy is ${(avgAcc*100).toFixed(0)}% — excellent. Consider trying the Faces deck in Charades if not already used, since real faces add complexity.`, color: "#10B981", tag: "MojiMatch" });
    }
  }

  // Accuracy trend
  if (mojiTrend !== null) {
    if (mojiTrend < -0.15) {
      recs.push({ pri: "medium", icon: "📉", title: "Accuracy Declining", msg: `Emotion labeling dropped ${Math.abs(Math.round(mojiTrend*100))} percentage points since first session. Could indicate fatigue or increased difficulty. Consider easier content.`, color: "#F59E0B", tag: "MojiMatch" });
    } else if (mojiTrend > 0.1) {
      recs.push({ pri: "low", icon: "🚀", title: "Accuracy Improving", msg: `Accuracy improved ${Math.round(mojiTrend*100)} points across sessions — the child is learning. Keep the current routine going.`, color: "#10B981", tag: "MojiMatch" });
    }
  }

  // Deck variety
  if (pr.charades && pr.charades.decks.length === 1 && pr.charades.sessions > 3) {
    recs.push({ pri: "medium", icon: "🎨", title: "Try More Deck Themes", msg: `Only using "${pr.charades.decks[0]}" across ${pr.charades.sessions} sessions. Mixing in new themes like Animals, Faces, or Sports keeps things fresh and helps generalize skills.`, color: "#6366F1", tag: "Variety" });
  } else if (pr.charades && pr.charades.decks.length <= 2 && pr.charades.sessions > 8) {
    const sug = ["Animals","Faces","Colors","Objects","Sports"].filter(d => !pr.charades.decks.includes(d));
    if (sug.length) recs.push({ pri: "low", icon: "🎨", title: "Expand Deck Variety", msg: `Using ${pr.charades.decks.length} deck types over ${pr.charades.sessions} sessions. Consider adding: ${sug.slice(0,3).join(", ")}.`, color: "#6366F1", tag: "Variety" });
  }

  // Low charades score
  if (pr.charades && pr.charades.avgPoints < 1.5 && pr.charades.sessions >= 4) {
    recs.push({ pri: "medium", icon: "🎲", title: "Low Charades Scores", msg: `Averaging ${pr.charades.avgPoints.toFixed(1)} points/game. The child may do better starting with more familiar, concrete decks (Animals, Objects) rather than abstract ones (Emotions).`, color: "#F59E0B", tag: "Charades" });
  }

  // Cross-game suggestions
  if (pr.charades && pr.charades.sessions > 5 && pr.mojiMatch.length === 0) {
    recs.push({ pri: "medium", icon: "😊", title: "Try MojiMatch", msg: `${pr.charades.sessions} Charades sessions but hasn't tried MojiMatch. MojiMatch builds emotion recognition by labeling emotions on emojis and real faces — a great complement to Charades.`, color: "#8B5CF6", tag: "Cross-game" });
  }
  if (pr.mojiMatch.length > 0 && (!pr.charades || pr.charades.sessions < 3)) {
    recs.push({ pri: "medium", icon: "🎭", title: "Try Charades", msg: `Active in MojiMatch but minimal Charades play. Charades adds a physical, expressive dimension — acting out emotions and concepts builds on recognition skills.`, color: "#4F46E5", tag: "Cross-game" });
  }

  // Faces suggestion
  if (pr.charades && pr.charades.decks.includes("Emotions") && !pr.charades.decks.includes("Faces") && pr.charades.sessions > 10) {
    recs.push({ pri: "low", icon: "🧑", title: "Consider the Faces Deck", msg: `Experienced with Emotions deck. The Faces deck uses real human expressions, adding complexity and building real-world recognition skills.`, color: "#EC4899", tag: "Progression" });
  }

  // High engagement
  if (totalSess >= 25) {
    recs.push({ pri: "low", icon: "🌟", title: "Power User", msg: `${totalSess} total sessions — outstanding consistency. This level of regular practice drives lasting skill development.`, color: "#10B981", tag: "Engagement" });
  }

  return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.pri] || 2) - ({ high: 0, medium: 1, low: 2 }[b.pri] || 2));
}

// ─── UI Components ───
const Stat = ({ label, value, sub, color = "#1e293b", icon }) => (
  <div style={{ padding: "18px 20px", borderRadius: 16, background: "#fff", border: "1px solid #e8ecf1", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
    {icon && <div style={{ position: "absolute", top: 12, right: 14, fontSize: 20, opacity: 0.12 }}>{icon}</div>}
    <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1px" }}>{value}</div>
    <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 3 }}>{sub}</div>}
  </div>
);

const Ring = ({ value, size = 86 }) => {
  const pct = Math.round(value * 100);
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, off = circ * (1 - value);
  const c = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: c, fontFamily: "'Space Grotesk', sans-serif" }}>{pct}%</span>
      </div>
    </div>
  );
};

const Rec = ({ r }) => (
  <div style={{ display: "flex", gap: 14, padding: "18px 20px", borderRadius: 14, background: r.color + "06", border: `1px solid ${r.color}18` }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: r.color + "12", fontSize: 20 }}>{r.icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{r.title}</span>
        <span style={{
          fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          padding: "2px 8px", borderRadius: 8,
          background: r.pri === "high" ? "#FEE2E2" : r.pri === "medium" ? "#FEF3C7" : "#DCFCE7",
          color: r.pri === "high" ? "#DC2626" : r.pri === "medium" ? "#D97706" : "#16A34A",
        }}>{r.pri}</span>
        <span style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: "#f1f5f9", color: "#64748b" }}>{r.tag}</span>
      </div>
      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.55, margin: 0 }}>{r.msg}</p>
    </div>
  </div>
);

const Chip = ({ name }) => {
  const c = dc(name);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: c + "10", color: c, border: `1px solid ${c}22` }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, opacity: 0.7 }} />
      {name}
    </span>
  );
};

// ─── Main ───
export default function App() {
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");

  const profiles = useMemo(() => buildProfiles(), []);
  const users = useMemo(() => Object.values(profiles).sort((a, b) => {
    const s = p => (p.charades?.sessions || 0) + p.mojiMatch.length + (p.soundChallenge?.sessions || 0);
    return s(b) - s(a);
  }), [profiles]);

  const filtered = useMemo(() => search ? users.filter(u => u.uuid.toLowerCase().includes(search.toLowerCase())) : users, [users, search]);
  const cur = sel ? profiles[sel] : null;
  const recs = cur ? getRecs(cur) : [];

  const agg = useMemo(() => {
    const sess = users.reduce((a, u) => a + (u.charades?.sessions || 0) + u.mojiMatch.length + (u.soundChallenge?.sessions || 0), 0);
    const act = users.filter(u => {
      const d = [];
      if (u.charades?.lastPlay) d.push(new Date(u.charades.lastPlay));
      if (u.mojiMatch.length) d.push(new Date([...u.mojiMatch].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0].createdAt));
      return d.length && (new Date("2026-02-27") - Math.max(...d)) / 86400000 < 30;
    }).length;
    let as = 0, an = 0;
    users.forEach(u => u.mojiMatch.forEach(m => { as += m.accuracy; an++; }));
    const decks = new Set(); users.forEach(u => u.charades?.decks?.forEach(d => decks.add(d)));
    return { total: users.length, sess, act, avgAcc: an ? as / an : 0, decks: decks.size };
  }, [users]);

  const deckPop = useMemo(() => {
    const c = {}; users.forEach(u => u.charades?.decks?.forEach(d => { c[d] = (c[d] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const gd = useMemo(() => {
    let ch = 0, mj = 0, sc = 0;
    users.forEach(u => { ch += u.charades?.sessions || 0; mj += u.mojiMatch.length; sc += u.soundChallenge?.sessions || 0; });
    return { ch, mj, sc, tot: ch + mj + sc || 1 };
  }, [users]);

  const attention = useMemo(() =>
    users.map(u => ({ ...u, recs: getRecs(u) }))
      .filter(u => u.recs.some(r => r.pri === "high"))
      .sort((a, b) => b.recs.filter(r => r.pri === "high").length - a.recs.filter(r => r.pri === "high").length)
      .slice(0, 8)
  , [users]);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#f6f7fb" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#111827", padding: "22px 28px", color: "white", borderBottom: "2px solid #374151" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366F1, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎮</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.3px" }}>DiggyPop Advisor</h1>
              <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Usage analytics & play recommendations</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#1F2937", borderRadius: 10, padding: 3 }}>
            {["overview", "users"].map(v => (
              <button key={v} onClick={() => { setTab(v); if (v === "overview") setSel(null); }}
                style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize", background: tab === v ? "#374151" : "transparent", color: tab === v ? "#fff" : "#6B7280", transition: "all 0.15s" }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 64px" }}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
              <Stat label="Total Users" value={agg.total} icon="👥" color="#4F46E5" />
              <Stat label="Total Sessions" value={agg.sess} sub="all game types" icon="🎮" color="#7C3AED" />
              <Stat label="Active (30d)" value={agg.act} sub={`${Math.round(agg.act/agg.total*100)}% of users`} icon="🟢" color="#10B981" />
              <Stat label="Avg MojiMatch Acc." value={`${Math.round(agg.avgAcc*100)}%`} icon="🎯" color="#F59E0B" />
              <Stat label="Unique Decks" value={agg.decks} sub="themes played" icon="🃏" color="#EC4899" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {/* Game type distribution */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf1", padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Sessions by Game Type</h3>
                {[{ l: "Charades", v: gd.ch, c: "#6366F1" }, { l: "MojiMatch", v: gd.mj, c: "#EC4899" }, { l: "Sound Challenge", v: gd.sc, c: "#F59E0B" }].map(g => (
                  <div key={g.l} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                      <span style={{ color: "#374151" }}>{g.l}</span>
                      <span style={{ color: g.c }}>{g.v} <span style={{ color: "#a0aec0", fontWeight: 400 }}>({Math.round(g.v/gd.tot*100)}%)</span></span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ width: `${(g.v/gd.tot)*100}%`, height: "100%", borderRadius: 5, background: g.c }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Deck popularity */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf1", padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Most Popular Decks</h3>
                {deckPop.slice(0, 8).map(([d, n]) => (
                  <div key={d} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{d}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{n} users</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ width: `${(n/(deckPop[0]?.[1]||1))*100}%`, height: "100%", borderRadius: 3, background: dc(d), opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attention */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>⚠️ Users Needing Attention</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {attention.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e8ecf1" }}>All users on track.</div>}
              {attention.map(u => {
                const hi = u.recs.filter(r => r.pri === "high").length;
                const ts = (u.charades?.sessions || 0) + u.mojiMatch.length + (u.soundChallenge?.sessions || 0);
                return (
                  <div key={u.uuid} onClick={() => { setSel(u.uuid); setTab("users"); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderRadius: 12, background: "#fff", border: "1px solid #FECACA", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#DC2626" }}>{u.uuid.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>User {u.uuid.slice(0, 8)}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{ts} sessions</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626" }}>{hi} urgent</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{u.recs[0]?.title}</span>
                      <span style={{ color: "#cbd5e1" }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All users table */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>All Users</h3>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf1", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 20px", background: "#f8f9fc", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8ecf1" }}>
                <span>User</span><span>Charades</span><span>MojiMatch</span><span>Sound</span><span>Recs</span>
              </div>
              {users.map(u => {
                const ur = getRecs(u);
                const hi = ur.filter(r => r.pri === "high").length;
                return (
                  <div key={u.uuid} onClick={() => { setSel(u.uuid); setTab("users"); }}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 20px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8f9fc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontWeight: 600, color: "#1e293b", fontFamily: "monospace", fontSize: 12 }}>{u.uuid.slice(0, 12)}…</span>
                    <span style={{ color: "#475569" }}>{u.charades?.sessions || "—"}</span>
                    <span style={{ color: "#475569" }}>{u.mojiMatch.length || "—"}</span>
                    <span style={{ color: "#475569" }}>{u.soundChallenge?.sessions || "—"}</span>
                    <span>
                      {hi > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "#FEE2E2", color: "#DC2626", marginRight: 4 }}>{hi}</span>}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{ur.length} total</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {tab === "users" && (
          <div style={{ display: "grid", gridTemplateColumns: cur ? "260px 1fr" : "1fr", gap: 20 }}>
            <div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf1", overflow: "hidden", position: "sticky", top: 16 }}>
                <div style={{ padding: 14 }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user ID…"
                    style={{ width: "100%", padding: "9px 13px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }} />
                </div>
                <div style={{ maxHeight: 540, overflowY: "auto" }}>
                  {filtered.map(u => {
                    const ts = (u.charades?.sessions || 0) + u.mojiMatch.length + (u.soundChallenge?.sessions || 0);
                    const s = sel === u.uuid;
                    return (
                      <div key={u.uuid} onClick={() => setSel(u.uuid)}
                        style={{ padding: "11px 14px", cursor: "pointer", background: s ? "#EEF2FF" : "transparent", borderLeft: s ? "3px solid #4F46E5" : "3px solid transparent" }}>
                        <div style={{ fontSize: 12, fontWeight: s ? 700 : 600, color: s ? "#4F46E5" : "#1e293b", fontFamily: "monospace" }}>{u.uuid.slice(0, 12)}…</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{ts} sessions</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {cur ? (
              <div>
                {/* Header */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf1", padding: 24, marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827", fontFamily: "'Space Grotesk', sans-serif" }}>User {cur.uuid.slice(0, 8)}</h2>
                      <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#94a3b8", fontFamily: "monospace" }}>{cur.uuid}</p>
                    </div>
                    {cur.mojiMatch.length > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <Ring value={cur.mojiMatch.reduce((a, m) => a + m.accuracy, 0) / cur.mojiMatch.length} />
                        <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, marginTop: 3 }}>MojiMatch Accuracy</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <Stat label="Charades" value={cur.charades?.sessions || 0} sub={cur.charades ? `${cur.charades.completedGames} completed` : "—"} color="#6366F1" icon="🎭" />
                  <Stat label="MojiMatch" value={cur.mojiMatch.length} sub="emotion sessions" color="#EC4899" icon="😊" />
                  <Stat label="Sound Challenge" value={cur.soundChallenge?.sessions || 0} color="#F59E0B" icon="🔊" />
                  <Stat label="Avg Points" value={cur.charades?.avgPoints?.toFixed(1) || "—"} sub="per charades game" color="#10B981" icon="⭐" />
                  {cur.charades && <Stat label="Completion" value={`${Math.round(cur.charades.completedGames / cur.charades.sessions * 100)}%`} sub={`${cur.charades.completedGames}/${cur.charades.sessions}`} color="#3B82F6" icon="✅" />}
                </div>

                {/* Decks */}
                {cur.charades?.decks && (
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf1", padding: 20, marginBottom: 18 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Decks Played</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {cur.charades.decks.map(d => <Chip key={d} name={d} />)}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>Active: {cur.charades.firstPlay} → {cur.charades.lastPlay}</div>
                  </div>
                )}

                {/* MojiMatch history */}
                {cur.mojiMatch.length > 0 && (
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf1", padding: 20, marginBottom: 18 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>MojiMatch Session History</h3>
                    {[...cur.mojiMatch].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((m, i) => {
                      const pct = Math.round(m.accuracy * 100);
                      const c = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8", width: 80, flexShrink: 0, fontFamily: "monospace" }}>{m.createdAt}</span>
                          <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: c }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: c, width: 38, textAlign: "right" }}>{pct}%</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", width: 55, textAlign: "right" }}>{m.coins} 🪙</span>
                          <span style={{ fontSize: 11, color: "#cbd5e1", width: 50, textAlign: "right" }}>{m.sessionTime}s</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommendations */}
                <div style={{ background: "#FFFBEB", borderRadius: 16, border: "1.5px solid #FDE68A", padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 22 }}>💡</span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#92400E", fontFamily: "'Space Grotesk', sans-serif" }}>Recommendations</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#FDE68A", color: "#92400E" }}>{recs.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recs.length === 0
                      ? <p style={{ fontSize: 13, color: "#78716c", fontStyle: "italic" }}>No recommendations — this user is on track!</p>
                      : recs.map((r, i) => <Rec key={i} r={r} />)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, background: "#fff", borderRadius: 16, border: "1px solid #e8ecf1" }}>
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>👈</div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>Select a user to view details & recommendations</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
