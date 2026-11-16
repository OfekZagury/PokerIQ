
import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PlayingCard from "../components/shared/PlayingCard";
import AnimatedSlide from "../components/shared/AnimatedSlide";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const handRankings = [
  {
    name: "Royal Flush",
    description: "A sequence of Ace-King-Queen-Jack-10 of the same suit",
    example: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
    rank: 1
  },
  {
    name: "Straight Flush",
    description: "Five consecutive cards of the same suit",
    example: ["9♥", "8♥", "7♥", "6♥", "5♥"],
    rank: 2
  },
  {
    name: "Four of a Kind",
    description: "Four cards of the same rank",
    example: ["8♠", "8♣", "8♦", "8♥", "Q♣"],
    rank: 3
  },
  {
    name: "Full House",
    description: "Three cards of one rank and two cards of another rank",
    example: ["3♠", "3♣", "3♦", "5♥", "5♠"],
    rank: 4
  },
  {
    name: "Flush",
    description: "Five cards of the same suit, not in sequence",
    example: ["A♥", "Q♥", "J♥", "6♥", "5♥"],
    rank: 5
  },
  {
    name: "Straight",
    description: "Five cards in sequence, from different suits",
    example: ["7♦", "6♣", "5♥", "4♠", "3♦"],
    rank: 6
  },
  {
    name: "Three of a Kind",
    description: "Three cards of the same rank and two unrelated cards",
    example: ["10♠", "10♣", "10♦", "K♥", "5♠"],
    rank: 7
  },
  {
    name: "Two Pair",
    description: "Two cards of one rank and two cards of another rank, plus one unrelated card",
    example: ["J♠", "J♣", "7♦", "7♠", "3♥"],
    rank: 8
  },
  {
    name: "One Pair",
    description: "Two cards of one rank, plus three unrelated cards",
    example: ["K♠", "K♣", "9♥", "4♦", "2♠"],
    rank: 9
  },
  {
    name: "High Card",
    description: "Five unrelated cards, with no pairs, straights, or flushes",
    example: ["A♦", "9♠", "7♥", "5♣", "3♠"],
    rank: 10
  }
];

