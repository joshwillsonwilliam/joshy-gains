import { useState, useEffect } from "react";

// ─── Programme ────────────────────────────────────────────────────────────────
const PROGRAM = {
  Pull: {
    BACK: [
      { id: "wide_grip_pull_ups",     name: "Wide Grip Pull Ups",     sets: 4, reps: 8  },
      { id: "lat_pull_down",          name: "Lat Pull Down",          sets: 4, reps: 8  },
      { id: "bent_over_rows",         name: "Bent Over Rows",         sets: 4, reps: 6  },
    ],
    BICEPS: [
      { id: "standing_db_curls",      name: "Standing DB Curls",      sets: 4, reps: 6  },
      { id: "preacher_curls",         name: "Preacher Curls",         sets: 4, reps: 6  },
      { id: "barbell_forearm_curls",  name: "Barbell Forearm Curls",  sets: 4, reps: 8  },
    ],
  },
  Push: {
    CHEST: [
      { id: "bench",                  name: "Bench",                  sets: 5, reps: 6  },
      { id: "incline_db_press",       name: "Incline Dumbbell Press", sets: 4, reps: 8  },
      { id: "seated_flys",            name: "Seated Flys",            sets: 4, reps: 6  },
    ],
    TRICEPS: [
      { id: "tricep_extension",       name: "Tricep Extension",       sets: 4, reps: 8  },
      { id: "dips",                   name: "Dips",                   sets: 4, reps: 8  },
      { id: "tricep_cable_pushdown",  name: "Tricep Cable Push Down", sets: 4, reps: 10 },
    ],
  },
  "Legs/Shoulders": {
    LEGS: [
      { id: "squats",                 name: "Squats",                 sets: 5, reps: 6  },
      { id: "incline_leg_press",      name: "Incline Leg Press",      sets: 4, reps: 8  },
      { id: "hamstring_machine",      name: "Hamstring Machine",      sets: 4, reps: 10 },
      { id: "quad_machine",           name: "Quad Machine",           sets: 4, reps: 10 },
      { id: "seated_calf_raises",     name: "Seated Calf Raises",     sets: 4, reps: 12 },
    ],
    SHOULDERS: [
      { id: "overhead_press",         name: "Overhead Press",         sets: 4, reps: 8  },
      { id: "dumbbell_press",         name: "Dumbbell Press",         sets: 4, reps: 8  },
      { id: "cable_lat_raises",       name: "Cable Lat Raises",       sets: 4, reps: 8  },
      { id: "rear_delts",             name: "Rear Delts",             sets: 4, reps: 10 },
    ],
  },
};

// Flatten all exercises for a given category
const allExercises = (cat) => Object.values(PROGRAM[cat]).flat();

// ─── Colour tokens ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

