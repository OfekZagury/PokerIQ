import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// קובץ לוג NDJSON
const ANALYTICS_LOG = path.join(__dirname, "data", "analytics.ndjson");
await fs.mkdir(path.dirname(ANALYTICS_LOG), { recursive: true });

const PORT = process.env.PORT || 5174;
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

// תיקיית איחסון למשתמשים כ-JSON
const DATA_DIR = path.join(__dirname, "data", "users");

const TZ = "Asia/Jerusalem";
const MAX_GAMES = 24;


function nextMidnightUTC(_tz = TZ) {
  // מחר 00:00 באזור הזמן ואז ל-UTC
  const target = DateTime.now().setZone(_tz).plus({ days: 1 }).startOf("day");
  return new Date(target.toUTC().toISO()); // מחזיר Date ב-UTC
}
// Utils
await fs.mkdir(DATA_DIR, { recursive: true });
const fileForEmail = (email) =>
  path.join(DATA_DIR, encodeURIComponent(email) + ".json");

async function readUser(email) {
  try {
    const raw = await fs.readFile(fileForEmail(email), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeUser(email, obj) {
  await fs.writeFile(fileForEmail(email), JSON.stringify(obj, null, 2), "utf8");
}

// App
const app = express();
app.use(cors({ origin: FRONT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// לוג קצר לבקשות (אופציונלי)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// POST /logout — מחיקת ה-cookie
app.post("/logout", (req, res) => {
  res.clearCookie("sid_email");
  res.json({ ok: true });
});

// GET /me — מי אני (לפי העוגייה)
app.get("/me", async (req, res) => {
  const email = req.cookies.sid_email || req.get("x-user-email");
  if (!email) return res.status(401).json({ error: "not logged in" });

  const user = await readUser(email);
  if (!user) return res.status(401).json({ error: "session invalid" });

  // אם הגיע זמן ה-unlock (ולא רוצים צבירה): פותחים רק משחקון אחד
  if (user.next_unlock_at) {
    const now = new Date();
    const due = new Date(user.next_unlock_at);
    if (now >= due && (user.current_game ?? 1) < MAX_GAMES) {
      user.current_game = Math.max(1, (user.current_game ?? 1)) + 1; // פותחים אחד
      user.next_unlock_at = null; // מבטלים עד ההשלמה הבאה
      await writeUser(email, user);
    }
  }

  res.json(user);
});

app.patch("/me", async (req, res) => {
  const email = req.cookies.sid_email || req.get("x-user-email");
  if (!email) return res.status(401).json({ error: "not logged in" });

  const current = await readUser(email);
  if (!current) return res.status(404).json({ error: "user not found" });

  const patch = req.body || {};
  const next = {
    ...current,
    ...patch,
    game_progress: {
      ...(current.game_progress || {}),
      ...(patch.game_progress || {})
    }
  };

  await writeUser(email, next);
  res.json(next);
});

app.listen(PORT, () =>
  console.log(`API ready on http://localhost:${PORT}`)
);


// LOGIN: רק קיים. אם לא קיים -> 404
app.post("/login", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  const existing = await readUser(email);
  if (!existing) return res.status(404).json({ error: "user not found" });

  res.cookie("sid_email", email, { httpOnly: true, sameSite: "lax" });
  res.json(existing);
});

// REGISTER: יוצר חדש. אם קיים -> 409
app.post("/register", async (req, res) => {
  const { email, full_name } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  const existing = await readUser(email);
  if (existing) return res.status(409).json({ error: "user already exists" });

  const user = {
    role: "user",
    email,
    full_name: full_name || "",
    current_game: 1,
    last_completed_date: null,
    game_progress: {}
  };
  await writeUser(email, user);

  res.cookie("sid_email", email, { httpOnly: true, sameSite: "lax" });
  res.status(201).json(user);
});


// POST /complete-game — מסמן השלמה ומגדיר next_unlock_at למחר 00:00
app.post("/complete-game", async (req, res) => {
  const email = req.cookies.sid_email || req.get("x-user-email");
  if (!email) return res.status(401).json({ error: "not logged in" });

  const { gameId } = req.body || {};
  const n = Number(gameId);
  if (!n || n < 1 || n > MAX_GAMES) {
    return res.status(400).json({ error: "invalid gameId" });
  }

  const user = await readUser(email);
  if (!user) return res.status(404).json({ error: "user not found" });

  // עדכון התקדמות
  user.game_progress = { ...(user.game_progress || {}), [`game_${n}_completed`]: true };
  user.last_completed_at = new Date().toISOString(); // ISO UTC

  // אם המשתמש השלים את המשחקון ה"עליון" שנפתח לו — קובעים זמן פתיחה הבא
  const cur = Math.max(1, user.current_game ?? 1);
  if (n >= cur && cur < MAX_GAMES) {
    user.next_unlock_at = nextMidnightUTC().toISOString(); // מחר 00:00 לפי TZ
  }

  await writeUser(email, user);
  res.json(user);
});


// קולט אירועים מהפרונט וכותב שורה לכל אירוע
app.post("/analytics/track", async (req, res) => {
  try {
    const { event, props } = req.body || {};
    if (!event) return res.status(400).json({ error: "event required" });

    const row = {
      ts: new Date().toISOString(),                 // זמן UTC
      user: req.cookies?.sid_email || null,        // מזוהה לפי ה-cookie מהלוגין
      event,
      props: props || {},
    };

    await fs.appendFile(ANALYTICS_LOG, JSON.stringify(row) + "\n", "utf8");
    res.json({ ok: true });
  } catch (e) {
    console.error("analytics error:", e);
    res.status(500).json({ error: "failed" });
  }
});