// Game questions from the PDF
const gameQuestions = {
  stage1: {
    demo: [
      {
        handA: { name: "Straight Flush", cards: ["9♥", "8♥", "7♥", "6♥", "5♥"] },
        handB: { name: "Four of a Kind", cards: ["8♠", "8♣", "8♦", "8♥", "Q♣"] },
        explanation: "A Straight Flush beats Four of a Kind because it's a rarer, stronger hand. In a Straight Flush, all five cards are in sequence and of the same suit — making it very hard to achieve. Four of a Kind is powerful, but more common, since it only requires four matching ranks. That's why the Straight Flush ranks higher."
      },
      {
        handA: { name: "Four of a Kind", cards: ["K♣", "K♥", "K♠", "K♦", "7♦"] },
        handB: { name: "Full House", cards: ["9♣", "9♠", "9♦", "5♠", "5♦"] },
        explanation: "Four of a Kind beats Full House because it is a rarer and stronger hand. A four of a kind consists of all four cards of the same rank, plus one unpaired card. A full house, on the other hand, consists of three cards of one rank and a pair of cards of another rank. The statistical rarity of a four of a kind makes it a higher-value hand than a full house, which is more common."
      },
      {
        handA: { name: "Full House", cards: ["K♠", "K♥", "K♦", "A♠", "A♣"] },
        handB: { name: "Flush", cards: ["A♥", "Q♥", "J♥", "6♥", "5♥"] },
        explanation: "Full House beats Flush because it is a rarer hand. A full house consists of three cards of one rank and a pair of cards of another rank, meaning it requires specific combinations of ranks. A flush is five cards of the same suit, but not in consecutive order. The more specific requirement for the card ranks in a full house makes it statistically less common, and therefore a stronger hand than a flush."
      },
      {
        handA: { name: "Flush", cards: ["K♦", "J♦", "9♦", "7♦", "2♦"] },
        handB: { name: "Straight", cards: ["10♣", "9♥", "8♠", "7♦", "6♣"] },
        explanation: "Flush is ranked higher than Straight because it is a rarer hand. A flush consists of five cards of the same suit, while a straight consists of five consecutive cards, but not all of them of the same suit. The specific requirement that all cards in a flush be of the same suit makes it a less likely and therefore more valuable hand than a straight."
      }
    ]
  },
  stage2: [
    {
      hands: [
        { name: "Flush", cards: ["A♥", "Q♥", "10♥", "7♥", "2♥"] },
        { name: "Straight", cards: ["K♣", "Q♦", "J♥", "10♠", "9♣"] },
        { name: "Three of a Kind", cards: ["8♠", "8♣", "8♦", "K♥", "5♠"] }
      ],
      correct: 0,
      explanation: "Remember, Flush is more rare than straight and Three-of-a-kind, and so is ranked higher",
      clue1: "Remember the ranking order. Which hand is rarer: a flush, a straight, or a three of a kind?",
      clue2: "A flush is made up of five cards of the same suit. A straight is made up of five consecutive cards of different suits. Who wins?"
    },
    {
      hands: [
        { name: "Two Pair", cards: ["J♠", "J♣", "7♦", "7♠", "3♥"] },
        { name: "One Pair", cards: ["A♦", "A♣", "K♥", "5♠", "2♣"] },
        { name: "High Card", cards: ["Q♠", "10♦", "8♥", "6♣", "4♠"] }
      ],
      correct: 0,
      explanation: "Two pair beats one pair, and one pair beats a hand without a pair.",
      clue1: "What is the difference between a pair, two pair, and no pair in terms of their rarity and ranking rules?"
    },
    {
      hands: [
        { name: "Ace Pair with King Kicker", cards: ["A♣", "A♦", "K♥", "7♠", "3♣"] },
        { name: "Ace Pair with Queen Kicker", cards: ["A♠", "A♥", "Q♦", "8♣", "4♠"] },
        { name: "King Pair with Ace Kicker", cards: ["K♣", "K♦", "A♥", "9♠", "5♣"] }
      ],
      correct: 0,
      explanation: "A pair of aces will always beat a pair of kings, regardless of the kicker. When two players have a pair of aces, the kicker (the highest card not part of the pair) is the winner. In this case, the King (K) is higher than the Queen (Q).",
      clue1: "If two players have the same pair, the next highest card (the kicker) determines the winner",
      clue2: "Compare the kickers of the Ace hands. Which King is higher than a Queen?"
    }
  ],
  stage3: [
    {
      hands: [
        { name: "Full House", cards: ["7♠", "7♣", "7♦", "4♥", "4♠"] },
        { name: "Flush", cards: ["K♦", "Q♦", "9♦", "6♦", "3♦"] },
        { name: "Straight", cards: ["9♠", "8♣", "7♥", "6♦", "5♠"] }
      ],
      correct: 0,
      explanation: "Full house is the rarest hand so it wins"
    },
    {
      hands: [
        { name: "Straight Flush", cards: ["J♠", "10♠", "9♠", "8♠", "7♠"] },
        { name: "Royal Flush", cards: ["A♣", "K♣", "Q♣", "J♣", "10♣"] },
        { name: "Four of a Kind", cards: ["Q♥", "Q♦", "Q♣", "Q♠", "2♥"] }
      ],
      correct: 1,
      explanation: "The strongest hand in poker – Royal Flush! Always wins"
    },
    {
      hands: [
        { name: "Three of a Kind", cards: ["5♠", "5♣", "5♦", "K♥", "9♠"] },
        { name: "Two Pair", cards: ["J♦", "J♥", "9♣", "9♠", "3♥"] },
        { name: "Two Pair", cards: ["10♠", "10♣", "8♥", "8♦", "2♠"] }
      ],
      correct: 0,
      explanation: "A three of a kind always beats two pair. If there were two hands of two pair, the highest pair would decide."
    },
    {
      hands: [
        { name: "One Pair", cards: ["K♠", "K♣", "9♥", "4♦", "2♠"] },
        { name: "High Card", cards: ["A♣", "J♦", "8♥", "6♠", "3♣"] },
        { name: "High Card", cards: ["A♥", "10♦", "7♠", "5♣", "2♦"] }
      ],
      correct: 0,
      explanation: "A pair always beats a hand without a pair. Among hands without a pair, the hand with the highest card (the High Card) determines the winner."
    },
    {
      hands: [
        { name: "Full House", cards: ["A♠", "A♣", "A♦", "2♥", "2♠"] },
        { name: "Four of a Kind", cards: ["7♥", "7♠", "7♦", "7♣", "9♦"] },
        { name: "Straight Flush", cards: ["6♥", "5♥", "4♥", "3♥", "2♥"] }
      ],
      correct: 2,
      explanation: "A Straight Flush is stronger than a Full House and a Four of a Kind. A Straight Flush is a very rare hand."
    }
  ]
};

