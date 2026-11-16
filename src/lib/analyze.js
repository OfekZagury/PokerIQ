// src/lib/analize.js
// איסוף מקומי + חישוב דוחות מתוך ה-track שלך (GA נשאר כרגיל)
// התאמה מלאה לאירועים: "Game Started" / "Game Completed" / "Game Abandoned"
// פרמטרים: { gameId, spentSec, reason }, ועוד מטא (sessionId/path/env/…).

const LS_KEY = "pokeriq_local_analytics";
const MAX_ROWS = 5000;
const PHANTOM_ABANDON_SEC = 1;   // ≤1 שנ' → נטישה פיקטיבית (נזרק)
const START_DUP_WINDOW_MS = 120; // התחלות כפולות צמודות (StrictMode) → מאוחד

export function initLocalAnalyticsSink() {
  if (typeof window === "undefined") return;
  if (window.__ANALYTICS_LOCAL_SINK) return; // כבר מאותחל

  window.__ANALYTICS_LOCAL_SINK = function sink(row) {
    try {
      const list = loadAll();
      list.push({
        ts: row?.ts || new Date().toISOString(),
        user: row?.user || null,
        event: String(row?.event || ""),
        props: { ...(row?.props || {}) },
      });
      // שמירה עם קאפ
      if (list.length > MAX_ROWS) list.splice(0, list.length - MAX_ROWS);
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };
}

export function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch { return []; }
}

export function clearAllAnalytics() {
  localStorage.removeItem(LS_KEY);
}

// מבנה עזר ל-state פר משתמש+משחק
function makeUG() {
  return {
    openStart: null,        // { tStartMs }
    lastStartMs: 0,
    started: 0,
    completed: 0,
    abandoned: 0,
    phantomAbandoned: 0,
    dupStarts: 0,
    durationsCompletedSec: [],
    durationsAbandonedSec: [],
    attemptsSinceCompletion: 0,
    attemptsList: [],
  };
}

