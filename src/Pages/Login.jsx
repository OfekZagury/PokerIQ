import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserService as User } from "@/services/user";
import { Spade, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { identify, track } from "@/lib/analytics";

export default function Login() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!validEmail(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      setErr("Please enter your full name for registration.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await User.login({ email });
        identify(email, { email });      // mode = "login" | "register"
        track(mode === "login" ? "Login Success" : "Register Success");
      } else {
        await User.register({ email, full_name: fullName.trim() });
        identify(email, { email });     // mode = "login" | "register"
        track(mode === "login" ? "Login Success" : "Register Success");
      }
      navigate("/Home");
    } catch (e) {
      setErr(e.message || (mode === "login" ? "Login failed." : "Registration failed."));
    } finally {
      setLoading(false);
    }
  }

  // Variants לאנימציות
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0 : 0.45, ease: "easeOut" } },
    exit: { opacity: 0, y: -12, transition: { duration: prefersReduced ? 0 : 0.25 } },
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { delay: prefersReduced ? 0 : 0.06, duration: prefersReduced ? 0 : 0.35, ease: "easeOut" },
    },
  };

  const glowVariants = {
    pulse: prefersReduced
      ? {}
      : {
          boxShadow: [
            "0 0 0 0 rgba(234,179,8,0.0)",   // צהוב חלש
            "0 0 40px 8px rgba(234,179,8,0.35)",
            "0 0 0 0 rgba(234,179,8,0.0)",
          ],
          transition: { duration: 2.2, repeat: Infinity, repeatType: "reverse" },
        },
  };

  // שקשוקה קלה לשורת שגיאה
  const errorVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0 : 0.25 } },
    shake: prefersReduced
      ? {}
      : { x: [0, -6, 6, -4, 4, -2, 2, 0], transition: { duration: 0.45 } },
  };

  return (
    <motion.div
      className="mx-auto max-w-xl px-4 py-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* כותרת עליונה */}
      <div className="mb-8 text-center">
        <motion.div
          className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow"
          variants={glowVariants}
          animate="pulse"
        >
          <Spade className="h-6 w-6 text-black" />
        </motion.div>
        <h1 className="font-heading text-5xl font-bold text-white">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        <p className="mt-2 text-green-300">
          {mode === "login" ? "Welcome back to Poker IQ" : "Start your Poker IQ journey"}
        </p>
      </div>

      {/* טאבים */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <motion.button
          whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
          whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "login"
              ? "bg-yellow-500 text-black"
              : "border border-yellow-500/60 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20"
          }`}
        >
          I have an account
        </motion.button>
        <motion.button
          whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
          whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
          onClick={() => setMode("register")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "register"
              ? "bg-yellow-500 text-black"
              : "border border-yellow-500/60 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20"
          }`}
        >
          I’m new here
        </motion.button>
      </div>

      {/* כרטיס הטופס */}
      <motion.div
        className="rounded-2xl border border-green-700/40 bg-black/30 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.2)] backdrop-blur"
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-green-200">Email</span>
            <motion.input
              type="email"
              className="w-full rounded-xl border border-green-700/40 bg-yellow-500 px-4 py-3 text-gray-900 outline-none ring-0 focus:border-green-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              whileFocus={{ scale: prefersReduced ? 1 : 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            />
          </label>

          <AnimatePresence initial={false}>
            {mode === "register" && (
              <motion.label
                className="block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
              >
                <span className="mb-1 block text-sm text-green-200">Full name</span>
                <motion.input
                  type="text"
                  className="w-full rounded-xl border border-green-700/40 bg-yellow-500 px-4 py-3 text-gray-900 outline-none ring-0 focus:border-green-400"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                  whileFocus={{ scale: prefersReduced ? 1 : 1.01 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
              </motion.label>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {err && (
              <motion.div
                key={err} // יפעיל shake בכל שגיאה חדשה
                className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200"
                initial="hidden"
                animate={["visible", "shake"]}
                exit={{ opacity: 0, y: -6 }}
                variants={errorVariants}
              >
                {err}
              </motion.div>
            )}
          </AnimatePresence>

          <br />

          <motion.button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 px-5 py-3 font-semibold text-black shadow hover:brightness-110 disabled:opacity-60"
            whileHover={{ y: prefersReduced ? 0 : -1 }}
            whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
          >
            {mode === "login" ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                {loading ? "Signing in..." : "Sign in"}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                {loading ? "Creating..." : "Create account"}
              </>
            )}
          </motion.button>

        </form>
      </motion.div>
    </motion.div>
  );
}
