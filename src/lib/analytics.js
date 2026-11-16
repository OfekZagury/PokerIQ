// GA4 wrapper for Vite + React, עם נתוני עזר לזיווג בלוגים (start_id/attempt_no/client_ts)
// שולח ל-GA4, ואופציונלית גם "מראה" לשרת /analytics/track ל-NDJSON.

const GA_ID = import.meta.env.VITE_GA_ID;
const API   = import.meta.env.VITE_API_BASE; // אופציונלי: http://localhost:5174 או ה-URL שלך

let currentUserId = null;

// session id יציב
function sessionId() {
  try {
    let v = localStorage.getItem("pokeriq_session_id");
    if (!v) {
      v = (crypto.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2)));
      localStorage.setItem("pokeriq_session_id", v);
    }
    return v;
  } catch { return "nosid"; }
}
function nowIso() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2)); }

// ננהל start-state לזיווג עם completion/abandon
// key = String(gameId)  -> { startId, startedAtMs }
const activeStarts = new Map();

// ספירת ניסיונות פר-משחק בצד לקוח (פשוט)
function bumpAttempt(gameId) {
  const key = `game_attempts_${gameId}`;
  const next = 1 + Number(localStorage.getItem(key) || 0);
  localStorage.setItem(key, String(next));
  return next;
}
function resetAttempt(gameId) {
  localStorage.removeItem(`game_attempts_${gameId}`);
}

// --- טעינת GA4 ---
let loaded = false;
export async function analyticsInit() {
  if (loaded || typeof window === "undefined" || !GA_ID) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer.push(arguments); };

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.onload = () => {
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      send_page_view: false,
      // הערה: אם אתה רוצה שהאירועים יופיעו בדוחות הרגילים בזמן dev, שקול לבטל debug_mode:
      // debug_mode: import.meta.env.DEV ? true : undefined,
    });
  };
  document.head.appendChild(s);
}

// --- שליחות ---
export function page(path, extra = {}) {
  const base = { page_path: path, ...toSnake(extra) };
  window.gtag?.("event", "page_view", base);

  // ⬅️ חדש: מראה מקומי (לניתוח בתוך האפליקציה)
  window.__ANALYTICS_LOCAL_SINK?.({
    ts: new Date().toISOString(),
    user: currentUserId || null,
    event: "Page Viewed",
    props: { page: path, sessionId: sessionId(), env: import.meta.env.MODE, path }
  });
}

export function identify(userId, props = {}) {
  if (!GA_ID || !userId) return;
  currentUserId = String(userId); // ⬅️ חדש
  window.gtag?.("config", GA_ID, { user_id: currentUserId });
  if (props && Object.keys(props).length) {
    window.gtag?.("set", "user_properties", toSnake(props));
  }

  // ⬅️ חדש: מראה מקומי
  window.__ANALYTICS_LOCAL_SINK?.({
    ts: new Date().toISOString(),
    user: currentUserId,
    event: "Identify",
    props: { userId: currentUserId, ...props, sessionId: sessionId(), path: location.pathname }
  });
}

/**
 * track("Game Started", { gameId })
 * track("Game Completed", { gameId, spentSec })
 * track("Game Abandoned", { gameId, spentSec, reason })
 * track("login", { method: "email" }) // GA4-recommended
 */
export function track(name, props = {}) {
  const eventName = toSnakeEvent(name); // "Game Completed" -> "game_completed"
  const client_ts = nowIso();

  const finalProps = {
    ...props,
    client_ts,
    sessionId: sessionId(),
    path: location.pathname,
    env: import.meta.env.MODE,
  };

  const gid = props?.gameId != null ? Number(props.gameId) : undefined;

  // enrich Starts
  if (eventName === "game_started" && gid) {
    const startId = uuid();
    const attemptNo = bumpAttempt(gid);
    activeStarts.set(String(gid), { startId, startedAtMs: Date.now() });

    finalProps.start_id = startId;
    finalProps.attempt_no = attemptNo;
  }

  // enrich Complete/Abandon (להוסיף start_id ו-duration_client_sec אם יש לנו התחלה פתוחה)
  if ((eventName === "game_completed" || eventName === "game_abandoned") && gid) {
    const st = activeStarts.get(String(gid));
    if (st) {
      finalProps.start_id = st.startId;
      finalProps.duration_client_sec = Math.max(0, Math.round((Date.now() - st.startedAtMs) / 1000));
      // אם הושלם — ננקה ניסיונות
      if (eventName === "game_completed") resetAttempt(gid);
      activeStarts.delete(String(gid));
    }
  }

  // GA4
  window.gtag?.("event", eventName, toSnake(finalProps));

  // ⬅️ חדש: מראה מקומי
  window.__ANALYTICS_LOCAL_SINK?.({
    ts: client_ts,
    user: currentUserId || null,
    event: name,         // משאירים את השם המקורי כמו אצלך: "Game Started" וכו'
    props: finalProps
  });


  // NDJSON mirror לשרת (אופציונלי)
  mirror({ event: name, props: finalProps });
}

function sendBoth(eventName, params) {
  window.gtag?.("event", eventName, params);
  mirror({ event: fromSnakeEvent(eventName), props: fromSnake(params) });
}

// שליחה אופציונלית לשרת כדי לבנות NDJSON (לא חובה אם אתה GA-only)
function mirror(payload) {
  if (!API) return;
  try {
    fetch(`${API}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch(()=>{});
  } catch {}
}

// --- utils: snake_case ---
function toSnakeEvent(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "_");
}
function fromSnakeEvent(s) { // רק לקוסמטיקה של NDJSON
  return String(s).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function toSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = k.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/\s+/g, "_").toLowerCase();
    out[key] = v;
  }
  return out;
}
function fromSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = v;
  }
  return out;
}
