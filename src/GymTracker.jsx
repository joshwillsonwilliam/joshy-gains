import { useState, useEffect, useRef } from "react";

// ─── Built-in Programme ───────────────────────────────────────────────────────
const PROGRAM = {
  Pull: {
    BACK: [
      { id: "wide_grip_pull_ups",    name: "Wide Grip Pull Ups",     sets: 4, reps: 8,  lowerIsBetter: true },
      { id: "lat_pull_down",         name: "Lat Pull Down",          sets: 4, reps: 8  },
      { id: "bent_over_rows",        name: "Bent Over Rows",         sets: 4, reps: 6  },
    ],
    BICEPS: [
      { id: "standing_db_curls",     name: "Standing DB Curls",      sets: 4, reps: 6  },
      { id: "preacher_curls",        name: "Preacher Curls",         sets: 4, reps: 6  },
      { id: "barbell_forearm_curls", name: "Barbell Forearm Curls",  sets: 4, reps: 8  },
    ],
  },
  Push: {
    CHEST: [
      { id: "bench",                 name: "Bench",                  sets: 5, reps: 6  },
      { id: "incline_db_press",      name: "Incline Dumbbell Press", sets: 4, reps: 8  },
      { id: "seated_flys",           name: "Seated Flys",            sets: 4, reps: 6  },
    ],
    TRICEPS: [
      { id: "tricep_extension",      name: "Tricep Extension",       sets: 4, reps: 8  },
      { id: "dips",                  name: "Dips",                   sets: 4, reps: 8,  lowerIsBetter: true },
      { id: "tricep_cable_pushdown", name: "Tricep Cable Push Down", sets: 4, reps: 12 },
    ],
  },
  "Legs/Shoulders": {
    LEGS: [
      { id: "squats",                name: "Squats",                 sets: 5, reps: 6  },
      { id: "incline_leg_press",     name: "Incline Leg Press",      sets: 4, reps: 8  },
      { id: "hamstring_machine",     name: "Hamstring Machine",      sets: 4, reps: 10 },
      { id: "quad_machine",          name: "Quad Machine",           sets: 4, reps: 10 },
      { id: "seated_calf_raises",    name: "Seated Calf Raises",     sets: 4, reps: 12 },
    ],
    SHOULDERS: [
      { id: "overhead_press",        name: "Overhead Press",         sets: 4, reps: 8  },
      { id: "dumbbell_press",        name: "Dumbbell Press",         sets: 4, reps: 8  },
      { id: "cable_lat_raises",      name: "Cable Lat Raises",       sets: 4, reps: 8  },
      { id: "rear_delts",            name: "Rear Delts",             sets: 4, reps: 10 },
    ],
  },
};

const CATEGORIES = Object.keys(PROGRAM);

// Merge built-in + custom exercises into a full programme map
const buildFullProgram = (custom) => {
  const full = {};
  for (const cat of CATEGORIES) {
    full[cat] = {};
    for (const [sg, exs] of Object.entries(PROGRAM[cat])) {
      full[cat][sg] = [...exs];
    }
    // append custom exercises for this category
    for (const ex of custom.filter(e => e.category === cat)) {
      if (!full[cat][ex.subgroup]) full[cat][ex.subgroup] = [];
      full[cat][ex.subgroup].push(ex);
    }
  }
  return full;
};

const allExercisesInCat = (fullProg, cat) => Object.values(fullProg[cat] || {}).flat();
const findExercise = (fullProg, id) =>
  Object.values(fullProg).flatMap(g => Object.values(g).flat()).find(e => e.id === id);

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg:        "#080808",
  surface:   "#111111",
  surface2:  "#181818",
  border:    "#242424",
  accent:    "#FFB3C6",
  accentDim: "rgba(255,179,198,0.12)",
  accentBrd: "rgba(255,179,198,0.35)",
  green:     "#34d399",
  greenDim:  "rgba(52,211,153,0.1)",
  greenBrd:  "rgba(52,211,153,0.3)",
  text:      "#ededed",
  muted:     "#777",
  dim:       "#3a3a3a",
};

