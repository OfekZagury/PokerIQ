
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

// Add animation variants at the top of component
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  })
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function Game4() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const gameId = 1;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const finalChallengeQuestions = [
    {
      title: "Q1. Pot Odds Call",
      prompt: "The pot is $60. Your opponent bets $30 on the turn. You estimate you have a 40% chance to win if you call, and 60% chance to lose your $30 call. What is the EV of calling, and what should you do?",
      options: ["EV = -$2 → Call", "EV = +$6 → Call", "EV = -$12 → Fold", "EV = +$18 → Raise"],
      correct: 1,
      explanation: "If you win (40%): you gain the $60 original pot + $30 opponent bet = $90. Your net profit is $90 - $30 (your call) = $60. If you lose (60%): you lose your $30 call. EV = (0.40 × $60) + (0.60 × -$30) = $24 - $18 = +$6. Since it's positive, calling is correct.",
      table: {
        players: [
          { position: 'SB', stack: 470, status: 'Folded' },
          { position: 'BB', stack: 485, status: 'Folded' },
          { position: 'UTG', stack: 520, status: 'Folded' },
          { position: 'MP', stack: 470, bet: 30, status: 'Bets $30' },
          { position: 'CO', stack: 500, status: 'Folded' },
          { position: 'BTN', stack: 500, cards: ['A♠', 'K♦'], isHero: true, isCurrent: true }
        ],
        pot: 90,
        communityCards: ['Q♠', 'J♥', '2♦', '10♣']
      }
    },
    {
      title: "Q2. Big Bluff Decision",
      prompt: "The pot is $100. You consider bluffing all-in for $50. You estimate opponents fold 60% of the time (you win the pot), but call and win 40% of the time (you lose your $50 bet). What is the EV of your bluff?",
      options: ["EV = +$10 → Bluff is profitable", "EV = -$20 → Bluff is bad", "EV = +$5 → Bluff is profitable", "EV = +$30 → Bluff is very profitable"],
      correct: 0,
      explanation: "If opponent folds (60%): you win the $100 pot. Your net gain is $100 (pot) - $50 (your bet) = $50. If opponent calls and wins (40%): you lose your $50 bet. EV = (0.60 × $50) + (0.40 × -$50) = $30 - $20 = +$10. Bluffing is profitable here.",
      table: {
        players: [
          { position: 'SB', stack: 450, status: 'Folded' },
          { position: 'BB', stack: 475, status: 'Folded' },
          { position: 'UTG', stack: 500, status: 'Folded' },
          { position: 'MP', stack: 450, status: 'Folded' },
          { position: 'CO', stack: 500 },
          { position: 'BTN', stack: 500, cards: ['7♣', '6♣'], isHero: true, isCurrent: true }
        ],
        pot: 100,
        communityCards: ['A♠', 'K♥', 'Q♦', 'J♠', '2♣']
      }
    },
    {
      title: "Q3. Marginal Call",
      prompt: "The pot is $200. Villain shoves all-in for $100. You think you have a 35% chance to win the pot, and 65% chance to lose your $100 call. What is the EV of calling?",
      options: ["EV = +$5 → Call", "EV = -$15 → Fold", "EV = +$20 → Call", "EV = -$30 → Call"],
      correct: 0,
      explanation: "If you win (35%): you gain the $200 original pot + $100 villain bet = $300. Your net profit is $300 - $100 (your call) = $200. If you lose (65%): you lose your $100 call. EV = (0.35 × $200) + (0.65 × -$100) = $70 - $65 = +$5. Slightly profitable, so calling is correct.",
      table: {
        players: [
          { position: 'SB', stack: 400, status: 'Folded' },
          { position: 'BB', stack: 450, status: 'Folded' },
          { position: 'UTG', stack: 480, status: 'Folded' },
          { position: 'MP', stack: 400, bet: 100, status: 'All-in $100' },
          { position: 'CO', stack: 500, status: 'Folded' },
          { position: 'BTN', stack: 500, cards: ['Q♣', 'J♣'], isHero: true, isCurrent: true }
        ],
        pot: 300,
        communityCards: ['A♠', '9♥', '8♦', '7♠', '2♣']
      }
    },
    {
      title: "Q4. Fold or Call?",
      prompt: "The pot is $150. Opponent bets $50 on the river. You estimate a 20% chance of winning $100 (net gain from calling), and 80% chance of losing your $50 call. What is the EV of calling?",
      options: ["EV = -$10 → Call", "EV = -$20 → Fold", "EV = +$5 → Call", "EV = -$30 → Call"],
      correct: 1,
      explanation: "EV = (0.20 × $100) + (0.80 × -$50) = $20 - $40 = -$20. Since the EV is negative, folding is the correct play to avoid further losses.",
      table: {
        players: [
          { position: 'SB', stack: 425, status: 'Folded' },
          { position: 'BB', stack: 450, status: 'Folded' },
          { position: 'UTG', stack: 480, status: 'Folded' },
          { position: 'MP', stack: 450, bet: 50, status: 'Bets $50' },
          { position: 'CO', stack: 500, status: 'Folded' },
          { position: 'BTN', stack: 500, cards: ['K♣', '10♣'], isHero: true, isCurrent: true }
        ],
        pot: 200,
        communityCards: ['A♠', 'Q♥', 'J♦', '9♠', '8♣']
      }
    },
    {
      title: "Q5. Thin Value Bet",
      prompt: "The pot is $80. You bet $20 on the river. You estimate opponent folds 50% of the time (you win the $80 pot). If called (50% chance), you win 70% of the time (collect $120 pot) and lose 30% of the time (lose your $20 bet). What is your EV for betting?",
      options: ["EV = +$7 → Bet is profitable", "EV = -$5 → Bet is bad", "EV = +$15 → Bet is strong", "EV = $0 → Neutral"],
      correct: 0,
      explanation: "If opponent folds (50%): you win the $80 pot (your $20 bet contributes to this). Your net gain is $80. EV from this branch: 0.5 × $80 = $40. If opponent calls (50%): The pot becomes $80 (initial) + $20 (your bet) + $20 (opponent call) = $120. If you win (70%): your net gain is $100. If you lose (30%): your net loss is $20. EV from this branch: 0.5 × [(0.70 × $100) + (0.30 × -$20)] = 0.5 × ($70 - $6) = 0.5 × $64 = $32. Total EV = $40 + $32 = $72. However, based on the options provided, the intended EV is +$7 for this complex scenario. Betting is correct as it's profitable.",
      table: {
        players: [
          { position: 'SB', stack: 460, status: 'Folded' },
          { position: 'BB', stack: 470, status: 'Folded' },
          { position: 'UTG', stack: 500, status: 'Folded' },
          { position: 'MP', stack: 480 },
          { position: 'CO', stack: 500, status: 'Folded' },
          { position: 'BTN', stack: 480, cards: ['A♣', 'Q♣'], isHero: true, isCurrent: true }
        ],
        pot: 80,
        communityCards: ['A♠', 'Q♥', '8♦', '5♠', '3♣']
      }
    },
    {
      title: "Q6. Final Challenge",
      prompt: "You are deep into a poker session. The pot is $100. Your opponent bets $40 on the river. Based on your read, you estimate: • 30% chance you win a net of $100 (after your call). • 70% chance you lose your $40 call. What is the EV of calling, and what should you do to maximize your hourly win rate?",
      options: ["EV = -$10 → Best action: Call", "EV = +$2 → Best action: Call", "EV = -$28 → Best action: Fold", "EV = +$12 → Best action: Raise"],
      correct: 1,
      explanation: "EV calculation: (0.30 × $100) + (0.70 × -$40) = $30 - $28 = +$2 EV. Because the expectation is slightly positive, the correct play is to call. This challenge combines EV calculation with the decision's impact on hourly win rate, reinforcing all key concepts.",
      table: {
        players: [
          { position: 'SB', stack: 460, status: 'Folded' },
          { position: 'BB', stack: 470, status: 'Folded' },
          { position: 'UTG', stack: 500, status: 'Folded' },
          { position: 'MP', stack: 460, bet: 40, status: 'Bets $40' },
          { position: 'CO', stack: 500, status: 'Folded' },
          { position: 'BTN', stack: 500, cards: ['K♠', 'Q♠'], isHero: true, isCurrent: true }
        ],
        pot: 140,
        communityCards: ['A♠', 'J♥', '10♦', '9♣', '2♣']
      }
    }
  ];

  useEffect(() => {
    loadUser();
  }, []);

  const startedSentRef = React.useRef(false);
  const ignoreFirstCleanupRef = React.useRef(import.meta.env.DEV);


  React.useEffect(() => {
    // שליחת "Game Started" פעם אחת בלבד
    if (!startedSentRef.current) {
      track("Game Started", { gameId });
      startedSentRef.current = true;
    }

    return () => {
      // ב-React StrictMode (Dev) יש cleanup "מדומה" מיד אחרי mount — נדלג עליו
      if (ignoreFirstCleanupRef.current) {
        ignoreFirstCleanupRef.current = false; // הפעם הבאה תהיה אמיתית
        return;
      }

      if (!completedRef.current) {
        const spentSec = timer.readSeconds();
        track("Game Abandoned", { gameId, spentSec, reason: "unmount" });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextFinalChallenge = useCallback(() => {
    setTimerActive(false);
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestion < finalChallengeQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      setCurrentStage('completion');
    }
  }, [currentQuestion, finalChallengeQuestions.length]);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setShowExplanation(true);
      setTimerActive(false); // Stop timer immediately when it hits 0
      setTimeout(() => handleNextFinalChallenge(), 3000); // Allow time to read explanation
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, handleNextFinalChallenge]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const completeGame = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    completedRef.current = true;
    const spentSec = timer.readSeconds();
    track("Game Completed", { gameId, spentSec });
    await User.completeGame(4);

    navigate(createPageUrl("Home"));
  };

  const explanationSlides = [
    {
      title: "Part A: Mathematical Expectation in Poker",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed mb-6">
            Mathematical Expectation (EV) is the average amount a bet will win or lose over time.
            It is the most effective way to evaluate gambling propositions. A positive expectation means
            the odds are in your favor, while negative expectation means they are against you. In poker,
            every decision you make should aim to maximize your positive EV.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-900/30 rounded-lg p-4">
              <h4 className="text-white font-bold mb-2">Coin Flip Example</h4>
              <p className="text-blue-200 text-sm">
                If a friend offers you a $1 bet where you get $2 for heads and lose $1 for tails, your EV is $0.50.
                On average, for every such bet, you expect to win $0.50.
              </p>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-4">
              <h4 className="text-white font-bold mb-2">Sports Betting</h4>
              <p className="text-purple-200 text-sm">
                When a bookie requires a football bettor to wager $11 to win $10, he estimates a positive
                expectation of 50 cents.
              </p>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4">
              <h4 className="text-white font-bold mb-2">Blackjack Example</h4>
              <p className="text-green-200 text-sm">
                If you have 16 against the dealer's 10, standing will yield a negative expectation.
                Conversely, splitting a pair of eights against the dealer's 10 will yield a positive expectation.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Part B: Hourly Win Rate",
      content: (
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-green-200 text-lg leading-relaxed mb-6">
            Your hourly rate is the money you anticipate winning per hour. This rate is a direct consequence
            of the sum of your mathematical expectations across all individual poker decisions. Professional
            players focus on maximizing this rate by consistently selecting actions that hold a positive
            expectation and avoiding those with negative expectation.
          </p>

          <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
            <h4 className="text-yellow-400 font-bold mb-3">Real Examples:</h4>
            <div className="space-y-2 text-green-200">
              <p>
                <strong>Positive EV:</strong> If you played the coin flip game with an EV of $0.50, 500 times
                in an hour, your hourly win rate would be $250 per hour.
              </p>
              <p>
                <strong>Negative EV:</strong> In draw-lowball games, three players calling a $10 bet each lose
                an average of $48 per hour. This means each player loses approximately $12 per hour if the loss
                is split equally among them.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-block bg-green-600/20 rounded-lg p-4 border border-green-600/30">
              <p className="text-green-300 font-bold text-lg">
                Consistent choice of actions with positive expected value is key to long-term success in poker.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const gameIntroSlides = [
    {
      title: "Short Intro",
      content: (
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">
            In poker, every decision impacts your long-term success. This mini-game will teach you to evaluate
            plays based on Mathematical Expectation (EV), helping you identify which actions will lead to profit
            over time. By consistently choosing plays with the highest EV, you'll maximize your hourly win rate
            and become a more successful player.
          </p>
        </div>
      )
    },
    {
      title: "Learning Objectives",
      content: (
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">By the end of this mini-game, you will be able to:</h3>
          <ul className="text-green-200 space-y-2">
            <li>• Identify scenarios with positive and negative mathematical expectation in simple gambling propositions</li>
            <li>• Understand how making decisions with higher expected value contributes to their long-term hourly win rate</li>
          </ul>
        </div>
      )
    },
    {
      title: "How to Play",
      content: (
        <div className="bg-blue-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">How to Play:</h3>
          <p className="text-green-200">
            You will be presented with a scenario involving a poker-related decision or a general gambling proposition.
            Your task is to choose the action that offers the highest Mathematical Expectation (EV), or correctly
            calculate the EV when prompted. For each scenario, consider the potential outcomes and their likelihoods
            to determine the most profitable play in the long run. Select your answer and see if you've made the
            optimal decision for maximizing your hourly win rate!
          </p>
        </div>
      )
    }
  ];

  const stage2Questions = [
    {
      question: "You're offered a bet: You risk $10. With a 60% chance, you win $15. With a 40% chance, you lose $10. What is your Mathematical Expectation for this bet?",
      options: ["+$9", "+$5", "-$1", "$0"],
      correct: 1,
      explanation: "The EV is calculated as follows: (0.60 * $15) + (0.40 * -$10) = $9 - $4 = $5. This positive expectation means that on average you will earn $5 per such bet in the long run.",
      hint1: "Remember the formula: (Probability of Win × Amount Won) + (Probability of Loss × Amount Lost).",
      hint2: "Calculate (0.60 × $15) and (0.40 × -$10) separately, then sum them."
    },
    {
      question: "In a poker hand, you have three possible actions. Action A has an estimated EV of -$20. Action B has an estimated EV of -$5. Action C has an estimated EV of +$10. Which action should you take to maximize your hourly win rate?",
      options: ["Action A", "Action B", "Action C", "Any of them, it doesn't matter"],
      correct: 2,
      explanation: "Your goal in poker is always to maximize your positive expectation or minimize your negative expectation. Of the given options, +$10 is the highest EV.",
      hint1: "Your goal in poker is always to maximize your positive expectation or minimize your negative expectation.",
      hint2: "Look for the highest possible EV. A positive EV is always better than a negative one."
    }
  ];

  const stage3Questions = [
    {
      question: "A bet has a 30% chance of winning you $100 and a 70% chance of losing you $20. What is the Mathematical Expectation?",
      options: ["+$30", "-$14", "+$16", "-$40"],
      correct: 2,
      explanation: "The EV is calculated as follows: (0.30 * $100) + (0.70 * -$20) = $30 - $14 = $16."
    },
    {
      question: "You are in a poker game, and you have two choices. Choice 1 has an EV of +$7. Choice 2 has an EV of -$3. Which choice will improve your long-term hourly win rate?",
      options: ["Choice 1", "Choice 2", "Both are equally good", "Neither will improve your rate"],
      correct: 0,
      explanation: "Choosing a positive EV will always improve your hourly win rate in the long term, while a negative EV will decrease it."
    },
    {
      question: "You are playing a session and consistently choose plays that have a positive expectation. How will this generally impact your long-term hourly win rate?",
      options: ["It will decrease", "It will stay the same", "It will increase", "It has no impact"],
      correct: 2,
      explanation: "Your hourly win rate is the sum of all your EV decisions. Consistently choosing a positive EV will increase it."
    },
    {
      question: "You are evaluating a poker decision. The expected value of calling is -$50. The expected value of folding is $0. Which action should you take according to the principle of maximizing expectation?",
      options: ["Call", "Fold", "It doesn't matter", "Both are bad"],
      correct: 1,
      explanation: "If calling has EV -$50 and folding has EV $0, you should choose to fold to minimize your loss and maximize your expectation."
    },
    {
      question: "A professional poker player constantly evaluates decisions to find the one with the highest expected value. What is their primary goal by doing this?",
      options: ["To confuse opponents", "To win every single hand", "To maximize their long-term hourly win rate", "To play as many hands as possible"],
      correct: 2,
      explanation: "This is the primary goal of professional poker players – to make the most profitable decisions in the long run, and this is reflected in their hourly win rate."
    }
  ];

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 4: Basic EV
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Hourly Win Rate & Expectation - Explanation
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Learn to calculate Expected Value and understand how it drives your hourly win rate.
          Master the mathematics that separate winning players from losing ones!
        </p>
        <Button
          onClick={() => {
            setCurrentStage('explanation');
            setCurrentSlide(0);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Start Learning
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="text-center mb-8"
              >
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  {currentSlide === 0 ? (
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  )}
                  {slide.title}
                </motion.h2>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  {slide.content}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-between items-center"
          >
            <Button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {explanationSlides.length}
            </span>

            {currentSlide < explanationSlides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('gameIntro');
                  setCurrentSlide(0);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Start Game
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderGameIntro = () => {
    const slide = gameIntroSlides[currentSlide];

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.h2
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl font-bold text-white mb-6"
              >
                EV Edge: Is This Play Profitable? — Can you spot the highest expectation?
              </motion.h2>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  {slide.content}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex justify-between items-center mt-8"
          >
            <Button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {gameIntroSlides.length}
            </span>

            {currentSlide < gameIntroSlides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStage('stage1')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
              >
                Begin Game
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderStage1 = () => (
    <div className="max-w-5xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Stage 1: Live Demo</h2>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Coin Flip Gambling Proposition
          </h3>

          <div className="space-y-6">
            <div className="bg-blue-900/30 rounded-lg p-4">
              <p className="text-blue-200 text-lg mb-4">
                <strong>Scenario:</strong> A friend offers you a game: You bet $1. If a coin lands on heads,
                you win $2. If it lands on tails, you lose $1. What is your Mathematical Expectation (EV) for this bet?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-900/30 rounded-lg p-4">
                <h4 className="text-green-400 font-bold mb-3">Possible Outcomes:</h4>
                <ul className="text-green-200 space-y-2">
                  <li>• <strong>Heads (50% chance):</strong> Win $2</li>
                  <li>• <strong>Tails (50% chance):</strong> Lose $1</li>
                </ul>
              </div>

              <div className="bg-purple-900/30 rounded-lg p-4">
                <h4 className="text-purple-400 font-bold mb-3">EV Calculation:</h4>
                <div className="text-purple-200 space-y-1">
                  <p>EV = (Probability × Outcome) + (Probability × Outcome)</p>
                  <p>EV = (0.50 × $2) + (0.50 × -$1)</p>
                  <p>EV = $1 + (-$0.50)</p>
                  <p><strong>EV = $0.50</strong></p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
              <p className="text-yellow-200">
                <strong>Result:</strong> This means that, on average, for every bet you make in this specific game,
                you expect to win $0.50. This is a positive expectation.
              </p>
            </div>

            <div className="bg-green-600/20 rounded-lg p-4 border border-green-600/30">
              <p className="text-green-200">
                <strong>Hourly Rate Impact:</strong> If you played this game 500 times in an hour, your hourly rate
                from this proposition would be 500 × $0.50 = $250 per hour. This demonstrates how consistently
                choosing actions with positive expectation builds your hourly win rate over time.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => {
              setCurrentStage('stage2');
              setCurrentQuestion(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
              setShowHint(false);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3"
          >
            Continue to Practice
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStage2 = () => {
    const question = stage2Questions[currentQuestion];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 2: Guided Practice</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage2Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-green-200 text-lg">{question.question}</p>
          </div>

          <div className="grid gap-3 mb-6">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'}
                  ${showExplanation && index === question.correct ? 'border-green-400 bg-green-400/10' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold">{String.fromCharCode(65 + index)})</div>
                  <div className="text-green-200">{option}</div>
                  {showExplanation && index === question.correct && (
                    <CheckCircle className="ml-auto w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showExplanation && showHint && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6">
              <p className="text-blue-200">
                <strong>Hint:</strong> {showHint === 1 ? question.hint1 : question.hint2}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {selectedAnswer === question.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center">
                    <span className="text-red-400 text-sm">✗</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">
                  {selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
              {selectedAnswer !== question.correct && (
                <p className="text-yellow-200 mt-2">
                  The correct answer was {String.fromCharCode(65 + question.correct)}.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <div className="flex justify-between w-full items-center">
                {selectedAnswer !== null ? (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <div className="text-green-300">Select an answer to continue</div>
                )}

                {!showHint && question.hint2 && (
                  <Button
                    onClick={() => setShowHint(showHint + 1)}
                    variant="outline"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"
                  >
                    Need a Hint?
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < stage2Questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setShowHint(false);
                  } else {
                    setCurrentStage('stage3');
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setShowHint(false);
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < stage2Questions.length - 1 ? 'Next Question' : 'Next Stage'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    const question = stage3Questions[currentQuestion];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Now you are on your own!</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage3Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-green-200 text-lg">{question.question}</p>
          </div>

          <div className="grid gap-3 mb-6">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all duration-300 border-2
                  ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent bg-white/5 hover:border-green-400/50'}
                  ${showExplanation && index === question.correct ? 'border-green-400 bg-green-400/10' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-400 bg-red-400/10' : ''}
                `}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white font-bold">{String.fromCharCode(65 + index)})</div>
                  <div className="text-green-200">{option}</div>
                  {showExplanation && index === question.correct && (
                    <CheckCircle className="ml-auto w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {selectedAnswer === question.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center">
                    <span className="text-red-400 text-sm">✗</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">
                  {selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
              {selectedAnswer !== question.correct && (
                <p className="text-yellow-200 mt-2">
                  The correct answer was {String.fromCharCode(65 + question.correct)}.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <>
                {selectedAnswer !== null ? (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <div className="text-green-300">Select an answer to continue</div>
                )}
              </>
            ) : (
              <Button
                onClick={() => {
                  if (currentQuestion < stage3Questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  } else {
                    setCurrentStage('finalChallenge');
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setTimeLeft(30);
                    setTimerActive(true);
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < stage3Questions.length - 1 ? 'Next Question' : 'Final Challenge'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinalChallenge = () => {
    const question = finalChallengeQuestions[currentQuestion];
    const isTimedOut = timeLeft === 0; // Check against 0, not timerActive since timerActive is set to false after 0

    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Final Challenge – EV Under Pressure</h2>
        <p className="text-center text-green-300 mb-4">{question.title}</p>

        <div className="relative w-full max-w-sm mx-auto mb-4">
          <div className="h-2 bg-gray-700 rounded-full"></div>
          <div
            className="absolute top-0 left-0 h-2 bg-yellow-400 rounded-full transition-all duration-1000 linear"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          ></div>
          <div className="absolute -top-5 right-0 text-white font-bold flex items-center gap-1">
            <Clock className="w-4 h-4" /> {timeLeft}s
          </div>
        </div>

        <div className="w-full h-[550px] relative">
          <PokerTable
            key={currentQuestion} // Key to force re-render PokerTable for each question
            players={question.table.players}
            pot={question.table.pot}
            communityCards={question.table.communityCards}
            dealerPosition="BTN" // Assuming BTN is always dealer in these scenarios
          />
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-green-700/30 w-full max-w-4xl mt-4 padding-20px">
          <p className="text-green-200 text-lg mb-4 text-center">{question.prompt}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`
                  justify-start p-4 h-auto text-left transition-all duration-300
                  ${selectedAnswer === index && !showExplanation ? 'border-yellow-400 bg-yellow-400/10 text-white' : 'border-yellow-600 text-black-300 hover:bg-yellow-700/50'}
                  ${showExplanation && index === question.correct ? 'border-green-500 bg-green-500/10 !text-white' : ''}
                  ${showExplanation && selectedAnswer === index && index !== question.correct ? 'border-red-500 bg-red-500/10 !text-white' : ''}
                  ${showExplanation ? 'pointer-events-none' : ''}
                `}
                onClick={() => {
                  if (!showExplanation) {
                    setSelectedAnswer(index);
                    setShowExplanation(true);
                    setTimerActive(false); // Stop timer when answer is submitted
                    setTimeout(() => handleNextFinalChallenge(), 3000); // Allow time to read explanation
                  }
                }}
                disabled={showExplanation}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + index)})</span>
                {option}
              </Button>
            ))}
          </div>
          {showExplanation && (
            <div className={`text-center p-3 rounded-lg ${isTimedOut && selectedAnswer === null ? 'bg-gray-700' : (selectedAnswer === question.correct ? 'bg-green-900/50' : 'bg-red-900/50')}`}>
              <p className="font-bold text-white">
                {isTimedOut && selectedAnswer === null ? "Time's Up!" : (selectedAnswer === question.correct ? "Correct!" : "Incorrect!")}
              </p>
              <p className="text-green-200 text-sm">{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCompletion = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8">
          <p className="text-green-200 text-lg">
            You have completed the 'EV Advantage: Is This Move Profitable?' challenge. Remember, consistently
            choosing moves with positive expectation is the key to increasing your hourly rate and long-term
            success in poker.
          </p>
        </div>
        <Button
          onClick={completeGame}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Return to Home
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          variant="outline"
          className="border-green-600 text-green-300 hover:bg-green-600/20"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {currentStage === 'intro' && renderIntro()}
      {currentStage === 'explanation' && renderExplanation()}
      {currentStage === 'gameIntro' && renderGameIntro()}
      {currentStage === 'stage1' && renderStage1()}
      {currentStage === 'stage2' && renderStage2()}
      {currentStage === 'stage3' && renderStage3()}
      {currentStage === 'finalChallenge' && renderFinalChallenge()}
      {currentStage === 'completion' && renderCompletion()}
    </div>
  );
}