function toMs(iso) { const v = Date.parse(iso); return Number.isFinite(v) ? v : 0; }
function fmt(sec) {
  if (!isFinite(sec) || sec <= 0) return "00:00";
  const s = Math.round(sec);
  const m = Math.floor(s/60), ss = s%60;
  return `${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}
function median(arr){ if(!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }

export function getSummary({ days = 30 } = {}) {
  const sinceMs = Date.now() - days*24*60*60*1000;
  const rows = loadAll()
    .filter(r => toMs(r.ts) >= sinceMs)
    .sort((a,b) => toMs(a.ts) - toMs(b.ts)); // כרונולוגי

  // per (userId || sessionId, gameId)
  const ugMap = new Map();
  const gMap  = new Map();

  const keyUG = (user, gid) => `${user||"anon"}::${gid}`;

  for (const r of rows) {
    const ev = String(r.event || "");
    const p  = r.props || {};
    const gid = Number(p.gameId);
    if (!gid) continue;

    // נזהה משתמש או sessionId
    const user = r.user || p.sessionId || "anon";
    const k = keyUG(user, gid);

    if (!ugMap.has(k)) ugMap.set(k, makeUG());
    const ug = ugMap.get(k);

    if (!gMap.has(gid)) gMap.set(gid, makeUG());
    const gg = gMap.get(gid);

    const tMs = toMs(r.ts);

    if (ev === "Game Started") {
      if (tMs - ug.lastStartMs <= START_DUP_WINDOW_MS) {
        ug.dupStarts++; gg.dupStarts++; continue;
      }
      ug.lastStartMs = tMs;
      ug.openStart = { tStartMs: tMs };
      ug.started++;  gg.started++;
      ug.attemptsSinceCompletion++;

    } else if (ev === "Game Completed") {
      let sec = Number(p.spentSec);
      if (!Number.isFinite(sec) || sec < 0) {
        // fallback: אם אין spentSec – נחשב מההתחלה הפתוחה אם קיימת
        sec = ug.openStart ? Math.max(0, Math.round((tMs - ug.openStart.tStartMs)/1000)) : 0;
      }
      ug.durationsCompletedSec.push(sec);
      gg.durationsCompletedSec.push(sec);
      ug.completed++; gg.completed++;

      const attemptsUsed = Math.max(1, ug.attemptsSinceCompletion);
      ug.attemptsList.push(attemptsUsed);
      gg.attemptsList.push(attemptsUsed);
      ug.attemptsSinceCompletion = 0;

      ug.openStart = null;

    } else if (ev === "Game Abandoned") {
      let sec = Number(p.spentSec);
      // סינון נטישות פיקטיביות (strict/cleanup)
      if (!Number.isFinite(sec) || sec <= PHANTOM_ABANDON_SEC || !ug.openStart) {
        ug.phantomAbandoned++; gg.phantomAbandoned++;
        continue;
      }
      ug.durationsAbandonedSec.push(sec);
      gg.durationsAbandonedSec.push(sec);
      ug.abandoned++; gg.abandoned++;
      // לא מאפסים attemptsSinceCompletion (הניסיון נכשל)
      ug.openStart = null;
    }
  }

  const games = [...gMap.entries()].sort((a,b)=>a[0]-b[0]).map(([gameId, g]) => {
    const avgC = g.durationsCompletedSec.length
      ? g.durationsCompletedSec.reduce((a,b)=>a+b,0)/g.durationsCompletedSec.length
      : 0;
    const medC = median(g.durationsCompletedSec);
    const avgA = g.durationsAbandonedSec.length
      ? g.durationsAbandonedSec.reduce((a,b)=>a+b,0)/g.durationsAbandonedSec.length
      : 0;

    const attemptsToCompleteAvg = g.attemptsList.length
      ? g.attemptsList.reduce((a,b)=>a+b,0)/g.attemptsList.length
      : 0;

    const denom = g.started || (g.completed || 1);
    const completion = (100 * g.completed) / denom;

    return {
      gameId,
      started: g.started,
      completed: g.completed,
      abandoned: g.abandoned,
      phantomAbandoned: g.phantomAbandoned,
      dupStarts: g.dupStarts,
      completion: Number(completion.toFixed(1)),
      avgTime: fmt(avgC),       avgTimeSec: Math.round(avgC),
      medTime: fmt(medC),       medTimeSec: Math.round(medC),
      avgAbandon: fmt(avgA),    avgAbandonSec: Math.round(avgA),
      attemptsToCompleteAvg: Number(attemptsToCompleteAvg.toFixed(2)),
    };
  });

  // totals
  const t = games.reduce((acc, g) => {
    acc.started += g.started;
    acc.completed += g.completed;
    acc.abandoned += g.abandoned;
    acc.phantomAbandoned += g.phantomAbandoned;
    acc.dupStarts += g.dupStarts;
    acc.sumAvgCWeighted += g.avgTimeSec * g.completed;
    acc.completedForAvg += g.completed;
    acc.sumAvgAWeighted += g.avgAbandonSec * g.abandoned;
    acc.abandonedForAvg += g.abandoned;
    acc.sumAttemptsToComplete += g.attemptsToCompleteAvg;
    acc.games += 1;
    return acc;
  }, { started:0,completed:0,abandoned:0,phantomAbandoned:0,dupStarts:0,
       sumAvgCWeighted:0,completedForAvg:0,sumAvgAWeighted:0,abandonedForAvg:0,
       sumAttemptsToComplete:0,games:0 });

  const totals = {
    started: t.started,
    completed: t.completed,
    abandoned: t.abandoned,
    phantomAbandoned: t.phantomAbandoned,
    dupStarts: t.dupStarts,
    completion: t.started ? Number(((100*t.completed)/t.started).toFixed(1)) : 0,
    avgTime: fmt(t.completedForAvg ? t.sumAvgCWeighted/t.completedForAvg : 0),
    avgAbandon: fmt(t.abandonedForAvg ? t.sumAvgAWeighted/t.abandonedForAvg : 0),
    attemptsToCompleteAvg: t.games ? Number((t.sumAttemptsToComplete/t.games).toFixed(2)) : 0,
  };

  return { days, games, totals, raw: rows };
}

export function printConsole({ days = 30 } = {}) {
  const { games, totals } = getSummary({ days });
  // טבלת משחקים
  // eslint-disable-next-line no-console
  console.table(games.map(g => ({
    gameId: g.gameId,
    started: g.started,
    completed: g.completed,
    abandoned: g.abandoned,
    phantomAbandoned: g.phantomAbandoned,
    dupStarts: g.dupStarts,
    completion: g.completion+"%",
    avgTime: g.avgTime,
    medTime: g.medTime,
    avgAbandon: g.avgAbandon,
    attemptsToCompleteAvg: g.attemptsToCompleteAvg,
  })));
  // שורה מסכמת
  // eslint-disable-next-line no-console
  console.log("TOTALS:", totals);
}
