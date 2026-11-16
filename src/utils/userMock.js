import { UserService as User } from "@/services/user";

export function getMockUser() {
  return new User({
    role: "user",
    email: "test@example.com",
    full_name: "Test User",
    current_game: 3,
    last_completed_date: "2025-09-20",
    game_progress: {
      game_1_completed: true,
      game_2_completed: true,
      game_3_completed: false,
    },
  })
}
