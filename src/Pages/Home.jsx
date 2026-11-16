
import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Star, Target, Zap, BookOpen, Play, ArrowRight, ArrowLeft } from "lucide-react";
import ProgressCard from "../components/shared/ProgressCard";
import Welcome from "../components/home/Welcome";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DailyUnlockTimer from "@/Components/DailyUnlockTimer";
import { track } from "@/lib/analytics";



const games = [
  {
    id: 1,
    title: "Hand Rankings",
    description: "Learn to identify and rank poker hands from high card to royal flush",
    page: "Game1"
  },
  {
    id: 2,
    title: "Hand Flow & Betting",
    description: "Master the flow of poker hands, betting actions, and pot growth",
    page: "Game2"
  },
  {
    id: 3,
    title: "Poker Language",
    description: "Understand positions, abbreviations, and hand notation (AKs/AKo)",
    page: "Game3"
  },
  {
    id: 4,
    title: "Basic Expected Value",
    description: "Calculate EV and understand hourly win rates for profitable play",
    page: "Game4"
  },
  {
    id: 5,
    title: "Pot Odds to Percent",
    description: "Convert pot odds ratios to percentages and find break-even points",
    page: "Game5"
  },
  {
    id: 6,
    title: "Introduction to Implied Odds",
    description: "Recognize when 'bad now, good later' situations are profitable",
    page: "Game6"
  },
  {
    id: 7,
    title: "Outs & Rule of 2&4",
    description: "Count outs and quickly calculate winning chances with the 2&4 rule",
    page: "Game7"
  },
  {
    id: 8,
    title: "Effective Odds",
    description: "Master effective odds calculations with multiple cards to come",
    page: "Game8"
  },
  {
    id: 9,
    title: "Speed Math & Live Recalc",
    description: "Master rapid pot odds calculations and equity assessments for quick decision-making.",

    page: "Game9"
  },
  {
    id: 10,
    title: "Power of Position",
    description: "Understand the importance and power of table positions",
    page: "Game10"
  },
  {
    id: 11,
    title: "Hand Selection by Position",
    description: "Master pre-flop hand selection based on your table position.",
    page: "Game11"
  },
  {
    id: 12,
    title: "Preflop All-ins",
    description: "Master the mathematics of preflop all-in decisions and avoid common mistakes.",
    page: "Game12"
  },
  {
    id: 13,
    title: "Flop Defines the Hand",
    description: "Master the 'fit or fold' principle for crucial post-flop decisions.",
    page: "Game13"
  },
  {
    id: 14,
    title: "Board Texture",
    description: "Recognize wet, dry, and paired boards to refine your post-flop strategy.",
    page: "Game14"
  },
  {
    id: 15,
    title: "Free Card Strategy",
    description: "Master when to give or take free cards based on hand strength and position.",
    page: "Game15"
  },
  {
    id: 16,
    title: "Value/Protection Sizing",
    description: "Master bet sizing to maximize value while giving draws bad pot odds.",
    page: "Game16"
  },
  {
    id: 17,
    title: "Semi-bluff Thresholds",
    description: "Master all-in semi-bluffs using the Rule of 2 & 4 for drawing hands.",
    page: "Game17"
  },
  {
    id: 18,
    title: "Learning Implied Odds",
    description: "Understand when future betting rounds can justify marginal calls today.",
    page: "Game18"
  },
  {
    id: 19,
    title: "Reverse Implied Odds",
    description: "Recognize when seemingly good calls can lead to greater future losses.",
    page: "Game19"
  },
  {
    id: 20,
    title: "Outs Discount (Advanced)",
    description: "Learn to remove 'dirty outs' for more accurate hand assessments.",
    page: "Game20"
  },
  {
    id: 21,
    title: "Check-Raise Strategy",
    description: "Master the required conditions and pros/cons of the check-raise.",
    page: "Game21"
  },
  {
    id: 22,
    title: "Slow-Play Strategy",
    description: "Learn when to play strong hands weakly and when to avoid the risks.",
    page: "Game22"
  },
  {
    id: 23,
    title: "Bluffs: Breakeven & No-Bluff Spots",
    description: "Learn to calculate bluff profitability and identify when not to bluff.",
    page: "Game23"
  },
  {
    id: 24,
    title: "Induce/Stop Bluffs",
    description: "Learn techniques to encourage or prevent opponent bluffs.",
    page: "Game24"
  }
];

