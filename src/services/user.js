const API = import.meta.env.VITE_API_BASE || "http://localhost:5174";

export const UserService = {
  async me() {
    const r = await fetch(`${API}/me`, { credentials: "include" });
    if (!r.ok) throw new Error("Not logged in");
    return r.json();
  },

  async login(data) {
    const r = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data) // צריך לפחות {email}
    });
    if (!r.ok) {
      const msg = await r.json().catch(() => ({}));
      throw new Error(msg.error || "login failed");
    }
    return r.json();
  },

  async register(data) {
    const r = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data) // צריך {email, full_name?}
    });
    if (!r.ok) {
      const msg = await r.json().catch(() => ({}));
      throw new Error(msg.error || "register failed");
    }
    return r.json();
  },

  async logout() {
    await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
  },

  async completeGame(gameId) {
    const r = await fetch(`${API}/complete-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ gameId }),
    });
    if (!r.ok) {
      const msg = await r.json().catch(() => ({}));
      throw new Error(msg.error || "complete failed");
    }
    return r.json();
  },

  async updateMyUserData(patch = {}) {
    const r = await fetch(`${API}/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch)
    });
    if (!r.ok) throw new Error("update failed");
    return r.json();
  },
};
