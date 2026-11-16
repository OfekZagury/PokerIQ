// Browser-only replacement for the API user service, used in demo mode.
// Same method names and return shapes as services/user.js, so pages work unchanged.
// All lessons are opened by Home.jsx in demo mode; current_game here is just the
// first lesson the visitor hasn't completed yet (used for "Current Position").
const STORAGE_KEY = "pokeriq_demo_user";
const MAX_GAMES = 24;

function newGuest(fullName = "Guest") {
  return {
    role: "guest",
    email: "guest@demo",
    full_name: fullName,
    current_game: 1,
    next_unlock_at: null,
    last_completed_at: null,
    game_progress: {},
  };
}

function firstIncomplete(progress = {}) {
  for (let n = 1; n <= MAX_GAMES; n++) {
    if (!progress[`game_${n}_completed`]) return n;
  }
  return MAX_GAMES;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage unavailable or corrupted: fall back to a fresh guest
  }
  return newGuest();
}

function save(user) {
  user.current_game = firstIncomplete(user.game_progress);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // private mode / blocked storage: progress lasts for this page only
  }
  return user;
}

export const DemoUserService = {
  async me() {
    return save(load());
  },

  async login(data = {}) {
    const user = load();
    if (data.full_name) user.full_name = data.full_name;
    return save(user);
  },

  async register(data = {}) {
    return save(newGuest(data.full_name || "Guest"));
  },

  // "Logout" in demo mode resets the local progress
  async logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear
    }
  },

  async completeGame(gameId) {
    const n = Number(gameId);
    const user = load();
    user.game_progress = { ...(user.game_progress || {}), [`game_${n}_completed`]: true };
    user.last_completed_at = new Date().toISOString();
    return save(user);
  },

  async updateMyUserData(patch = {}) {
    const current = load();
    return save({
      ...current,
      ...patch,
      game_progress: { ...(current.game_progress || {}), ...(patch.game_progress || {}) },
    });
  },
};
