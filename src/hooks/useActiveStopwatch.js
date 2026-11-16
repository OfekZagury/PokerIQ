import { useEffect, useRef } from "react";

// מודד זמן "נטו" שבו הטאב היה גלוי/בפוקוס מאז מונט
export default function useActiveStopwatch() {
  const activeMsRef = useRef(0);
  const lastResumeRef = useRef(Date.now());
  const runningRef = useRef(true);

  useEffect(() => {
    const onVis = () => {
      const now = Date.now();
      if (document.hidden) {
        // יציאה מפוקוס: צובר את הקטע האחרון
        if (runningRef.current) activeMsRef.current += now - lastResumeRef.current;
      } else {
        // חזרה לפוקוס: מתחיל קטע חדש
        lastResumeRef.current = now;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const readSeconds = () => {
    let ms = activeMsRef.current;
    if (!document.hidden && runningRef.current) {
      ms += Date.now() - lastResumeRef.current;
    }
    return Math.round(ms / 1000);
  };

  const pause = () => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (!document.hidden) {
      activeMsRef.current += Date.now() - lastResumeRef.current;
    }
  };

  const resume = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastResumeRef.current = Date.now();
  };

  return { readSeconds, pause, resume };
}