const chapters = [
  { title: "Chapter 1 — Mechanics, Table Feel & Core Concepts", gameIds: [1, 2, 3] },
  { title: "Chapter 2 — Why We're Here: Basic EV & Thinking", gameIds: [4] },
  { title: "Chapter 3 — Poker Math Basics", gameIds: [5, 6, 7] },
  { title: "Chapter 4 — Poker Math applications", gameIds: [8, 9] },
  { title: "Chapter 5 — Position & Situational Reading", gameIds: [10] },
  { title: "Chapter 6 — Preflop Analysis", gameIds: [11, 12] },
  { title: "Chapter 7 — Postflop Analysis Basics", gameIds: [13, 14] },
  { title: "Chapter 8 — Postflop Action Basics", gameIds: [15, 16, 17] },
  { title: "Chapter 9 — Advanced Postflop Analysis", gameIds: [18, 19, 20] },
  { title: "Chapter 10 — Advanced Postflop Action", gameIds: [21, 22] },
  { title: "Chapter 11 — Bluff Mastery: Execution rules and control", gameIds: [23, 24] },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'learningPath'
  const navigate = useNavigate();

  useEffect(() => {
    checkUserStatus();
    if (isLoggedIn) track("Dashboard Viewed");
  }, [isLoggedIn]);

  const checkUserStatus = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setIsLoggedIn(true);
    } catch (error) {
      // User is not logged in or session expired
      setUser(null);
      setIsLoggedIn(false);
      console.warn("User not logged in or session expired:", error); // Use warn for expected errors
    } finally {
      setIsLoading(false);
    }
  };

  const _handlelogin = async () => {
  try {
    await User.login({
      email: "ofek9986@gmail.com",
      full_name: "Ofek",
    });
    await checkUserStatus();
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed. Please try again.");
  }
};

  function canAccessGame(gameId) {
  const u = user;
  if (!u) return false;

  // משחקים שכבר נפתחו
  const cur = Math.max(1, u.current_game || 1);
  if (gameId <= cur) return true;

  // המשחק הבא אחרי הנוכחי (cur+1) — נפתח רק אם עבר next_unlock_at
  if (gameId === cur + 1) {
    if (!u.next_unlock_at) return false; // עדיין לא הושלם הקודם או עוד לא הוגדר חלון פתיחה
    return new Date() >= new Date(u.next_unlock_at);
  }

  // מעבר ל-+1 תמיד נעול
  return false;
}

  const isGameCompleted = (gameId) => {
    return user?.game_progress?.[`game_${gameId}_completed`] || false;
  };

  const handleGameClick = (game) => {
    track("Open Game", { gameId: game.id });
    if (canAccessGame(game.id)) {
      navigate(createPageUrl(game.page));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking your status...</p>
        </div>
      </div>
    );
  }


  if (!isLoggedIn) {
    return <Welcome onLogin={() => navigate("/login")} />;
  }

  const currentGameId = user?.current_game || 1;
  const completedGames = Object.values(user?.game_progress || {}).filter(Boolean).length;
  const totalGames = games.length;
  const overallProgress = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

  const getCurrentChapterInfo = (gameId) => {
    const chapterIndex = chapters.findIndex(ch => ch.gameIds.includes(gameId));
    if (chapterIndex !== -1) {
        return {
            number: chapterIndex + 1,
            title: chapters[chapterIndex].title
        };
    }
    return { number: 1, title: chapters[0].title }; // Default fallback
  };
  const currentChapterInfo = getCurrentChapterInfo(currentGameId);
  const currentGameData = games.find(game => game.id === currentGameId);
  const currentGameUrl = currentGameData ? createPageUrl(currentGameData.page) : createPageUrl("Home");

  if (view === 'learningPath') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
            <Button
              onClick={() => setView('dashboard')}
              variant="outline"
              className="border-green-500 text-black-300 bg-yellow-600 hover:bg-yellow-500 mb-8"
            >
                <ArrowLeft className="mr-2 w-4 h-4 font-bold" />
                <b> Back to Home page </b>
            </Button>
            <h1 className="text-6xl font-bold text-yellow-400 mb-8 pb-3 font-heading ">
                Poker Learning Path
            </h1>

          {isLoggedIn && (
              <div className="mb-4">
                <DailyUnlockTimer nextUnlockAt={user?.next_unlock_at} />
              </div>
            )}

            <div className="space-y-12">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (index * 0.1), duration: 0.6 }}
                >
                  <motion.h2
                    className="text-3xl font-bold text-yellow-400 mb-6 border-b-2 border-yellow-300/30 pb-3 font-heading"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (index * 0.1), duration: 0.6 }}
                  >
                    {chapter.title}
                  </motion.h2>
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1), duration: 0.6 }}
                  >
                    {games
                      .filter(game => chapter.gameIds.includes(game.id))
                      .map((game, gameIndex) => {
                        const isCompleted = isGameCompleted(game.id);
                        const canAccess = canAccessGame(game.id);
                        const isCurrent = game.id === currentGameId && !isCompleted;

                        return (
                          <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (index * 0.1) + (gameIndex * 0.05), duration: 0.5 }}
                          >
                            <ProgressCard
                              gameNumber={game.id}
                              title={game.title}
                              description={game.description}
                              isCompleted={isCompleted}
                              isLocked={!canAccess}
                              isCurrent={isCurrent}
                              onClick={() => handleGameClick(game)}
                            />
                          </motion.div>
                        );
                      })}
                  </motion.div>
                </motion.div>
              ))}
            </div>
            {/* Daily Progress Info - moved here as it relates to the learning path */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (chapters.length * 0.1), duration: 0.6 }}
            >
              <div className="bg-green-950/30 backdrop-blur-md rounded-xl p-6 border border-green-700/30">
                <h3 className="text-lg font-bold text-white mb-3 font-heading">📅 Daily Learning System</h3>
                <p className="text-green-200 mb-4">
                  New games unlock each day as you complete them. This spaced learning approach
                  helps you retain concepts and build skills progressively.
                </p>
                <div className="text-sm text-green-300">
                  Come back tomorrow for new challenges!
                </div>
              </div>
            </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 150 }}
          >
            <Trophy className="w-8 h-8 text-black" />
          </motion.div>
          <div>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Welcome to Poker IQ
            </motion.h1>
            <motion.p
              className="text-xl text-green-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Master poker through daily mini-games
            </motion.p>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Card className="bg-black/20 backdrop-blur-md text-white h-30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium"><b>Overall Progress</b></span>
                <span className="text-sm text-green-300">{completedGames}/{totalGames}</span>
              </div>
              <div className="w-full bg-green-950/50 rounded-full h-3">
                <div
                  className="bg-yellow-400 rounded-full h-3 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-xs text-green-300 mt-2">
                {overallProgress.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-md border border-green-700/30 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium"><b>Current Position</b></p>
                  <p className="text-xs text-green-300">Chapter {currentChapterInfo.number}, Game {currentGameId}</p>
                </div>
                <Link to={currentGameUrl}>
                  <div className="p-2 bg-yellow-400/20 rounded-full transition-all hover:bg-yellow-400/30 hover:scale-110 cursor-pointer">
                    <Play className="w-4 h-4 text-yellow-400" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="bg-yellow-400/10 backdrop-blur-md rounded-xl p-6 border border-yellow-400/30 max-w-3xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-3 font-heading">Your Learning Path</h2>
          <p className="text-green-200 mb-4">
            Master poker through our comprehensive daily learning system.
            Each game builds upon the last, gradually developing your poker intelligence from basic mechanics to advanced strategies.
            Progress through 20+ interactive lessons designed by poker professionals.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-green-300">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span>{chapters.length} Chapters</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <span>{20}+ Games</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Progressive Learning</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Button to navigate to learning path */}
      <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
      >
          <Button
            onClick={() => setView('learningPath')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-10 py-6 text-xl rounded-full shadow-lg transition-transform hover:scale-105"
          >
               Continue your road to Poker Mastery
              <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
      </motion.div>
    </div>
  );
}