const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

// ─── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, variant }) {
  const bg  = variant === "pb" ? "rgba(255,179,198,0.12)" : variant === "today" ? "rgba(52,211,153,0.1)"  : "#181818";
  const brd = variant === "pb" ? "rgba(255,179,198,0.35)" : variant === "today" ? "rgba(52,211,153,0.3)"  : "#242424";
  const col = variant === "pb" ? "#FFB3C6"                : variant === "today" ? "#34d399"               : "#777";
  const val = variant === "pb" ? "#FFB3C6"                : variant === "today" ? "#34d399"               : "#ededed";
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${brd}`, borderRadius: 7, padding: "9px 11px" }}>
      <div style={{ fontSize: 9, letterSpacing: 1.8, color: col, fontWeight: 700, marginBottom: 5, fontFamily: "'Barlow', sans-serif" }}>{label}</div>
      <div style={{ fontFamily: "'Inconsolata', monospace", fontWeight: 700, fontSize: 17, color: val }}>{value}</div>
    </div>
  );
}

// ─── Email Modal ─────────────────────────────────────────────────────────────
function EmailModal({ savedEmail, onSend, onClose }) {
  const [address, setAddress] = useState(savedEmail || "");
  const [error,   setError]   = useState("");

  const handleSend = () => {
    if (!address.trim() || !address.includes("@")) { setError("Please enter a valid email address"); return; }
    onSend(address.trim());
  };

  const inputStyle = {
    width: "100%", background: "#080808", border: "1px solid #242424",
    borderRadius: 6, padding: "13px 14px", color: "#ededed",
    fontSize: 16, fontFamily: "'Barlow', sans-serif", outline: "none",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111111", border: "1px solid #242424",
        borderRadius: "16px 16px 0 0", padding: "24px 20px 36px",
        width: "100%", maxWidth: 480,
      }}>
        <div style={{ width: 36, height: 4, background: "#3a3a3a", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: "#FFB3C6", marginBottom: 6 }}>
          EMAIL MY DATA
        </div>
        <div style={{ fontSize: 13, color: "#777", marginBottom: 20, lineHeight: 1.5 }}>
          Opens your Mail app with all your gym data in the body. Your address is saved for next time.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle} type="email" value={address}
            placeholder="your@email.com" autoFocus
            onChange={e => { setAddress(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          {error && (
            <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "8px 12px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "13px 0", borderRadius: 8,
              background: "#080808", border: "1px solid #242424", color: "#777",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1.2, cursor: "pointer",
            }}>CANCEL</button>
            <button onClick={handleSend} style={{
              flex: 2, padding: "13px 0", borderRadius: 8,
              background: "#FFB3C6", border: "none", color: "#000",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1.2, cursor: "pointer",
            }}>SEND TO MYSELF ✉</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Exercise Modal ───────────────────────────────────────────────────────
function AddExerciseModal({ onSave, onClose }) {
  const [name,          setName]          = useState("");
  const [category,      setCategory]      = useState(CATEGORIES[0]);
  const [subgroup,      setSubgroup]      = useState("");
  const [customSg,      setCustomSg]      = useState("");
  const [sets,          setSets]          = useState("4");
  const [reps,          setReps]          = useState("8");
  const [lowerIsBetter, setLowerIsBetter] = useState(false);
  const [error,         setError]         = useState("");

  // Subgroup options for the chosen category
  const sgOptions = Object.keys(PROGRAM[category]);

  const handleCatChange = (cat) => {
    setCategory(cat);
    setSubgroup("");
    setCustomSg("");
  };

  const effectiveSg = subgroup === "__new__" ? customSg.trim().toUpperCase() : subgroup;

  const handleSave = () => {
    if (!name.trim())       { setError("Exercise name is required"); return; }
    if (!effectiveSg)       { setError("Please choose or enter a subgroup"); return; }
    if (!sets || !reps)     { setError("Sets and reps are required"); return; }

    const id = `custom_${Date.now()}_${name.trim().toLowerCase().replace(/\s+/g, "_")}`;
    onSave({
      id,
      name:         name.trim(),
      category,
      subgroup:     effectiveSg,
      sets:         parseInt(sets),
      reps:         parseInt(reps),
      lowerIsBetter,
      custom:       true,
    });
  };

  const inputStyle = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 6, padding: "11px 14px", color: C.text,
    fontSize: 15, fontFamily: "'Barlow', sans-serif", outline: "none",
  };
  const labelStyle = {
    fontSize: 9, letterSpacing: 1.8, color: C.muted, fontWeight: 700,
    marginBottom: 6, display: "block", fontFamily: "'Barlow', sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "16px 16px 0 0", padding: "24px 20px 36px",
        width: "100%", maxWidth: 480,
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: C.dim, borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: C.accent, marginBottom: 20 }}>
          ADD EXERCISE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>EXERCISE NAME</label>
            <input
              style={inputStyle} value={name} placeholder="e.g. Cable Fly"
              onChange={e => { setName(e.target.value); setError(""); }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>CATEGORY</label>
            <div style={{ display: "flex", gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => handleCatChange(cat)} style={{
                  flex: 1, padding: "9px 6px", borderRadius: 6, border: `1px solid ${category === cat ? C.accent : C.border}`,
                  background: category === cat ? C.accentDim : C.bg,
                  color: category === cat ? C.accent : C.muted,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 1, cursor: "pointer",
                }}>
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Subgroup */}
          <div>
            <label style={labelStyle}>SUBGROUP</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: subgroup === "__new__" ? 8 : 0 }}>
              {sgOptions.map(sg => (
                <button key={sg} onClick={() => { setSubgroup(sg); setError(""); }} style={{
                  padding: "7px 14px", borderRadius: 6, border: `1px solid ${subgroup === sg ? C.accent : C.border}`,
                  background: subgroup === sg ? C.accentDim : C.bg,
                  color: subgroup === sg ? C.accent : C.muted,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: 1, cursor: "pointer",
                }}>
                  {sg}
                </button>
              ))}
              <button onClick={() => { setSubgroup("__new__"); setError(""); }} style={{
                padding: "7px 14px", borderRadius: 6, border: `1px solid ${subgroup === "__new__" ? C.accent : C.border}`,
                background: subgroup === "__new__" ? C.accentDim : C.bg,
                color: subgroup === "__new__" ? C.accent : C.muted,
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: 1, cursor: "pointer",
              }}>
                + NEW
              </button>
            </div>
            {subgroup === "__new__" && (
              <input
                style={{ ...inputStyle, marginTop: 0 }} value={customSg}
                placeholder="New subgroup name"
                onChange={e => { setCustomSg(e.target.value); setError(""); }}
                autoFocus
              />
            )}
          </div>

          {/* Sets + Reps */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>SETS</label>
              <input style={inputStyle} type="number" min="1" value={sets}
                onChange={e => setSets(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>REPS</label>
              <input style={inputStyle} type="number" min="1" value={reps}
                onChange={e => setReps(e.target.value)} />
            </div>
          </div>

          {/* Lower is better toggle */}
          <div onClick={() => setLowerIsBetter(v => !v)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 8,
            background: lowerIsBetter ? C.accentDim : C.bg,
            border: `1px solid ${lowerIsBetter ? C.accent : C.border}`,
            cursor: "pointer",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: lowerIsBetter ? C.accent : C.text }}>Lower is better</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>For assisted exercises like Pull Ups & Dips</div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11, position: "relative",
              background: lowerIsBetter ? C.accent : C.dim, transition: "background .2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: lowerIsBetter ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left .2s",
              }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "8px 12px" }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "13px 0", borderRadius: 8,
              background: C.bg, border: `1px solid ${C.border}`, color: C.muted,
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1.2, cursor: "pointer",
            }}>CANCEL</button>
            <button onClick={handleSave} style={{
              flex: 2, padding: "13px 0", borderRadius: 8,
              background: C.accent, border: "none", color: "#000",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1.2, cursor: "pointer",
            }}>SAVE EXERCISE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GymTracker() {
  const [sessions,      setSessions]      = useState([]);
  const [customEx,      setCustomEx]      = useState([]);
  const [category,      setCategory]      = useState("Pull");
  const [selectedId,    setSelectedId]    = useState(null);
  const [weight,        setWeight]        = useState("");
  const [view,          setView]          = useState("log");
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [savedEmail,     setSavedEmail]     = useState("");
  const importRef = useRef();

  const today      = todayISO();
  const todayLog   = sessions.filter(s => s.date === today);
  const fullProg   = buildFullProgram(customEx);

  useEffect(() => {
    try {
      const r = localStorage.getItem("ironlog_v1");
      if (r) setSessions(JSON.parse(r));
    } catch {}
    try {
      const c = localStorage.getItem("ironlog_custom_ex");
      if (c) setCustomEx(JSON.parse(c));
    } catch {}
    try {
      const em = localStorage.getItem("ironlog_email");
      if (em) setSavedEmail(em);
    } catch {}
    setLoading(false);
  }, []);

  const persistSessions = (next) => {
    setSessions(next);
    try { localStorage.setItem("ironlog_v1", JSON.stringify(next)); } catch {}
  };

  const persistCustomEx = (next) => {
    setCustomEx(next);
    try { localStorage.setItem("ironlog_custom_ex", JSON.stringify(next)); } catch {}
  };

  // ── PB logic ──
  const getPB = (id) => {
    const ex = findExercise(fullProg, id);
    const ws = sessions.filter(s => s.exerciseId === id).map(s => s.weight);
    if (!ws.length) return null;
    return ex?.lowerIsBetter ? Math.min(...ws) : Math.max(...ws);
  };

  const wasNewPBAtTime = (id, w, date) => {
    const ex = findExercise(fullProg, id);
    const prior = sessions.filter(s => s.exerciseId === id && s.date < date).map(s => s.weight);
    if (!prior.length) return true;
    const prevBest = ex?.lowerIsBetter ? Math.min(...prior) : Math.max(...prior);
    return ex?.lowerIsBetter ? w < prevBest : w > prevBest;
  };

  const getLastWeight  = (id) => {
    const e = sessions.filter(s => s.exerciseId === id && s.date !== today)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return e[0]?.weight ?? null;
  };
  const getTodayWeight = (id) => todayLog.find(s => s.exerciseId === id)?.weight ?? null;

  const handleSelect = (ex) => {
    if (selectedId === ex.id) { setSelectedId(null); setWeight(""); return; }
    setSelectedId(ex.id);
    const last = getLastWeight(ex.id);
    setWeight(last != null ? String(last) : "");
  };

  const logWeight = () => {
    const ex = allExercisesInCat(fullProg, category).find(e => e.id === selectedId);
    if (!ex || !weight) return;
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    const isNewPB = wasNewPBAtTime(ex.id, w, today);
    const subgroup = Object.entries(fullProg[category]).find(([, exs]) =>
      exs.some(e => e.id === ex.id)
    )?.[0] ?? "";

    const entry = {
      id: Date.now().toString(), date: today,
      exerciseId: ex.id, exerciseName: ex.name,
      category, subgroup, weight: w, sets: ex.sets, reps: ex.reps,
    };
    const filtered = sessions.filter(s => !(s.exerciseId === ex.id && s.date === today));
    persistSessions([...filtered, entry]);

    showToast(isNewPB ? `🏆 NEW PB — ${w} kg!` : `✓ ${w} kg logged`);
    setWeight("");
    setSelectedId(null);
  };

  const handleAddExercise = (ex) => {
    persistCustomEx([...customEx, ex]);
    setShowAddModal(false);
    showToast(`✓ ${ex.name} added`);
  };

  // ── CSV Export ──
  const exportCSV = () => {
    if (!sessions.length) { showToast("Nothing to export yet"); return; }
    const csv = buildCSV();
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `gains_${today}.csv` }).click();
    showToast("CSV downloaded ↓");
  };

  // ── Build CSV string (shared by export + email) ──
  const buildCSV = () => {
    const hdr  = ["Date", "Category", "Subgroup", "Exercise", "Sets", "Reps", "Weight (kg)"];
    const rows = [...sessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(s => [s.date, s.category, s.subgroup ?? "", s.exerciseName, s.sets, s.reps, s.weight]);
    return [hdr, ...rows].map(r => r.join(",")).join("\n");
  };

  // ── Email CSV ──
  const emailCSV = (address) => {
    if (!sessions.length) { showToast("Nothing to export yet"); return; }
    try { localStorage.setItem("ironlog_email", address); } catch {}
    setSavedEmail(address);
    const csv     = buildCSV();
    const subject = encodeURIComponent(`Joshy's Gains-O-Matic — ${today}`);
    const body    = encodeURIComponent(
      `Your gym data export from Joshy's Gains-O-Matic (${today}):\n\n` + csv
    );
    window.location.href = `mailto:${encodeURIComponent(address)}?subject=${subject}&body=${body}`;
    setShowEmailModal(false);
    showToast("Opening Mail app…");
  };

  // ── CSV Import ──
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines   = ev.target.result.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
        const dateIdx   = headers.findIndex(h => h === "date");
        const catIdx    = headers.findIndex(h => h.includes("category"));
        const subIdx    = headers.findIndex(h => h.includes("subgroup"));
        const nameIdx   = headers.findIndex(h => h.includes("exercise"));
        const setsIdx   = headers.findIndex(h => h === "sets");
        const repsIdx   = headers.findIndex(h => h === "reps");
        const weightIdx = headers.findIndex(h => h.includes("weight"));

        const imported = lines.slice(1).map((line, i) => {
          const cols = line.split(",");
          const exerciseName = cols[nameIdx]?.trim() ?? "";
          const match = Object.values(fullProg).flatMap(g => Object.values(g).flat())
            .find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
          return {
            id:           `import_${i}_${Date.now()}`,
            date:         cols[dateIdx]?.trim() ?? "",
            category:     cols[catIdx]?.trim()  ?? "",
            subgroup:     cols[subIdx]?.trim()  ?? "",
            exerciseName,
            exerciseId:   match?.id ?? exerciseName.toLowerCase().replace(/\s+/g, "_"),
            sets:         parseInt(cols[setsIdx])    || 0,
            reps:         parseInt(cols[repsIdx])    || 0,
            weight:       parseFloat(cols[weightIdx]) || 0,
          };
        }).filter(s => s.date && s.exerciseName && s.weight > 0);

        if (!imported.length) { showToast("No valid rows found"); return; }
        const existing = new Set(sessions.map(s => `${s.date}_${s.exerciseId}`));
        const fresh    = imported.filter(s => !existing.has(`${s.date}_${s.exerciseId}`));
        persistSessions([...sessions, ...fresh]);
        showToast(`✓ Imported ${fresh.length} entries`);
      } catch {
        showToast("Import failed — check file format");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const byDate       = sessions.reduce((acc, s) => { (acc[s.date] ||= []).push(s); return acc; }, {});
  const dates        = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a));
  const totalForCat  = allExercisesInCat(fullProg, category).length;

  if (loading) return (
    <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "monospace", fontSize: 13 }}>
      LOADING...
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 480, margin: "0 auto", fontFamily: "'Barlow', sans-serif", position: "relative" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Inconsolata:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #080808; margin: 0; }
        .ex-card  { transition: border-color .15s, background .15s; cursor: pointer; user-select: none; }
        .ex-card:active { transform: scale(0.99); }
        .cat-pill     { transition: all .15s; cursor: pointer; border: none; }
        .cat-pill.on  { background: #FFB3C6; color: #000; }
        .cat-pill.off { background: #181818; color: #777; }
        .cat-pill.off:hover { color: #ccc; }
        .nav-item     { transition: color .15s; cursor: pointer; border: none; background: none; }
        .nav-item.on  { color: #FFB3C6; border-bottom: 2px solid #FFB3C6; }
        .nav-item.off { color: #555;    border-bottom: 2px solid transparent; }
        .log-btn { transition: all .15s; cursor: pointer; border: none; }
        .log-btn:not(:disabled):hover  { filter: brightness(1.12); }
        .log-btn:not(:disabled):active { transform: scale(0.97); }
        .quick-chip { transition: all .15s; cursor: pointer; border: none; }
        .quick-chip:hover { border-color: #FFB3C6 !important; color: #FFB3C6 !important; }
        .icon-btn { transition: all .15s; cursor: pointer; }
        .icon-btn:hover { border-color: #FFB3C6 !important; color: #FFB3C6 !important; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        @keyframes slideDown { from { transform: translateY(-14px) translateX(-50%); opacity: 0; } to { transform: translateY(0) translateX(-50%); opacity: 1; } }
        @keyframes expandIn  { from { opacity: 0; transform: scaleY(0.92); transform-origin: top; } to { opacity: 1; transform: scaleY(1); } }
        .toast  { animation: slideDown .25s cubic-bezier(.22,1,.36,1); }
        .expand { animation: expandIn .18s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .modal-sheet { animation: slideUp .28s cubic-bezier(.22,1,.36,1); }
      `}</style>

      <input ref={importRef} type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position: "fixed", top: 18, left: "50%",
          background: C.accent, color: "#000",
          padding: "10px 22px", borderRadius: 7,
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 19, letterSpacing: 1.2,
          zIndex: 1000, whiteSpace: "nowrap",
          boxShadow: "0 6px 28px rgba(255,179,198,0.35)",
        }}>{toast}</div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          savedEmail={savedEmail}
          onSend={emailCSV}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {/* Add Exercise Modal */}
      {showAddModal && (
        <AddExerciseModal
          onSave={handleAddExercise}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding: "22px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2.5, color: C.accent, lineHeight: 1 }}>
              JOSHY'S GAINS-O-MATIC
            </div>
            <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.muted, letterSpacing: 1, marginTop: 3 }}>
              {fmtDate(today)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 4 }}>
            {todayLog.length > 0 && (
              <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.accent, background: C.accentDim, border: `1px solid ${C.accentBrd}`, borderRadius: 5, padding: "3px 9px" }}>
                {todayLog.length}/{totalForCat}
              </div>
            )}
            <button className="icon-btn" onClick={() => importRef.current?.click()} style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, padding: "5px 11px", borderRadius: 5,
              fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>↑ CSV</button>
            <button className="icon-btn" onClick={exportCSV} style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, padding: "5px 11px", borderRadius: 5,
              fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>↓ CSV</button>
            <button className="icon-btn" onClick={() => setShowEmailModal(true)} style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, padding: "5px 11px", borderRadius: 5,
              fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>✉</button>
          </div>
        </div>
      </div>

      {/* Top nav */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
        {["log", "history"].map(v => (
          <button key={v} className={`nav-item ${view === v ? "on" : "off"}`}
            onClick={() => setView(v)}
            style={{ flex: 1, padding: "12px 0", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            {v}
          </button>
        ))}
      </div>

      {/* ══ LOG VIEW ══ */}
      {view === "log" && (
        <div>
          {/* Category pills */}
          <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`cat-pill ${category === cat ? "on" : "off"}`}
                onClick={() => { setCategory(cat); setSelectedId(null); setWeight(""); }}
                style={{ padding: "7px 12px", borderRadius: 5, fontSize: 12, fontWeight: 700, letterSpacing: 0.8 }}>
                {cat.toUpperCase()}
              </button>
            ))}
            {/* Add exercise button */}
            <button onClick={() => setShowAddModal(true)} style={{
              marginLeft: "auto", background: C.accentDim, border: `1px solid ${C.accentBrd}`,
              color: C.accent, padding: "7px 13px", borderRadius: 5,
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>+ ADD</button>
          </div>

          {/* Exercise list */}
          <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", paddingBottom: 80 }}>
            {Object.entries(fullProg[category]).map(([subgroup, exercises]) => (
              <div key={subgroup}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 3,
                  color: C.muted, padding: "14px 0 8px",
                  borderBottom: `1px solid ${C.border}`, marginBottom: 8,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>{subgroup}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 6 }}>
                  {exercises.map(ex => {
                    const isOn      = selectedId === ex.id;
                    const lastW     = getLastWeight(ex.id);
                    const pb        = getPB(ex.id);
                    const todayW    = getTodayWeight(ex.id);
                    const logged    = todayW != null;
                    const isTodayPB = logged && wasNewPBAtTime(ex.id, todayW, today);

                    return (
                      <div key={ex.id}>
                        <div className="ex-card" onClick={() => handleSelect(ex)} style={{
                          background:   isOn ? C.accentDim : logged ? C.greenDim : C.surface,
                          border:       `1px solid ${isOn ? C.accent : logged ? C.greenBrd : C.border}`,
                          borderRadius: isOn ? "8px 8px 0 0" : 8,
                          padding:      "13px 15px", position: "relative", overflow: "hidden",
                        }}>
                          {logged && !isOn && (
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.green }} />
                          )}
                          {ex.custom && (
                            <div style={{ position: "absolute", right: 10, top: 10, fontSize: 9, color: C.muted, letterSpacing: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 5px" }}>CUSTOM</div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{
                                width: 19, height: 19, borderRadius: "50%",
                                border: `2px solid ${isOn ? C.accent : logged ? C.green : C.dim}`,
                                background: isOn ? C.accent : "transparent",
                                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s",
                              }}>
                                {isOn    && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
                                {!isOn && logged && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />}
                              </div>
                              <div>
                                <div style={{
                                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, lineHeight: 1.1,
                                  color: isOn ? C.accent : logged ? C.green : C.text,
                                  display: "flex", alignItems: "center", gap: 7,
                                }}>
                                  {ex.name}
                                  {ex.lowerIsBetter && (
                                    <span style={{ fontSize: 9, letterSpacing: 1.5, color: C.muted, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 5px" }}>↓ LOWER</span>
                                  )}
                                </div>
                                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.muted, marginTop: 1 }}>
                                  {ex.sets} × {ex.reps} reps
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              {logged ? (
                                <>
                                  <div style={{ fontFamily: "'Inconsolata', monospace", fontWeight: 700, fontSize: 22, color: isTodayPB ? C.accent : C.green, lineHeight: 1 }}>
                                    {todayW}<span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}> kg</span>
                                  </div>
                                  {isTodayPB && <div style={{ fontSize: 10, color: C.accent, marginTop: 2, letterSpacing: 1 }}>🏆 PB</div>}
                                </>
                              ) : lastW != null ? (
                                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 14, color: C.dim }}>
                                  {lastW}<span style={{ fontSize: 10 }}> kg</span>
                                </div>
                              ) : (
                                <div style={{ fontSize: 10, color: C.dim, letterSpacing: 0.5 }}>NO DATA</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isOn && (
                          <div className="expand" style={{
                            background: C.surface2, border: `1px solid ${C.accent}`,
                            borderTop: "none", borderRadius: "0 0 8px 8px", padding: 15,
                          }}>
                            {ex.lowerIsBetter && (
                              <div style={{ fontSize: 10, color: C.muted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, padding: "6px 10px", marginBottom: 11, letterSpacing: 0.5 }}>
                                ↓ LOWER IS BETTER — PB is your lowest recorded weight
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
                              <StatBox label="LAST SESSION" value={lastW != null ? `${lastW} kg` : "—"} />
                              <StatBox label="PERSONAL BEST" value={pb != null ? `${pb} kg` : "—"} variant="pb" />
                              {todayW != null && <StatBox label="TODAY" value={`${todayW} kg`} variant="today" />}
                            </div>
                            <div style={{ display: "flex", gap: 9, alignItems: "stretch" }}>
                              <div style={{ flex: 1, position: "relative" }}>
                                <input
                                  type="number" step="0.5" min="0"
                                  value={weight}
                                  onChange={e => setWeight(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && logWeight()}
                                  placeholder="0.0" autoFocus
                                  style={{
                                    width: "100%", background: C.bg,
                                    border: `1px solid ${C.border}`, borderRadius: 6,
                                    padding: "13px 52px 13px 16px", color: C.text, fontSize: 26,
                                    fontFamily: "'Inconsolata', monospace", outline: "none", fontWeight: 700,
                                  }}
                                />
                                <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 12, fontFamily: "'Inconsolata', monospace" }}>kg</span>
                              </div>
                              <button className="log-btn" onClick={logWeight} disabled={!weight}
                                style={{
                                  background: weight ? C.accent : C.dim, color: weight ? "#000" : "#555",
                                  padding: "0 20px", borderRadius: 6,
                                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 19, letterSpacing: 1.2,
                                  cursor: weight ? "pointer" : "not-allowed", whiteSpace: "nowrap",
                                }}>
                                {todayW != null ? "UPDATE" : "LOG IT"}
                              </button>
                            </div>
                            {lastW != null && (
                              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                {[lastW - 2.5, lastW, lastW + 2.5, lastW + 5].filter(v => v > 0).map(v => {
                                  const isActive = parseFloat(weight) === v;
                                  return (
                                    <button key={v} className="quick-chip"
                                      onClick={() => setWeight(String(v))}
                                      style={{
                                        flex: 1, background: isActive ? C.accentDim : C.bg,
                                        border: `1px solid ${isActive ? C.accent : C.border}`,
                                        color: isActive ? C.accent : C.muted,
                                        borderRadius: 5, padding: "7px 0",
                                        fontSize: 12, fontFamily: "'Inconsolata', monospace", fontWeight: 600,
                                      }}>
                                      {v}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: C.dim, marginTop: 9, letterSpacing: 0.5 }}>
                              TAP A CHIP OR TYPE A VALUE · PRESS ENTER TO LOG
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ HISTORY VIEW ══ */}
      {view === "history" && (
        <div style={{ padding: "16px 20px", paddingBottom: 60 }}>
          {dates.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, marginTop: 80 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>NO SESSIONS YET</div>
              <div style={{ fontSize: 13, color: C.dim }}>Go lift something heavy.</div>
            </div>
          ) : (
            dates.map(date => {
              const entries = byDate[date].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
              return (
                <div key={date} style={{ marginBottom: 28 }}>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 2.5,
                    color: date === today ? C.accent : C.muted,
                    marginBottom: 9, paddingBottom: 5,
                    borderBottom: `1px solid ${date === today ? C.accentBrd : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span>{fmtDate(date)}</span>
                    {date === today && <span style={{ fontSize: 10, background: C.accentDim, border: `1px solid ${C.accentBrd}`, padding: "2px 8px", borderRadius: 4 }}>TODAY</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {entries.map(s => {
                      const ex     = findExercise(fullProg, s.exerciseId);
                      const isBest = wasNewPBAtTime(s.exerciseId, s.weight, s.date);
                      return (
                        <div key={s.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "9px 13px", background: C.surface,
                          border: `1px solid ${isBest ? C.accentBrd : C.border}`, borderRadius: 7,
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.exerciseName}</div>
                            <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>
                              {s.sets} × {s.reps} · {s.subgroup ?? s.category}
                              {ex?.lowerIsBetter && " · ↓"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: "'Inconsolata', monospace", fontWeight: 700, fontSize: 20, color: isBest ? C.accent : C.text, lineHeight: 1 }}>
                              {s.weight}<span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}> kg</span>
                            </div>
                            {isBest && <div style={{ fontSize: 10, color: C.accent, marginTop: 2, letterSpacing: 1 }}>🏆 PB</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
