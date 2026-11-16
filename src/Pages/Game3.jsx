
import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shuffle } from 'lodash';
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

export default function Game3() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [matchAnswers, setMatchAnswers] = useState({});
  const [matchResults, setMatchResults] = useState(null);
  const [user, setUser] = useState(null);
  const gameId = 3;
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

    try {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = timer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      await User.completeGame(3);

      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error completing game:", error);
      alert("Failed to save game progress. Please try again.");
    }
  };

  const explanationSlides = [
    {
      title: "Part A: Table Positions and Player Designations",
      content: "In poker, understanding table positions is fundamental for strategic play, particularly in a 6-max game where positions are referred to by acronyms. These crucial positions include the SB (Small Blind), BB (Big Blind), UTG (Under the Gun), MP (Middle Position), CO (Cut Off), and BTN (Button). When hands are discussed, the player making decisions is called the \"Hero,\" while opponents are referred to as the \"Villain\".",
    },
    {
      positions: [
        { name: "SB", full: "Small Blind", description: "Posts the smaller forced bet" },
        { name: "BB", full: "Big Blind", description: "Posts the larger forced bet" },
        { name: "UTG", full: "Under the Gun", description: "First player to act after blinds" },
        { name: "MP", full: "Middle Position", description: "Between UTG and CO" },
        { name: "CO", full: "Cut Off", description: "Just before the Button" },
        { name: "BTN", full: "Button", description: "Dealer position, acts last post-flop" }
      ]
    },
    {
      title: "Part B: Hand Notation and Ranges",
      content: "Poker employs specific notation to clarify hand types. Suited hands, where both cards are of the same suit, are denoted with an 's', for example, AKs (Ace-King suited). Conversely, off-suited hands, with cards of different suits, use an 'o', as in AKo (Ace-King off-suited). Hand ranges refer to all the possible hands a player might hold. Common range notation includes \"22+\" for any pocket pair or \"AJs+\" for suited Ace-Jack or better.",
    },
    {
      examples: [
        { notation: "AKs", meaning: "Ace-King of the same suit", example: "A♠ K♠" },
        { notation: "AKo", meaning: "Ace-King of different suits", example: "A♠ K♥" },
        { notation: "22+", meaning: "Any pocket pair from 2s to Aces", example: "22, 33, ..., AA" },
        { notation: "AJs+", meaning: "Ace-Jack suited or better", example: "AJs, AQs, AKs" }
      ]
    }
  ];

  const gameIntroSlides = [
    {
      title: "Short Intro",
      content: (
        <div className="bg-green-950/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">
            Poker is more than just the cards you're dealt; it's also about where you sit and how you describe hands.
            In this mini-game, you'll master the essential poker language for table positions and hand notation,
            giving you a sharp edge at the virtual felt. Get ready to think like a pro!
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
            <li>1. Correctly identify the six standard 6-max poker table positions by their acronyms (SB, BB, UTG, MP, CO, BTN)</li>
            <li>2. Accurately interpret common poker hand notation, distinguishing between suited (AKs) and off-suited (AKo) hands, and understanding basic range notation (22+, AJs+)</li>
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
            You will be presented with different challenges designed to test your knowledge of poker positions and hand notation.
            For table positions, you'll match labels to their correct spots or acronyms. For hand notation, you'll match terms to their
            correct meanings or choose the right interpretation from a list of options. Complete all stages to master poker language!
          </p>
        </div>
      )
    }
  ];

  const stage1DemoSlides = [
    {
      title: "Demo 1: Table Positions",
      content: (
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Demo 1: Table Positions
          </h3>

          <div className="bg-green-900/30 rounded-2xl p-6 relative mb-6">
            <div className="text-center text-white mb-4 font-bold">6-Max Table - Position Breakdown</div>
            <div className="relative w-96 h-64 mx-auto">
              <div className="absolute inset-x-8 inset-y-0 bg-green-800 rounded-full border-4 border-green-700"></div>

              <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 text-center w-24">
                <div className="bg-yellow-500 text-black px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>BTN</div>
                  <div className="text-xs">Button</div>
                </div>
                <div className="text-white text-xs mt-1">Acts last post-flop</div>
              </div>

              <div className="absolute top-4 left-16 text-center">
                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>CO</div>
                  <div className="text-xs">Cut Off</div>
                </div>
                <div className="text-white text-xs mt-1">Before the Button</div>
              </div>

              <div className="absolute bottom-4 left-16 text-center">
                <div className="bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>MP</div>
                  <div className="text-xs">Middle Position</div>
                </div>
                <div className="text-white text-xs mt-1">Between UTG and CO</div>
              </div>

              <div className="absolute bottom-4 right-16 text-center">
                <div className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>UTG</div>
                  <div className="text-xs">Under the Gun</div>
                </div>
                <div className="text-white text-xs mt-1">First to act</div>
              </div>

              <div className="absolute top-4 right-16 text-center">
                <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>BB</div>
                  <div className="text-xs">Big Blind</div>
                </div>
                <div className="text-white text-xs mt-1">Larger forced bet</div>
              </div>

              <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 text-center w-24">
                <div className="bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold inline-block">
                  <div>SB</div>
                  <div className="text-xs">Small Blind</div>
                </div>
                <div className="text-white text-xs mt-1">Smaller forced bet</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
            <p className="text-yellow-200">
              <strong>Important:</strong> You, the player, will always be referred to as the 'Hero,' and your opponents as 'Villains.'
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Demo 2: Hand Notation",
      content: (
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Demo 2: Hand Notation
          </h3>
          <p className="text-green-200 mb-6">
            Various poker hand notations will be displayed with their explanations.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-950/30 rounded-lg p-4">
              <div className="text-yellow-400 font-bold text-xl mb-2">AKs</div>
              <p className="text-green-200 text-sm mb-2">
                Refers to an Ace and a King of the same suit. The 's' stands for suited.
              </p>
              <p className="text-blue-200 text-xs">Example: Ace of Spades and King of Spades</p>
            </div>

            <div className="bg-red-900/30 rounded-lg p-4">
              <div className="text-yellow-400 font-bold text-xl mb-2">AKo</div>
              <p className="text-green-200 text-sm mb-2">
                Denotes an Ace and a King of different suits. The 'o' stands for off-suited.
              </p>
              <p className="text-blue-200 text-xs">Example: Ace of Clubs and King of Hearts</p>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-4">
              <div className="text-yellow-400 font-bold text-xl mb-2">22+</div>
              <p className="text-green-200 text-sm mb-2">
                A common range notation that means any pocket pair from deuces all the way up to Aces.
              </p>
              <p className="text-blue-200 text-xs">Includes: 22, 33, 44, ..., KK, AA</p>
            </div>

            <div className="bg-orange-900/30 rounded-lg p-4">
              <div className="text-yellow-400 font-bold text-xl mb-2">AJs+</div>
              <p className="text-green-200 text-sm mb-2">
                Means Ace-Jack suited or better. This range includes stronger suited aces.
              </p>
              <p className="text-blue-200 text-xs">Includes: AJs, AQs, AKs</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const stage2Questions = [
    {
      question: "Match the correct acronym to its corresponding position name.",
      type: "match",
      pairs: [
        { left: "Small Blind", right: "SB" },
        { left: "Big Blind", right: "BB" },
        { left: "Under the Gun", right: "UTG" },
        { left: "Middle Position", right: "MP" },
        { left: "Cut Off", right: "CO" },
        { left: "Button", right: "BTN" }
      ],
      explanation: "This matches the position name to its correct acronym. Understanding these abbreviations is key to following poker discussions.",
      hint: "Remember, 'SB' and 'BB' are the forced bets. 'BTN' acts last, and 'UTG' acts first after the blinds."
    },
    {
      question: "In poker discussions, which term refers to the player whose perspective we are considering?",
      options: ["Villain", "Dealer", "Hero", "Opponent"],
      correct: 2,
      explanation: "Hero is the term used to refer to the player from the perspective we are analyzing, while Villain refers to the opponents",
      hint: "Think about the main character or decision-maker in a hand analysis."
    },
    {
      question: "Match the poker hand notation with its correct meaning.",
      type: "match",
      pairs: [
        { left: "AKs", right: "Ace-King of the same suit" },
        { left: "AKo", right: "Ace-King of different suits" },
        { left: "22+", right: "Any pocket pair" },
        { left: "AJs+", right: "Ace-Jack suited or better" }
      ],
      explanation: "The 's' in AKs indicates that the two cards are of the same suit (suited), the 'o' in AKo indicates different suits (off-suited), and the '+' in 22+ or AJs+ indicates 'or better' than the specified hand range.",
      hint: "The letters 's' and 'o' refer to the suits. The '+' sign indicates 'or better'."
    },
    {
      question: "Which of the following hands is not included in the 'KK+' range?",
      options: ["KK (King-King)", "AA (Ace-Ace)", "QQ (Queen-Queen)"],
      correct: 2,
      explanation: "The range \"KK+\" means all pocket pairs of Kings or higher, so it only includes KK and AA. Since QQ is lower than KK, it is not part of this range.",
      hint: "The '+' sign after a specific pair means all pairs equal to or higher than that specific pair."
    }
  ];

  const stage3Questions = [
    {
      question: "Place the correct poker position names into their respective labeled acronyms on the table.",
      type: "match",
      pairs: [
          { left: "SB", right: "Small Blind" },
          { left: "BB", right: "Big Blind" },
          { left: "UTG", right: "Under the Gun" },
          { left: "MP", right: "Middle Position" },
          { left: "CO", right: "Cut Off" },
          { left: "BTN", right: "Button" }
      ],
      explanation: "These are the standard 6-max poker position acronyms matched with their full names. Understanding these allows you to quickly follow hand analysis."
    },
    {
      question: "In a 6-max game, which position is usually the last to act post-flop, providing a strategic advantage?",
      options: ["Small Blind", "Button", "Under the Gun", "Middle Position"],
      correct: 1,
      explanation: "The button is always the last player to act in betting rounds after the flop, which gives him a significant strategic advantage."
    },
    {
      question: "A hand like A7, where the Ace and Seven are of different suits, is typically written as A7______.",
      options: ["s (for suited)", "o (for offsuit)", "+ (for any higher ranked hands)", "x (for unknown suit)"],
      correct: 1,
      explanation: "The letter 'o' is used to denote hands that have cards of different suits (off-suited), such as Ace-Seven when they are not of the same suit."
    },
    {
      question: "If a player's hand range is described as 'TT+', which of the following hands would be included?",
      options: ["99", "JJ", "ATo", "88"],
      correct: 1,
      explanation: "The notation 'TT+' includes any pocket pair that is equal to Ten-Ten (TT) or better, i.e. JJ, QQ, KK, AA."
    },
    {
      question: "You hear a commentator mention a player holding 'JTs'. What does this mean?",
      options: [
        "Jack-Ten of different suits",
        "Jack-Ten where both cards are spades",
        "Jack-Ten of the same suit",
        "Jack or Ten, suited"
      ],
      correct: 2,
      explanation: "The letter 's' in JTs indicates that the two cards, Jack and Ten, are of the same suit, for example Jack of Spades and Ten of Spades."
    },
    {
      question: "The 'Villain' in a poker hand analysis refers to the player making the strategic decisions from the main perspective.",
      options: ["True", "False"],
      correct: 1,
      explanation: "The 'Hero' refers to the player whose decisions we are analyzing, while the 'Villain' refers to the opponent."
    }
  ];

  const handleMatchSelection = (leftItem, value) => {
    setMatchAnswers(prev => ({ ...prev, [leftItem]: value }));
  };

  const checkMatchAnswers = () => {
    const question = stage2Questions[currentQuestion];
    const results = {};
    question.pairs.forEach(pair => {
      if (matchAnswers[pair.left] === pair.right) {
        results[pair.left] = 'correct';
      } else {
        results[pair.left] = 'incorrect';
      }
    });
    setMatchResults(results);
    setShowExplanation(true);
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
    setMatchAnswers({});
    setMatchResults(null);
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 3: Poker Language
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          Positions, Abbreviations & Notation (AKs/AKo)
        </h2>
        <p className="text-green-200 text-lg mb-8">
          Master the essential poker language for table positions and hand notation.
          Learn to speak poker like a pro!
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
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
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
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
                  {slide.title}
                </motion.h2>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white/10 rounded-xl p-6 mb-6"
              >
                <motion.p variants={itemVariants} className="text-green-200 text-lg leading-relaxed mb-6">
                  {slide.content}
                </motion.p>

                {slide.positions && (
                  <motion.div variants={itemVariants}>
                    <h3 className="text-xl font-bold text-white mb-4">6-Max Table Positions:</h3>
                    <motion.div
                      variants={containerVariants}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      {slide.positions.map((pos, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="bg-green-950/30 rounded-lg p-4 text-center"
                        >
                          <div className="text-yellow-400 font-bold text-lg mb-1">{pos.name}</div>
                          <div className="text-white text-sm mb-2">{pos.full}</div>
                          <div className="text-green-200 text-xs">{pos.description}</div>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="mt-6 bg-green-900/30 rounded-2xl p-6 relative"
                    >
                      <div className="text-center text-white mb-4 font-bold">6-Max Table Layout</div>
                      <div className="relative w-96 h-56 mx-auto">
                        <div className="absolute inset-0 bg-green-800 rounded-full border-4 border-green-700"></div>

                        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">BTN</div>
                        <div className="absolute top-8 left-12 bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">CO</div>
                        <div className="absolute bottom-8 left-12 bg-purple-500 text-white px-3 py-1 rounded text-sm font-bold">MP</div>
                        <div className="absolute bottom-8 right-12 bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">UTG</div>
                        <div className="absolute top-8 right-12 bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">BB</div>
                        <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-green-700 text-white px-3 py-1 rounded text-sm font-bold">SB</div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {slide.examples && (
                  <motion.div variants={itemVariants}>
                    <h3 className="text-xl font-bold text-white mb-4">Hand Notation Examples:</h3>
                    <motion.div
                      variants={containerVariants}
                      className="space-y-4"
                    >
                      {slide.examples.map((example, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-yellow-400 font-bold text-lg">{example.notation}</span>
                            <span className="text-green-200 text-sm">{example.example}</span>
                          </div>
                          <p className="text-green-200">{example.meaning}</p>
                        </motion.div>
                      ))}
                    </motion.div>
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
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-700 text-green-300 hover:bg-green-700/20"
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
                className="bg-green-700 hover:bg-green-800 text-white"
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
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
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
                Position Power: Can You Speak Poker?
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
              className="border-green-700 text-green-300 hover:bg-green-700/20"
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
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('stage1');
                  setCurrentSlide(0);
                }}
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

  const renderStage1Demo = () => {
    const slide = stage1DemoSlides[currentSlide];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
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
                className="text-3xl font-bold text-white text-center mb-8"
              >
                Stage 1: Live Demo
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
              className="border-green-700 text-green-300 hover:bg-green-700/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            <span className="text-green-300">
              {currentSlide + 1} of {stage1DemoSlides.length}
            </span>

            {currentSlide < stage1DemoSlides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('stage2');
                  setCurrentQuestion(0);
                  resetQuestionState();
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3"
              >
                Continue to Practice
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    );
  };

  const renderStage2 = () => {
    const question = stage2Questions[currentQuestion];
    const allPossibleRightAnswers = question.type === 'match' ? shuffle([...new Set(question.pairs.map(p => p.right))]) : [];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 2: Guided Practice</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage2Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-green-200 text-lg">{question.question}</p>
          </div>

          {question.type === 'match' ? (
            <div className="space-y-3 mb-6">
              {question.pairs.map((pair, index) => {
                const result = matchResults ? matchResults[pair.left] : null;
                return (
                  <div key={index} className={`p-4 rounded-lg transition-all duration-300 border-2 flex items-center justify-between
                    ${!showExplanation ? 'bg-white/5 border-transparent' : ''}
                    ${showExplanation && result === 'correct' ? 'border-green-400 bg-green-400/10' : ''}
                    ${showExplanation && result === 'incorrect' ? 'border-red-400 bg-red-400/10' : ''}
                  `}>
                    <div className="text-green-200 font-semibold">{pair.left}</div>
                    <Select
                      onValueChange={(value) => handleMatchSelection(pair.left, value)}
                      disabled={showExplanation}
                      value={matchAnswers[pair.left] || ''}
                    >
                        <SelectTrigger className="w-[250px] bg-black/30 border-green-700/50 text-white">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allPossibleRightAnswers.map((opt, i) => (
                                <SelectItem key={i} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {showExplanation && result === 'correct' && (
                        <CheckCircle className="ml-2 w-5 h-5 text-green-400" />
                    )}
                    {showExplanation && result === 'incorrect' && (
                        <div className="ml-2 w-5 h-5 flex items-center justify-center text-red-400">✗</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : question.options ? (
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
          ) : null}

          {!showExplanation && showHint && question.hint && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6">
              <p className="text-blue-200">
                <strong>Hint:</strong> {question.hint}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className="bg-green-950/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Explanation</h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
              {question.type === 'match' && !Object.values(matchResults || {}).every(r => r === 'correct') && (
                <p className="text-yellow-200 mt-2">
                    Some of your matches were incorrect. Please review the explanation.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <div className="flex justify-between w-full items-center">
                {question.type === 'match' ? (
                  Object.keys(matchAnswers).length === question.pairs.length &&
                  Object.values(matchAnswers).every(val => val !== undefined && val !== null && val !== '') ? (
                    <Button onClick={checkMatchAnswers} className="bg-green-700 hover:bg-green-800 text-white">Submit Answer</Button>
                  ) : (
                    <div className="text-green-300">Select an answer for each pair to continue</div>
                  )
                ) : selectedAnswer !== null ? (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-700 hover:bg-green-800 text-white"
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
                    setCurrentQuestion(currentQuestion + 1);
                    resetQuestionState();
                  } else {
                    setCurrentStage('stage3');
                    setCurrentQuestion(0);
                    resetQuestionState();
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
    const allPossibleRightAnswers = question.type === 'match' ? shuffle([...new Set(question.pairs.map(p => p.right))]) : [];

    const isMatchQuestionAllCorrect = question.type === 'match' && question.pairs.every(pair => matchAnswers[pair.left] === pair.right);
    const isMultipleChoiceCorrect = question.type !== 'match' && selectedAnswer === question.correct;
    const isCorrectOverall = isMatchQuestionAllCorrect || isMultipleChoiceCorrect;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Stage 3: Now you are on your own!</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {stage3Questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Question:</h3>
            <p className="text-green-200 text-lg">{question.question}</p>
          </div>

          {question.type === 'match' ? (
             <div className="space-y-3 mb-6">
               {question.pairs.map((pair, index) => {
                 const isCorrect = showExplanation && matchAnswers[pair.left] === pair.right;
                 const isIncorrect = showExplanation && matchAnswers[pair.left] !== pair.right;

                 return (
                   <div key={index} className={`p-4 rounded-lg transition-all duration-300 border-2 flex items-center justify-between
                     ${!showExplanation ? 'bg-white/5 border-transparent' : ''}
                     ${isCorrect ? 'border-green-400 bg-green-400/10' : ''}
                     ${isIncorrect ? 'border-red-400 bg-red-400/10' : ''}
                   `}>
                     <div className="text-green-200 font-semibold">{pair.left}</div>
                     <Select
                       onValueChange={(value) => handleMatchSelection(pair.left, value)}
                       disabled={showExplanation}
                       value={matchAnswers[pair.left] || ''}
                     >
                         <SelectTrigger className="w-[250px] bg-black/30 border-green-700/50 text-white">
                             <SelectValue placeholder="Select..." />
                         </SelectTrigger>
                         <SelectContent>
                             {allPossibleRightAnswers.map((opt, i) => (
                                 <SelectItem key={i} value={opt}>{opt}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                     {isCorrect && (
                         <CheckCircle className="ml-2 w-5 h-5 text-green-400" />
                     )}
                     {isIncorrect && (
                         <div className="ml-2 w-5 h-5 flex items-center justify-center text-red-400">✗</div>
                     )}
                   </div>
                 )
               })}
             </div>
          ) : (
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
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrectOverall ? 'bg-green-950/30' : 'bg-red-900/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrectOverall ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-red-400 flex items-center justify-center">
                    <span className="text-red-400 text-sm">✗</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">
                  {isCorrectOverall ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-green-200">{question.explanation}</p>
              {!isCorrectOverall && question.type !== 'match' && (
                <p className="text-yellow-200 mt-2">
                  The correct answer was {String.fromCharCode(65 + question.correct)}.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {!showExplanation ? (
              <>
                { (question.type === 'match' && Object.keys(matchAnswers).length === question.pairs.length && Object.values(matchAnswers).every(val => val !== undefined && val !== null && val !== '')) || (question.type !== 'match' && selectedAnswer !== null) ? (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="bg-green-700 hover:bg-green-800 text-white"
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
                    resetQuestionState();
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
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-700/30">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
        <div className="bg-green-950/30 rounded-xl p-6 mb-8">
          <p className="text-green-200 text-lg">
            You have successfully completed the 'Position Power: Do You Speak Poker?' mini-game.
            You now master the essential language of poker, including table positions, abbreviations, and hand signals.
            This knowledge will give you a significant advantage at the poker tables and will provide a solid foundation
            for your further studies in poker mathematics. Keep practicing and applying what you have learned!
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
          className="border-green-700 text-green-300 hover:bg-green-700/20"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {currentStage === 'intro' && renderIntro()}
      {currentStage === 'explanation' && renderExplanation()}
      {currentStage === 'gameIntro' && renderGameIntro()}
      {currentStage === 'stage1' && renderStage1Demo()}
      {currentStage === 'stage2' && renderStage2()}
      {currentStage === 'stage3' && renderStage3()}
      {currentStage === 'completion' && renderCompletion()}
    </div>
  );
}
