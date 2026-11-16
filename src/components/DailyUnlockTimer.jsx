import React, { useEffect, useMemo, useState } from "react";

function pad(n) { return String(n).padStart(2, "0"); }
function nextLocalMidnight() {
  const now = new Date();
  const m = new Date(now);
  m.setHours(24, 0, 0, 0); // מחר 00:00 לפי זמן מקומי של המשתמש
  return m;
}

export default function DailyUnlockTimer({ nextUnlockAt }) {
  // יעד הספירה: אם יש next_unlock_at עתידי — נשתמש בו; אחרת חצות מקומי
  const target = useMemo(() => {
    const serverTarget = nextUnlockAt ? new Date(nextUnlockAt) : null;
    const now = new Date();
    if (serverTarget && serverTarget > now) return serverTarget;
    return nextLocalMidnight();
  }, [nextUnlockAt]);

  const [remaining, setRemaining] = useState(() => Math.max(0, target - new Date()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - new Date()));
    const id = setInterval(tick, 1000);
    tick(); // רענון מידי
    return () => clearInterval(id);
  }, [target]);

  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const isUnlocked = remaining <= 0;

  return (
    <div className="rounded-xl border border-green-700/40 bg-black/30 px-4 py-3 text-sm text-green-200 backdrop-blur shadow-[0_0_0_1px_rgba(16,185,129,0.2)]">
      {isUnlocked ? (
        <span>
          ✅ <span className="text-yellow-300 font-semibold">Next game is unlocked</span> — you can play now.
        </span>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-green-300">Next unlock in</span>
          <span className="font-semibold text-yellow-300 tabular-nums">
            {pad(hrs)}:{pad(mins)}:{pad(secs)}
          </span>
        </div>
      )}
      {/* הצגת זמן היעד (אופציונלי): */}
      {!isUnlocked && (
        <div className="mt-1 text-xs text-green-400/80">
          Unlocks at: {target.toLocaleString()}
        </div>
      )}
    </div>
  );
}
