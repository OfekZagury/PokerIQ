export class User {
  constructor({
    role = "user",
    email = "",
    full_name = "",
    current_game = 1,
    last_completed_date = null, // YYYY-MM-DD
    game_progress = {},         // { game_1_completed: true, ... }
  } = {}) {
    this.role = role;
    this.email = email;
    this.full_name = full_name;
    this.current_game = current_game;
    this.last_completed_date = last_completed_date;
    this.game_progress = game_progress;
  }
}