const finalChallengeHands = [
    { id: 'hand-1', name: "Royal Flush", cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"], correctRank: 1 },
    { id: 'hand-2', name: "Straight Flush", cards: ["9♥", "8♥", "7♥", "6♥", "5♥"], correctRank: 2 },
    { id: 'hand-3', name: "Four of a Kind", cards: ["Q♦", "Q♠", "Q♥", "Q♣", "7♠"], correctRank: 3 },
    { id: 'hand-4', name: "Full House", cards: ["A♠", "A♣", "A♦", "2♥", "2♠"], correctRank: 4 },
    { id: 'hand-5', name: "Flush", cards: ["K♥", "J♥", "9♥", "5♥", "3♥"], correctRank: 5 },
    { id: 'hand-6', name: "Straight", cards: ["10♦", "9♣", "8♠", "7♥", "6♦"], correctRank: 6 },
    { id: 'hand-7', name: "Three of a Kind", cards: ["8♠", "8♦", "8♥", "Q♣", "4♠"], correctRank: 7 },
    { id: 'hand-8', name: "Two Pair", cards: ["J♦", "J♠", "4♣", "4♥", "9♥"], correctRank: 8 },
    { id: 'hand-9', name: "One Pair", cards: ["5♠", "5♦", "K♣", "9♠", "2♥"], correctRank: 9 },
    { id: 'hand-10', name: "High Card", cards: ["A♣", "10♦", "7♠", "6♥", "3♣"], correctRank: 10 },
];

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
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

export default function Game1() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showClue, setShowClue] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);
  const gameId = 1;

  // State for Stage 4 Drag & Drop
  const [dndHands, setDndHands] = useState([]);
  const [dndSubmitted, setDndSubmitted] = useState(false);
  const [dndResults, setDndResults] = useState({ correctCount: 0, passed: false, checks: [] });

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
    await User.completeGame(1);

    navigate(createPageUrl("Home"));
  };

  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const handleStageChange = (newStage) => {
    const stageOrder = ['intro', 'explanation', 'gameIntro', 'stage1', 'stage2-intro', 'stage2', 'stage3-intro', 'stage3', 'stage4-intro', 'stage4', 'completion'];
    const currentStageIndex = stageOrder.indexOf(currentStage);
    const newStageIndex = stageOrder.indexOf(newStage);
    setSlideDirection(newStageIndex > currentStageIndex ? 1 : -1);

    setCurrentStage(newStage);
    setCurrentSlide(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowClue(0);

    if (newStage === 'stage4') {
        setDndHands(shuffleArray([...finalChallengeHands]));
        setDndSubmitted(false);
        setDndResults({ correctCount: 0, passed: false, checks: [] });
    }
  };

  const renderIntro = () => (
    <div className="max-w-5xl mx-auto text-center">
      <AnimatedSlide direction={slideDirection} key="intro">
        <motion.div
          className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
          >
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-4 font-heading">
            Game 1: Hand Rankings
          </h1>
          <p className="text-green-200 text-lg mb-8">
            Learn to identify and rank poker hands from high card to royal flush.
            Master the foundation of all poker strategy!
          </p>

          {/* New Enhanced Content */}
          <motion.div
            className="space-y-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 font-heading">Principles</h3>
              <p className="text-green-200 leading-relaxed max-w-3xl mx-auto">
                In most poker games, such as Seven Card Stud and Texas Hold'em, the goal is to make the best possible five-card poker hand.
                The value of a hand is determined by its rarity; the rarer the hand, the more valuable it is.
              </p>
            </div>

            <motion.div
              className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Card className="p-6 bg-gradient-to-br from-green-350/30 to-green-100/20 border-yellow-400/20 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3 font-heading">Key Points</h4>
                <ul className="space-y-2 text-green-200 text-left">
                  <li>• Standard 52-card deck (no jokers)</li>
                  <li>• Ace is highest-ranking card</li>
                  <li>• Ace can be low in A-2-3-4-5 (wheel)</li>
                  <li>• Rarity determines hand strength</li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-350/30 to-green-100/20 border-yellow-400/20 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3 font-heading">Remember</h4>
                <p className="text-green-200 text-left">
                  The rarer the hand, the more valuable it is. This probabilistic ranking is what makes poker exciting and strategic.
                </p>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => handleStageChange('explanation')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
            >
              Start Learning
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatedSlide>
    </div>
  );

  const renderExplanation = () => {
    const ranking = handRankings[currentSlide];

    return (
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <AnimatedSlide key={currentSlide} direction={slideDirection}>
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Hand Rankings</h2>
                <p className="text-green-400">
                  The value of a hand is determined by its rarity
                </p>
                <p className="text-green-400">
                  The rarer the hand, the more valuable it is.
                </p>
              </div>

              <motion.div
                className="bg-white/10 rounded-xl p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{ranking.name}</h3>
                    <p className="text-green-200">{ranking.description}</p>
                  </div>
                  <motion.div
                    className="text-right"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <div className="text-yellow-400 font-bold text-sm mb-1">RANK</div>
                    <div className="text-3xl font-bold text-white">#{ranking.rank}</div>
                  </motion.div>
                </div>

                <motion.div
                  className="flex justify-center gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  {ranking.example.map((card, cardIndex) => (
                    <motion.div
                      key={cardIndex}
                      initial={{ opacity: 0, y: 50, rotateY: -90 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{
                        delay: 0.8 + (cardIndex * 0.1),
                        duration: 0.5,
                        type: "spring",
                        stiffness: 150
                      }}
                    >
                      <PlayingCard card={card} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <div className="flex justify-between items-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    variant="outline"
                    className="border-green-700 text-green-300 hover:bg-green-700/20"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Previous
                  </Button>
                </motion.div>

                <motion.span
                  className="text-green-300"
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentSlide + 1} of {handRankings.length}
                </motion.span>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {currentSlide < handRankings.length - 1 ? (
                    <Button
                      onClick={() => handleSlideChange(currentSlide + 1)}
                      className="bg-green-700 hover:bg-green-800 text-white"
                    >
                      Next
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStageChange('gameIntro')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Start Game
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </AnimatedSlide>
        </AnimatePresence>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <AnimatedSlide direction={slideDirection} key="gameIntro">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white mb-6">
            Poker Hand Rankings — Can You Identify the Winning Hand?
          </h2>

          <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-xl font-bold text-white mb-4">By the end of this mini-game, you will be able to:</h3>
            <ul className="text-green-200 space-y-2">
              <li>• Identify and correctly rank the 10 major poker hands from royal flush to high card</li>
              <li>• Distinguish between closely ranked poker hands and indicate the stronger hand, including the use of kickers</li>
            </ul>
          </div>

          <div className="bg-green-950/30 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-white mb-4">How to Play:</h3>
            <p className="text-green-200">
              In each question, you will be presented with three different poker hands. You must identify the hand with the highest ranking and choose it. Remember the principle of rarity: the rarer the hand, the stronger it is.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleStageChange('stage2-intro')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
            >
              Begin Game
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSlide>
    </div>
  );

  const renderStage1 = () => {
    const demo = gameQuestions.stage1.demo[currentSlide];

    return (
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <AnimatedSlide key={currentSlide} direction={slideDirection}>
            <motion.div
              className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-8">Stage 1: Live Demo</h2>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <motion.div
                  className="bg-white/5 rounded-xl p-6"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Hand A: {demo.handA.name}</h3>
                  <div className="flex justify-center gap-2 mb-4">
                    {demo.handA.cards.map((card, index) => (
                      <PlayingCard key={index} card={card} />
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white/5 rounded-xl p-6"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Hand B: {demo.handB.name}</h3>
                  <div className="flex justify-center gap-2 mb-4">
                    {demo.handB.cards.map((card, index) => (
                      <PlayingCard key={index} card={card} />
                    ))}
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="bg-green-950/30 rounded-xl p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <p className="text-green-200 text-lg">{demo.explanation}</p>
              </motion.div>

              <div className="flex justify-between items-center mt-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    variant="outline"
                    className="border-green-700 text-green-300 hover:bg-green-700/20"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Previous
                  </Button>
                </motion.div>

                <span className="text-green-300">{currentSlide + 1} of {gameQuestions.stage1.demo.length}</span>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {currentSlide < gameQuestions.stage1.demo.length - 1 ? (
                    <Button
                      onClick={() => handleSlideChange(currentSlide + 1)}
                      className="bg-green-700 hover:bg-green-800 text-white"
                    >
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStageChange('gameIntro')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Continue to Practice <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSlide>
        </AnimatePresence>
      </div>
    );
  };

  const renderStage2 = () => {
    const question = gameQuestions.stage2[currentQuestion];

    return (
      <div className="max-w-5xl mx-auto">
        <AnimatedSlide direction={slideDirection} key={`stage2-${currentQuestion}`}>
          <motion.div
            className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 2: Guided Practice</h2>
            <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {gameQuestions.stage2.length}</p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {question.hands.map((hand, index) => (
                <motion.div
                  key={index}
                  className={`
                    bg-white/5 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2
                    ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent hover:border-green-400/50'}
                  `}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  onClick={() => !showExplanation && setSelectedAnswer(index)}
                >
                  <h3 className="text-lg font-bold text-white text-center mb-4">Hand {index + 1}</h3>
                  <div className="flex justify-center gap-1 mb-4">
                    {hand.cards.map((card, cardIndex) => (
                      <PlayingCard key={cardIndex} card={card} className="w-12 h-16" />
                    ))}
                  </div>
                  <p className="text-green-200 text-center text-sm">{hand.name}</p>
                </motion.div>
              ))}
            </div>

            {!showExplanation && showClue > 0 && (
              <motion.div
                className="bg-blue-900/30 rounded-xl p-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-blue-200">
                  <strong>Clue:</strong> {showClue === 1 ? question.clue1 : question.clue2}
                </p>
              </motion.div>
            )}

            {showExplanation && (
              <motion.div
                className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-950/30' : 'bg-red-900/30'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
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
                    The correct answer was Hand {question.correct + 1}.
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              {!showExplanation ? (
                <>
                  {selectedAnswer !== null ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setShowExplanation(true)}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        Submit Answer
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="text-yellow-400">Which Hand Wins?</div>
                  )}

                  {showClue < 2 && question.clue2 && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setShowClue(showClue + 1)}
                        variant="outline"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"
                      >
                        Need a Clue?
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => {
                      if (currentQuestion < gameQuestions.stage2.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                        setSelectedAnswer(null);
                        setShowExplanation(false);
                        setShowClue(0);
                      } else {
                        handleStageChange('stage3-intro');
                      }
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {currentQuestion < gameQuestions.stage2.length - 1 ? 'Next Question' : 'Continue to Stage 3'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatedSlide>
      </div>
    );
  };

  const renderStage3 = () => {
    const question = gameQuestions.stage3[currentQuestion];

    return (
      <div className="max-w-5xl mx-auto">
        <AnimatedSlide direction={slideDirection} key={`stage3-${currentQuestion}`}>
          <motion.div
            className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Now you are on your own!</h2>
            <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {gameQuestions.stage3.length}</p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {question.hands.map((hand, index) => (
                <motion.div
                  key={index}
                  className={`
                    bg-white/5 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2
                    ${selectedAnswer === index ? 'border-yellow-400 bg-yellow-400/10' : 'border-transparent hover:border-green-400/50'}
                  `}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  onClick={() => !showExplanation && setSelectedAnswer(index)}
                >
                  <h3 className="text-lg font-bold text-white text-center mb-4">Hand {index + 1}</h3>
                  <div className="flex justify-center gap-1 mb-4">
                    {hand.cards.map((card, cardIndex) => (
                      <PlayingCard key={cardIndex} card={card} className="w-12 h-16" />
                    ))}
                  </div>
                  <p className="text-green-200 text-center text-sm">{hand.name}</p>
                </motion.div>
              ))}
            </div>

            {showExplanation && (
              <motion.div
                className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-950/30' : 'bg-red-900/30'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
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
                    The correct answer was Hand {question.correct + 1}.
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              {!showExplanation ? (
                <>
                  {selectedAnswer !== null ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setShowExplanation(true)}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        Submit Answer
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="text-yellow-400">Which hand wins?</div>
                  )}
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => {
                      if (currentQuestion < gameQuestions.stage3.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                        setSelectedAnswer(null);
                        setShowExplanation(false);
                      } else {
                        handleStageChange('stage4-intro');
                      }
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    {currentQuestion < gameQuestions.stage3.length - 1 ? 'Next Question' : 'Continue to Final Challenge'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatedSlide>
      </div>
    );
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(dndHands);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDndHands(items);
  };

  const handleDndSubmit = () => {
    let correctCount = 0;
    const checks = dndHands.map((hand, index) => {
        const isCorrect = hand.correctRank === index + 1;
        if (isCorrect) correctCount++;
        return isCorrect;
    });
    setDndResults({ correctCount, passed: correctCount >= 7, checks });
    setDndSubmitted(true);
  };

  const renderStage4 = () => (
    <div className="max-w-4xl mx-auto text-center">
        <AnimatedSlide direction={slideDirection} key="stage4">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-700/30">
                <h2 className="text-3xl font-bold text-white mb-2 font-heading">
                    Stage 4: Your Big Moment – The Final Challenge!
                </h2>
                <p className="text-green-300 mb-6">
                    Drag and drop the poker hands into the correct order from strongest (Rank 1) to weakest (Rank 10).
                </p>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="hands">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {dndHands.map((hand, index) => (
                                    <Draggable key={hand.id} draggableId={hand.id} index={index} isDragDisabled={dndSubmitted}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`
                                                    p-3 rounded-xl border-2 flex items-center transition-all duration-300
                                                    ${snapshot.isDragging ? 'bg-yellow-400/20 border-yellow-500' : 'bg-black/30 border-gray-600'}
                                                    ${dndSubmitted && dndResults.checks[index] ? 'bg-green-500/20 border-green-500' : ''}
                                                    ${dndSubmitted && !dndResults.checks[index] ? 'bg-red-500/20 border-red-500' : ''}
                                                `}
                                            >
                                                <div className="flex items-center w-full">
                                                    <div className="text-white font-bold text-lg w-12">{index + 1}.</div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-bold text-white text-md">{hand.name}</p>
                                                    </div>
                                                    <div className="flex gap-1 justify-end mr-4">
                                                        {hand.cards.map(c => <PlayingCard key={c} card={c} className="w-8 h-12" />)}
                                                    </div>
                                                    {!dndSubmitted && <GripVertical className="text-gray-400" />}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="mt-8">
                    {!dndSubmitted ? (
                        <Button onClick={handleDndSubmit} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                            Submit Ranking
                        </Button>
                    ) : dndResults.passed ? (
                        <div className="text-center">
                            <p className="text-green-400 text-xl font-bold mb-4">Correct! You placed {dndResults.correctCount}/10 hands correctly.</p>
                            <Button onClick={() => handleStageChange('completion')} className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 text-lg">
                                Complete Game <Trophy className="ml-2 w-5 h-5"/>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-red-400 text-xl font-bold mb-4">Not quite! You placed {dndResults.correctCount}/10 hands correctly. You need at least 7.</p>
                             <Button
                                onClick={() => {
                                    setDndHands(shuffleArray([...finalChallengeHands]));
                                    setDndSubmitted(false);
                                    setDndResults({ correctCount: 0, passed: false, checks: [] });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedSlide>
    </div>
  );

  const renderCompletion = () => (
    <div className="max-w-4xl mx-auto text-center">
      <AnimatedSlide direction={slideDirection} key="completion">
        <motion.div
          className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
          >
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
          <motion.div
            className="bg-green-950/30 rounded-xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-green-200 text-lg">
              You have successfully completed the 'Poker Hand Rankings — Can You Identify the Winning Hand?'
              mini-game. You now understand the official hierarchy of poker hands, from high card all the way up to royal flush,
              and can confidently determine which hand wins in real game scenarios. This skill is crucial for making correct
              decisions at the table and will serve as a cornerstone for mastering more advanced strategies in poker.
              Keep practicing to sharpen your instincts and apply this knowledge in every hand you play!
            </p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={completeGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
            >
              Return to Home
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatedSlide>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Back button */}
      <div className="max-w-6xl mx-auto mb-6">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            variant="outline"
            className="border-green-700 text-green-300 hover:bg-green-700/20"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {currentStage === 'intro' && renderIntro()}
        {currentStage === 'explanation' && renderExplanation()}
        {currentStage === 'gameIntro' && renderGameIntro()}
        {currentStage === 'stage1' && renderStage1()}
        {currentStage === 'stage2-intro' && <StageDivider title="Stage 2: Guided Practice" onContinue={() => handleStageChange('stage2')} />}
        {currentStage === 'stage2' && renderStage2()}
        {currentStage === 'stage3-intro' && <StageDivider title="Stage 3: Independent Practice" onContinue={() => handleStageChange('stage3')} />}
        {currentStage === 'stage3' && renderStage3()}
        {currentStage === 'stage4-intro' && <StageDivider title="Stage 4: Final Challenge" onContinue={() => handleStageChange('stage4')} />}
        {currentStage === 'stage4' && renderStage4()}
        {currentStage === 'completion' && renderCompletion()}
      </AnimatePresence>
    </div>
  );
}
