import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
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

const StageDivider = ({ title, onContinue }) => (
  <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl"
    >
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
      <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
        Continue <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  </div>
);

export default function Game7() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // 0: no movement, 1: next, -1: prev
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [user, setUser] = useState(null);
  const gameId = 7;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

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
    await User.completeGame(7);

    navigate(createPageUrl("Home"));
  };

  const handleNextSlide = () => {
    setDirection(1);
    setCurrentSlide(prev => prev + 1);
  };

  const handlePrevSlide = () => {
    setDirection(-1);
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const explanationSlides = [
    {
      title: "Part A: Common Draws and Outs",
      content: "In poker, a drawing hand is one that is not yet complete but holds the potential to improve, typically into a flush or a straight. Your outs are the specific cards remaining in the deck that will complete your drawing hand. For instance, a flush draw has 9 outs, and an open-ended straight draw (OESD) has 8 outs.",
      example: {
        hand: ["K♦", "Q♦"],
        flop: ["A♦", "7♦", "2♠"],
        description: "With K♦ Q♦ on an A♦ 7♦ 2♠ flop, you have a flush draw with 9 outs (remaining diamonds)"
      }
    },
    {
      title: "Part A2: Dirty Outs",
      content: "It's vital to quickly identify and count your outs, but also to recognize \"dirty outs\" – cards that improve your hand but simultaneously complete an even stronger hand for your opponent. These particular outs should always be discounted from your count to avoid overestimating your chances.",
      example: {
        hand: ["9♣", "8♣"],
        flop: ["J♣", "T♣", "2♥"],
        description: "You have both an open-ended straight draw and a flush draw, but some outs like 7♣ or Q♣ might give your opponent a better hand"
      }
    },
    {
      title: "Part B: Rule of 2 and 4 (Quick Equity)",
      content: "The Rule of 2 and 4 offers a straightforward method to estimate your equity – your approximate percentage chance of winning the hand – without complex calculations.",
      rules: [
        "On the FLOP (seeing turn AND river): Multiply outs × 4",
        "On the TURN (seeing only river): Multiply outs × 2"
      ],
      example: {
        scenario: "9 outs on the flop",
        calculation: "9 × 4 = 36% equity to hit by river"
      }
    },
    {
      title: "Important Note",
      content: "It is important to note that although the 2 and 4 rule is an excellent approximation tool, it may be less accurate with a larger number of outs (over 10), with a deviation of 1-3%. Nevertheless, it is accurate enough for the purposes of making quick decisions in real time.",
      conclusion: "This rapid estimation helps you make fast judgments during play. In conclusion, an accurate understanding of your outs, including identifying and deducting 'dirty' outs, along with the ability to quickly assess your value using Rules 2 and 4, are essential for making informed and profitable decisions at the poker table."
    }
  ];

  const gameIntroSlides = [
    {
      title: "Short Intro",
      content: (
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">
            Knowing your "outs" and quickly estimating your winning chances (equity) are vital skills in poker.
            This mini-game will teach you to spot the cards that complete your hand and use a simple rule to calculate
            your equity on the fly. Master these concepts to make sharper, more profitable decisions at the table!
          </p>
        </div>
      )
    },
    {
      title: "Learning Objectives",
      content: (
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Learning Objective: By the end of this mini-game, learners will be able to:</h3>
          <ul className="text-green-200 space-y-2">
            <li>1. Accurately count the outs for common drawing hands (e.g., flush draws, open-ended straight draws) and identify "dirty outs" that should be discounted</li>
            <li>2. Routinely apply the Rule of 2 and 4 to estimate poker equity (percentage chance of winning) on the flop and turn within a reasonable timeframe</li>
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
            You'll be presented with various poker hand scenarios. Your task is to identify your "outs" (the specific cards
            remaining in the deck that will complete your drawing hand) and then use the "Rule of 2 & 4" to quickly estimate
            your winning probability, also known as your equity. Pay close attention to the board and your hand to ensure
            accurate calculations, especially for "dirty outs." Correct answers will lead you to victory!
          </p>
        </div>
      )
    }
  ];

  const stage2Questions = [
    {
      question: "You have 7♠ 6♠ on a board of A♠ Q♠ 2♥. How many outs do you have for a flush draw?",
      playerHand: ["7♠", "6♠"],
      board: ["A♠", "Q♠", "2♥"],
      options: ["7", "8", "9", "10"],
      correct: 2,
      explanation: "There are 13 cards of each suit in the deck. You have seen 2 cards (7♠ 6♠) in your hand and 2 cards (A♠ Q♠) on the board. Therefore, 13 - 2 - 2 = 9 spades remain to complete your flush.",
      hint: "There are 13 cards of each suit. How many spades have you seen in total (your hand + board)? Subtract that from 13 to find your outs."
    },
    {
      question: "You have 8♦ 7♦ on a board of 6♠ 5♣ 2♥. How many outs do you have for an open-ended straight draw?",
      playerHand: ["8♦", "7♦"],
      board: ["6♠", "5♣", "2♥"],
      options: ["4", "6", "8", "10"],
      correct: 2,
      explanation: "A straight draw (8♦ 7♦ on 6♠ 5♣ 2♥) requires a 4 or 9 to complete the straight. There are 4 4s and 4 9s in the deck, for a total of 8 outs.",
      hint: "An open-ended straight draw needs two specific ranks to complete on either end. Think about how many cards of each rank are left."
    },
    {
      question: "You hold K♠ Q♠ on a flop of T♠ J♥ 7♣. You have a straight draw, but what kind of card could be a 'dirty out'?",
      playerHand: ["K♠", "Q♠"],
      board: ["T♠", "J♥", "7♣"],
      options: [
        "A blank card that doesn't help you",
        "A card that completes your straight but also completes a flush for an opponent",
        "A card that gives you a higher pair",
        "Any card that improves your hand"
      ],
      correct: 1,
      explanation: "A 'dirty' out is a card that appears to help you but simultaneously gives your opponent a stronger hand, making it a less desirable outcome.",
      hint: "Dirty outs are cards that seem to help you but could lead to a loss if an opponent gets an even better hand. Consider situations where your 'out' is also part of a stronger draw for them."
    },
    {
      question: "You are on the flop with 8 outs. Using the Rule of 2 and 4, what is your approximate equity (percentage chance) to hit your hand by the river?",
      playerHand: null,
      board: null,
      options: ["8%", "16%", "32%", "40%"],
      correct: 2,
      explanation: "On the flop, to estimate your value up to the river, you multiply your outs by 4. Therefore, 8 outs * 4 = 32%.",
      hint: "When on the flop and needing to see both turn and river cards, what number do you multiply your outs by?"
    },
    {
      question: "You are on the turn with 9 outs for a nut flush draw. What is your approximate equity to hit your hand on the river?",
      playerHand: null,
      board: null,
      options: ["9%", "18%", "27%", "36%"],
      correct: 1,
      explanation: "Bettor, to estimate your value up to the river, you multiply your outs by 2. Therefore, 9 outs * 2 = 18%.",
      hint: "When on the turn, with only one card remaining, what number do you multiply your outs by?"
    }
  ];

  const stage3Questions = [
    {
      question: "You have Q♣ 9♣ on a board of K♠ J♥ 7♦. How many outs do you have for a gutshot straight draw?",
      playerHand: ["Q♣", "9♣"],
      board: ["K♠", "J♥", "7♦"],
      options: ["2", "4", "6", "8"],
      correct: 1,
      explanation: "A straight draw (Q♣ 9♣ over K♠ J♥ 7♦) requires a 10 to complete the straight. There are 4 10s in the deck."
    },
    {
      question: "You have a flush draw (9 outs) on the flop. What is your estimated equity to hit your flush by the river?",
      playerHand: null,
      board: null,
      options: ["18%", "27%", "36%", "45%"],
      correct: 2,
      explanation: "A straight flush has 9 outs. On the flop, 9 outs * 4 = 36% value."
    },
    {
      question: "You have an open-ended straight draw (8 outs) on the turn. What is your estimated equity to hit your straight on the river?",
      playerHand: null,
      board: null,
      options: ["8%", "16%", "24%", "32%"],
      correct: 1,
      explanation: "An open straight has 8 outs. On the turn, 8 outs * 2 = 16% value."
    },
    {
      question: "It is always beneficial to count all cards that improve your hand as outs, regardless of whether they help an opponent.",
      playerHand: null,
      board: null,
      options: ["True", "False"],
      correct: 1,
      explanation: "'Dirty outs' that might give your opponent a stronger hand should be deducted, to prevent overestimating your chances of winning."
    },
    {
      question: "In poker, what does 'equity' primarily refer to?",
      playerHand: null,
      board: null,
      options: [
        "The amount of money you have in your stack",
        "The size of the pot you are trying to win",
        "Your approximate percentage chance of winning the hand",
        "How many chips your opponent has"
      ],
      correct: 2,
      explanation: "Equity refers to your expected share of the pot, which represents your long-term expectations of winning based on probabilities and odds."
    },
    {
      question: "The primary purpose of the Rule of 2 and 4 is to:",
      playerHand: null,
      board: null,
      options: [
        "Calculate exact pot odds",
        "Determine opponent's hand ranges",
        "Quickly estimate your equity in a hand",
        "Decide on optimal bet sizing"
      ],
      correct: 2,
      explanation: "The main purpose of rules 2 and 4 is to simplify estimating your value without complex calculations."
    },
    {
      question: "You have A♥ K♥ on a board of J♥ T♥ 2♠. It's the flop. How many outs do you have for a flush, and what is your approximate equity to hit it by the river?",
      playerHand: ["A♥", "K♥"],
      board: ["J♥", "T♥", "2♠"],
      options: [
        "7 outs, 28% equity",
        "8 outs, 32% equity",
        "9 outs, 36% equity",
        "10 outs, 40% equity"
      ],
      correct: 2,
      explanation: "With A♥ K♥ on a J♥ T♥ 2♠ board, you have 2 hearts in your hand and 2 hearts on the board. A total of 4 hearts are seen. Out of 13 hearts in the deck, 9 outs remain. On the flop, 9 outs * 4 = 36% value."
    },
    {
      question: "You have 8♠ 9♠ on a board of J♠ T♠ 2♥ 5♦. It's the turn. How many outs do you have for a flush, and what is your approximate equity to hit it on the river?",
      playerHand: ["8♠", "9♠"],
      board: ["J♠", "T♠", "2♥", "5♦"],
      options: [
        "7 outs, 14% equity",
        "9 outs, 18% equity",
        "8 outs, 16% equity",
        "10 outs, 20% equity"
      ],
      correct: 1,
      explanation: "With a hand of 8♠ 9♠ on a board of J♠ T♠ 2♥ 5♦, you have 2 spades in your hand and 2 spades on the board. A total of 4 spades are seen. Out of 13 spades in the deck, 9 outs remain. On the turn, 9 outs * 2 = 18% value."
    }
  ];

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 7: Outs + Rule of 2&4
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Quick Equity - Explanation
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Learn to count your outs and quickly calculate winning chances with the Rule of 2&4.
          Master the rapid equity estimation that pros use at the table!
        </p>
        <Button
          onClick={() => setCurrentStage('explanation')}
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
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              custom={direction}
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
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">{slide.title}</motion.h2>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white/10 rounded-xl p-6 mb-6 min-h-[350px] flex flex-col justify-center"
              >
                <motion.p variants={itemVariants} className="text-green-200 text-lg leading-relaxed mb-6">{slide.content}</motion.p>

                {slide.example && slide.example.hand && (
                  <motion.div variants={itemVariants} className="bg-blue-900/20 rounded-xl p-4 mb-4">
                    <h4 className="text-blue-300 font-bold mb-3">Example:</h4>
                    <div className="flex justify-center gap-2 mb-3">
                      <div className="text-white text-sm font-medium">Your hand:</div>
                      {slide.example.hand.map((card, index) => (
                        <PlayingCard key={index} card={card} className="w-12 h-16" />
                      ))}
                      <div className="text-white text-sm font-medium mx-4">Flop:</div>
                      {slide.example.flop.map((card, index) => (
                        <PlayingCard key={index} card={card} className="w-12 h-16" />
                      ))}
                    </div>
                    <p className="text-blue-200">{slide.example.description}</p>
                  </motion.div>
                )}

                {slide.rules && (
                  <motion.div variants={itemVariants} className="bg-green-900/20 rounded-xl p-4 mb-4">
                    <h4 className="text-green-300 font-bold mb-3">Rule of 2 & 4:</h4>
                    <ul className="text-green-200 space-y-2">
                      {slide.rules.map((rule, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                    {slide.example?.scenario && (
                      <div className="mt-4 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                        <p className="text-yellow-200">
                          <strong>Example:</strong> {slide.example.scenario} → {slide.example.calculation}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {slide.conclusion && (
                  <motion.div variants={itemVariants} className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
                    <p className="text-yellow-200 font-medium">{slide.conclusion}</p>
                  </motion.div>
                )}
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
              onClick={handlePrevSlide}
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
                onClick={handleNextSlide}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                    setCurrentStage('gameIntro');
                    setCurrentSlide(0); // Reset currentSlide for gameIntro
                    setDirection(0); // Reset direction
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              custom={direction}
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
                Outs & Odds: Can You Quickly Calculate Your Winning Chance?
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
            className="flex justify-between items-center"
          >
            <Button
              onClick={handlePrevSlide}
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
                onClick={handleNextSlide}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                    setCurrentStage('stage1');
                    setCurrentSlide(0);
                    setDirection(0); // Reset direction
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Begin Game
                <ArrowRight className="ml-2 w-4 h-4" />
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

        <div className="space-y-8">
          {/* Demo 1: Identifying Common Outs */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Demo 1: Identifying Common Outs
            </h3>

            <div className="bg-blue-900/30 rounded-lg p-4 mb-4">
              <div className="flex justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Your hand:</p>
                  <div className="flex gap-2">
                    <PlayingCard card="K♦" />
                    <PlayingCard card="Q♦" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Flop:</p>
                  <div className="flex gap-2">
                    <PlayingCard card="A♦" />
                    <PlayingCard card="7♦" />
                    <PlayingCard card="2♠" />
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 rounded-lg p-4">
                <p className="text-green-200 mb-3">
                  <strong>Explanation:</strong> You have King and Queen of Diamonds and the flop shows Ace, Seven of Diamonds,
                  and a Two of Spades. You have a flush draw.
                </p>
                <p className="text-yellow-200">
                  <strong>Calculation:</strong> There are 13 diamonds in a standard deck. You've seen 2 in your hand and 2 on the board.
                  So, there are 13 - 2 - 2 = 9 diamonds left in the deck that can complete your flush. These 9 cards are your outs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => {
              setCurrentQuestion(0); // Reset for next stage
              setSelectedAnswer(null); // Reset for next stage
              setShowExplanation(false); // Reset for next stage
              setShowHint(false); // Reset for next stage
              setCurrentStage('stage2-intro');
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

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                {(question.playerHand || question.board) && (
                  <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
                    {question.playerHand && (
                      <div className="text-center">
                        <h4 className="text-white font-bold mb-3">Your Hand</h4>
                        <div className="flex justify-center gap-2">
                          {question.playerHand.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                        </div>
                      </div>
                    )}
                    {question.board && (
                      <div className="text-center">
                        <h4 className="text-white font-bold mb-3">Board</h4>
                        <div className="flex justify-center gap-2">
                          {question.board.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                    <strong>Hint:</strong> {question.hint}
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
            </motion.div>
          </AnimatePresence>

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

                {!showHint && question.hint && (
                  <Button
                    onClick={() => setShowHint(true)}
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
                    setDirection(1);
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setShowHint(false);
                  } else {
                    setCurrentStage('stage3-intro');
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setShowHint(false);
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < stage2Questions.length - 1 ? 'Next Question' : 'Final Stage'}
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

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                {(question.playerHand || question.board) && (
                  <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
                    {question.playerHand && (
                      <div className="text-center">
                        <h4 className="text-white font-bold mb-3">Your Hand</h4>
                        <div className="flex justify-center gap-2">
                          {question.playerHand.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                        </div>
                      </div>
                    )}
                    {question.board && (
                      <div className="text-center">
                        <h4 className="text-white font-bold mb-3">Board</h4>
                        <div className="flex justify-center gap-2">
                          {question.board.map((card, i) => <PlayingCard key={i} card={card} className="w-16 h-24" />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
            </motion.div>
          </AnimatePresence>

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
                    setDirection(1);
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  } else {
                    setCurrentStage('completion');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {currentQuestion < stage3Questions.length - 1 ? 'Next Question' : 'Complete Game'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
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
            You have successfully completed the 'Outs & Odds: Can You Quickly Calculate Your Winning Chance?' mini-game.
            You now master the fundamentals of calculating outs, recognizing dirty outs, and applying the Rule of 2 and 4
            to quickly estimate your equity on the flop and turn. This knowledge will greatly improve your decision-making
            at the table and provide a strong foundation for advanced probability and strategy in poker. Keep practicing
            these calculations until they become second nature, and you'll gain a real edge over your opponents!
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
      {currentStage === 'stage2-intro' && <StageDivider title="Stage 2: Guided Practice" onContinue={() => setCurrentStage('stage2')} />}
      {currentStage === 'stage2' && renderStage2()}
      {currentStage === 'stage3-intro' && <StageDivider title="Stage 3: Now you are on your own, No Hints" onContinue={() => setCurrentStage('stage3')} />}
      {currentStage === 'stage3' && renderStage3()}
      {currentStage === 'completion' && renderCompletion()}
    </div>
  );
}