// ─── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, variant }) {
  const bg  = variant === "pb"    ? "rgba(255,179,198,0.12)" : variant === "today" ? "rgba(52,211,153,0.1)"  : "#181818";
  const brd = variant === "pb"    ? "rgba(255,179,198,0.35)" : variant === "today" ? "rgba(52,211,153,0.3)"  : "#242424";
  const col = variant === "pb"    ? "#FFB3C6"                : variant === "today" ? "#34d399"               : "#777";
  const val = variant === "pb"    ? "#FFB3C6"                : variant === "today" ? "#34d399"               : "#ededed";
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${brd}`, borderRadius: 7, padding: "9px 11px" }}>
      <div style={{ fontSize: 9, letterSpacing: 1.8, color: col, fontWeight: 700, marginBottom: 5, fontFamily: "'Barlow', sans-serif" }}>{label}</div>
      <div style={{ fontFamily: "'Inconsolata', monospace", fontWeight: 700, fontSize: 17, color: val }}>{value}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GymTracker() {
  const [sessions,   setSessions]   = useState([]);
  const [category,   setCategory]   = useState("Pull");
  const [selectedId, setSelectedId] = useState(null);
  const [weight,     setWeight]     = useState("");
  const [view,       setView]       = useState("log");
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);

  const today    = todayISO();
  const todayLog = sessions.filter(s => s.date === today);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("ironlog_v1");
        if (r) setSessions(JSON.parse(r.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setSessions(next);
    try { await window.storage.set("ironlog_v1", JSON.stringify(next)); } catch {}
  };

  const getLastWeight  = (id) => {
    const e = sessions.filter(s => s.exerciseId === id && s.date !== today)
                      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return e[0]?.weight ?? null;
  };
  const getPB          = (id) => {
    const ws = sessions.filter(s => s.exerciseId === id).map(s => s.weight);
    return ws.length ? Math.max(...ws) : null;
  };
  const getTodayWeight = (id) => todayLog.find(s => s.exerciseId === id)?.weight ?? null;

  const handleSelect = (ex) => {
    if (selectedId === ex.id) { setSelectedId(null); setWeight(""); return; }
    setSelectedId(ex.id);
    const last = getLastWeight(ex.id);
    setWeight(last != null ? String(last) : "");
  };

  const logWeight = async () => {
    const ex = allExercises(category).find(e => e.id === selectedId);
    if (!ex || !weight) return;
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;

    const pb      = getPB(ex.id);
    const isNewPB = pb === null || w > pb;
    // find which subgroup this exercise belongs to
    const subgroup = Object.entries(PROGRAM[category]).find(([, exs]) =>
      exs.some(e => e.id === ex.id)
    )?.[0] ?? "";

    const entry = {
      id: Date.now().toString(), date: today,
      exerciseId: ex.id, exerciseName: ex.name,
      category, subgroup, weight: w, sets: ex.sets, reps: ex.reps,
    };
    const filtered = sessions.filter(s => !(s.exerciseId === ex.id && s.date === today));
    await persist([...filtered, entry]);

    showToast(isNewPB ? `🏆 NEW PB — ${w} kg!` : `✓ ${w} kg logged`);
    setWeight("");
    setSelectedId(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const exportCSV = () => {
    if (!sessions.length) { showToast("Nothing to export yet"); return; }
    const hdr  = ["Date", "Category", "Subgroup", "Exercise", "Sets", "Reps", "Weight (kg)"];
    const rows = [...sessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(s => [s.date, s.category, s.subgroup ?? "", s.exerciseName, s.sets, s.reps, s.weight]);
    const csv  = [hdr, ...rows].map(r => r.join(",")).join("\n");
    const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `gains_${today}.csv` }).click();
    showToast("CSV downloaded ↓");
  };

  // History grouping
  const byDate = sessions.reduce((acc, s) => { (acc[s.date] ||= []).push(s); return acc; }, {});
  const dates  = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a));

  const totalForCat = allExercises(category).length;

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
      `}</style>

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
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            {todayLog.length > 0 && (
              <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.accent, background: C.accentDim, border: `1px solid ${C.accentBrd}`, borderRadius: 5, padding: "3px 9px" }}>
                {todayLog.length}/{totalForCat} done
              </div>
            )}
            <button onClick={exportCSV} style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, padding: "5px 12px", borderRadius: 5,
              cursor: "pointer", fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>↓ CSV</button>
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
          <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            {Object.keys(PROGRAM).map(cat => (
              <button key={cat} className={`cat-pill ${category === cat ? "on" : "off"}`}
                onClick={() => { setCategory(cat); setSelectedId(null); setWeight(""); }}
                style={{ padding: "7px 18px", borderRadius: 5, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Exercise list with subgroup headers */}
          <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 0, paddingBottom: 80 }}>
            {Object.entries(PROGRAM[category]).map(([subgroup, exercises]) => (
              <div key={subgroup}>
                {/* Subgroup label */}
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 3,
                  color: C.muted, padding: "14px 0 8px",
                  borderBottom: `1px solid ${C.border}`, marginBottom: 8,
                }}>
                  {subgroup}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 6 }}>
                  {exercises.map(ex => {
                    const isOn       = selectedId === ex.id;
                    const lastW      = getLastWeight(ex.id);
                    const pb         = getPB(ex.id);
                    const todayW     = getTodayWeight(ex.id);
                    const logged     = todayW != null;
                    const isTodayPB  = logged && pb != null && todayW >= pb;

                    return (
                      <div key={ex.id}>
                        {/* Card */}
                        <div className="ex-card" onClick={() => handleSelect(ex)} style={{
                          background:   isOn ? C.accentDim : logged ? C.greenDim : C.surface,
                          border:       `1px solid ${isOn ? C.accent : logged ? C.greenBrd : C.border}`,
                          borderRadius: isOn ? "8px 8px 0 0" : 8,
                          padding:      "13px 15px", position: "relative", overflow: "hidden",
                        }}>
                          {logged && !isOn && (
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.green }} />
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {/* Radio */}
                              <div style={{
                                width: 19, height: 19, borderRadius: "50%",
                                border: `2px solid ${isOn ? C.accent : logged ? C.green : C.dim}`,
                                background: isOn ? C.accent : "transparent",
                                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .15s",
                              }}>
                                {isOn   && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
                                {!isOn && logged && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />}
                              </div>
                              <div>
                                <div style={{
                                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, lineHeight: 1.1,
                                  color: isOn ? C.accent : logged ? C.green : C.text,
                                }}>{ex.name}</div>
                                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: C.muted, marginTop: 1 }}>
                                  {ex.sets} × {ex.reps} reps
                                </div>
                              </div>
                            </div>
                            {/* Weight display */}
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

                        {/* Expanded panel */}
                        {isOn && (
                          <div className="expand" style={{
                            background: C.surface2, border: `1px solid ${C.accent}`,
                            borderTop: "none", borderRadius: "0 0 8px 8px", padding: 15,
                          }}>
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
                                  placeholder="0.0"
                                  autoFocus
                                  style={{
                                    width: "100%", background: C.bg,
                                    border: `1px solid ${C.border}`, borderRadius: 6,
                                    padding: "13px 52px 13px 16px",
                                    color: C.text, fontSize: 26,
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
                      const pb     = getPB(s.exerciseId);
                      const isBest = pb != null && s.weight >= pb;
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
