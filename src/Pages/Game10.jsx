
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Info, Target, Zap, Users, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

// A simple component to render the poker table visual
const PokerTable = ({ children, title }) => (
  <div className="bg-green-800/30 rounded-2xl p-4 sm:p-6 relative my-6 border-2 border-green-700/50">
    <div className="text-center text-white mb-4 font-bold">{title}</div>
    <div className="relative w-full max-w-md h-56 mx-auto">
      <div className="absolute inset-0 bg-green-700 rounded-full border-4 border-green-600 shadow-inner"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const PositionMarker = ({ position, className, isActive }) => (
  <div className={`absolute ${className} flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2`}>
    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg transition-all duration-300 ${isActive ? 'bg-yellow-400 text-black scale-110' : 'bg-black/40 text-white'}`}>
      {position}
    </div>
  </div>
);

export default function Game10() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1); // Added for slide transitions
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(0);
  const [user, setUser] = useState(null);
  const gameId = 10;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const explanationSlides = [
    { title: "The Importance of Position", content: "Position refers to your turn in the betting sequence relative to other players at the table. It is a crucial, yet often overlooked, element of effective poker play. When you are in late position, it means you act after most or all of your opponents. This allows you to gather vital information about their likely hands by observing their actions before you decide on your own play. Conversely, being in early position means you act first, without this significant informational benefit." },
    { title: "Advantages of Last Position", content: "The primary benefit of playing from last position is the information advantage it provides. By seeing how your opponents act (checking, betting, or raising), you gain valuable clues about the strength of their hands. This knowledge enables you to make more intelligent and profitable decisions. For example, if all players check to you, even with a weak hand, you might bet to win the current pot because their checks indicate weakness. This control also often allows you to receive a free card or make a raise to push opponents out of the pot." },
    { title: "Disadvantages of Early Position", content: "Acting from first position carries significant disadvantages because you must make your decision without knowing what your opponents will do. This lack of information can lead to less optimal plays. For instance, if you hold a strong hand and bet in early position, a weaker hand behind you might fold, costing you potential value. Or, a strong hand behind you might re-raise, putting you in a difficult and expensive situation." },
    { title: "Adjusting Play to Minimize Risk", content: "Understanding and utilizing position allows you to adjust your strategy to minimize risk. For example, in early position, playing fewer hands, or playing them more conservatively, can help protect you from aggressive actions by players in later positions." },
    { title: "Strong Hand, Bettor to the Left", content: "When you hold a strong hand and the player immediately to your left bets, your optimal action is often to call rather than raise. This strategy aims to encourage other players behind you to also call, or even raise themselves, creating a larger pot. By calling, you are not trying to drive opponents out, but rather to trap them into contributing more money to the pot before you make a larger bet on a later round." },
    { title: "Strong Hand, Bettor to the Right", content: "When you hold a strong hand and a player to your immediate right bets, the optimal action is often to raise. This move serves to build the pot and potentially drive out weaker hands. While raising might reduce the number of players who call, it is generally considered the more profitable action in this scenario, as it maximizes the value from your strong hand and prevents opponents from getting free cards or drawing cheaply." },
    { title: "Position Vis-À-Vis Other Players", content: "Understanding your position is also critical in relation to the playing styles of your opponents. Against loose and aggressive players to your left, you might choose to play more tightly from early position, or look for opportunities to trap them with strong hands when you have position on them. Conversely, against tight and conservative players, you might be able to steal more pots from late position." },
    { title: "Summary: The Power of Position", content: "In summary, position is one of the most vital yet often underestimated aspects of poker. The core principle is that acting last \"prints money\" because it provides a crucial information advantage, allowing you to make more informed and profitable decisions. By consistently adjusting your play to your position, you will significantly enhance your poker strategy and long-term profitability." }
  ];

  const stage2Questions = [
    {
      title: "Question 1: Early Position, Marginal Hand",
      position: "Early position",
      hand: ["J♣", "8♠"],
      question: "What is the best action?",
      options: ["Fold", "Call", "Raise"],
      correct: 0,
      hint1: "Remember, in early position, you are acting before most players, which gives you 'less information' about their intentions. What does 'tightness in early position' offer marginal hands?",
      hint2: "Think about the 'long-term cost' of playing too many marginal hands from early position.",
      feedback: "Early position action carries significant disadvantages because you are forced to make a decision without knowing what your opponents' intentions will be. This lack of information often leads to suboptimal moves, so playing marginal hands from early position is not profitable in the long run."
    },
    {
      title: "Question 2: Early Position, Strong Hand",
      position: "Early position",
      hand: ["K♥", "K♦"],
      question: "What is the best action?",
      options: ["Fold", "Call", "Raise"],
      correct: 2,
      hint1: "While 'tight early position' is key, some hands are strong enough to play aggressively from any position. Consider maximizing your value.",
      feedback: "The goal with a strong hand is to maximize its value and build a significant pot by taking an aggressive initiative. Although this may cause weak hands to fold, it is still the more profitable move to build the pot and prevent opponents from getting free cards."
    },
    {
      title: "Question 3: Late position, marginal hand, no action",
      position: "Late Position",
      hand: ["9♦", "7♦"],
      question: "What is the best action?",
      options: ["Fold", "Call", "Raise"],
      correct: 1,
      hint1: "We discussed that 'position implies strength' and that 'it is almost always an advantage to act after your opponents.' In late position, with no action, you have a significant 'information advantage.'",
      feedback: "In late position, you gain a vital informational advantage. This allows you to play more marginal hands (such as calling) when there has been no previous action, as you have more control over the move and can use this information to win the pot later or see a free card."
    },
    {
      title: "Question 4: Identifying Informational Advantage",
      board: ["A♣", "5♠", "2♥"],
      position: "Late Position",
      hand: ["K♥", "K♦"],
      question: "All players in front of you check. What should you do?",
      options: ["Check", "Bet", "Fold"],
      correct: 1,
      hint1: "Consider what your opponents’ checks indicate. What information does a recent action provide?",
      hint2: "Can you win the pot now, or get a free card, without much risk, given their actions?",
      feedback: "In late position, seeing opponents check indicates weakness in their hands and provides valuable information that can be exploited. This knowledge allows you to make more informed and profitable decisions, such as betting to win the current pot."
    }
  ];

  const stage3Questions = [
    { hand: ["A♣", "6♥"], position: "Early Position", question: "What is the best preflop action?", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "Folding this hand from early position saves you money in the long run, as it is difficult to play profitably when many players still have to act." },
    { hand: ["A♥", "K♥"], position: "Early Position", question: "What is the best preflop action?", options: ["Fold", "Call", "Raise"], correct: 2, feedback: "Raising with a premium hand from early position builds the pot and 'flushes out' weaker hands, maximizing your equity." },
    { hand: ["Q♠", "J♠"], position: "Middle Position", question: "An early position player folded. What is the best action?", options: ["Fold", "Call", "Raise"], correct: 1, feedback: "From middle position, without early action, you can afford to 'play a wider range of hands profitably', especially suited connectors. Calling is a reasonable play here." },
    { hand: ["5♥", "2♣"], position: "Late Position", question: "Multiple players have called before you. What is the best action?", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "Even in late position, if multiple players have already entered, your weak hand has very little chance of winning and calling would be expensive." },
    {"hand": ["A♦", "K♣"],"position": "Middle position","question": "What is the best action before the flop?","options": ["fold", "call", "raise"],"correct": 2,"feedback": "Ace-K is a premium hand that should be played aggressively to 'build the pot'. Raising from middle position narrows the field and maximizes profits."},
    {"hand": ["8♥", "7♥"],"position": "Late position","question": "What is the best action before the flop? (the pot is not raised)","options": ["fold", "call", "raise"],"correct": 1,"feedback": "In late position you have an advantage. When the pot is not raised, you can afford to 'see the flop cheaply' with speculative hands like suited connectors."},
    {"hand": ["9♥", "8♥"],"position": "Early position","question": "What is the best preflop action?","options": ["fold", "call", "raise"],"correct": 0,"feedback": "Speculative hands like suited connectors, despite their drawing potential, are not strong enough to play from 'early position'. The lack of discipline to fold weak opening hands is a significant flaw."},
  {"hand": ["K♣", "9♦"],"position": "Late position","question": "What is the best action before the flop? (the pot has not been raised)","options": ["fold", "call", "raise"],"correct": 1,"feedback": "In late position you have a huge last-action advantage. A hand as weak as King-Nine should not go into a big pot, but in late position you can afford to see the flop cheaply."},
  {"hand": ["A♦", "8♣"],"position": "Late position","question": "What is the best action before the flop? (Everyone folded)","options": ["fold", "call", "raise"],"correct": 2,"feedback": "When no one has entered the pot before you, 'Late position' gives you a 'License to steal'."}
  ];

  // Removed finalStageQuestions array

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(0);
    // Removed setTimeLeft(20);
  }, []);

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

  // Removed useEffect related to timeLeft, as final stage and timer are removed

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const completeGame = async () => { // Removed `passed` parameter
    if (!user) return;

    // The game completion logic now just marks the game as completed, no pass/fail
    const today = new Date().toISOString().split('T')[0];
    completedRef.current = true;
    const spentSec = timer.readSeconds();
    track("Game Completed", { gameId, spentSec });
    await User.completeGame(10);

    navigate(createPageUrl("Home"));
  };

  // Removed handleFinalStageNext function

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Game 10: Power of Position
        </h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">
          The Importance and Power of Table Positions - Explanation
        </h2>
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

  const handleExplanationSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];

    return (
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: slideDirection * 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideDirection * 300 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
                </div>
                <div className="bg-white/10 rounded-xl p-6 mb-6 min-h-[200px] flex items-center justify-center">
                  <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-between items-center mt-6">
          <Button onClick={() => handleExplanationSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
          <span className="text-green-300">{currentSlide + 1} of {explanationSlides.length}</span>
          {currentSlide < explanationSlides.length - 1 ? (
            <Button onClick={() => handleExplanationSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
          ) : (
            <Button onClick={() => setCurrentStage('gameIntro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Game <ArrowRight className="ml-2 w-4 h-4" /></Button>
          )}
        </div>
      </div>
    );
  };

  const renderGameIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Position Power: Why Last is Best!</h2>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Short Intro:</h3>
          <p className="text-green-200">In poker, your position is incredibly important. This mini-game will teach you why acting last gives you a powerful edge. Understanding position is key to thinking like a pro.</p>
        </div>
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">What will you learn in this game:</h3>
          <ul className="text-green-200 space-y-2 list-disc list-inside">
            <li>Identify situations where you have a positional advantage and explain its benefits.</li>
            <li>Adjust your strategy to leverage last position for increased profitability.</li>
          </ul>
        </div>
        <Button onClick={() => setCurrentStage('gameIntroInstructions')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">How to play <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderGameIntroInstructions = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Position Power: Why Last is Best!</h2>
        <div className="bg-green-900/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">How to Play </h3>
          <p className="text-green-200">In this game, you will be presented with a poker table scenario that shows your position, your private pocket cards, and any actions (folds, checks, raises) from players who acted before you. Your task is to choose the optimal pre-flop action from the given options (fold, check, bet, or raise). Pay close attention to your position and remember the principle of "tightness in early position" and the advantage of "who acts after me?" to make the most informed decision</p>
        </div>

        <Button onClick={() => { setCurrentStage('stage1'); setCurrentSlide(0); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"> Begin Game <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderStage1 = () => {
    const stage1Slides = [
      {
        title: "Stage 1: Live Demo",
        content: "The system will show one solved example with a verbal explanation. The system will visually demonstrate two distinct scenarios on a poker table, with clear explanations for each step.",
        isIntro: true
      },
      {
        title: "Scenario 1: Folding in Early Position (Bad Hand)",
        position: "Early Position - First player to the left of the big blind",
        hand: ["7♠", "2♦"],
        previousActions: "No players have acted before you",
        optimalAction: "FOLD",
        explanation: [
          "In early position, you are required to act before most other players, which gives you less information about their intentions and the strength of their hands.",
          "Playing weak hands from this position is a costly decision in the long run.",
          "The system will now demonstrate the optimal action: Fold.",
          "Folding bad hands in early position is a core principle of early position reduction.",
          "As a reminder, calculations show that consistently calling the $5 small blind with a 'junk hand' over 1,000 hours of play could cost you around $5,000. Discipline in folding bad opening hands is essential to saving money."
        ]
      },
      {
        title: "Scenario 2: Strength in Early Position (Strong Hand)",
        position: "Early Position - First player to the left of the big blind",
        hand: ["A♠", "A♦"],
        previousActions: "No players have acted before you",
        optimalAction: "RAISE",
        explanation: [
          "While early position generally requires a tight approach, there are hands so strong that they can be played aggressively from any position at the table.",
          "The system will now demonstrate the optimal action: Raise."
        ]
      },
      {
        title: "Scenario 3: Information Advantage in Late Position (Marginal Hand)",
        position: "Late Position - Last to act",
        hand: ["J♠", "T♦"],
        previousActions: "All players in front of you check",
        optimalAction: "CHECK (Free Card)",
        explanation: [
          "The information gained (opponents check) allows you to make a safer and more profitable decision, whether to win the pot unopposed or see a free card, which you could not do in early position."
        ]
      }
    ];

    const currentSlideData = stage1Slides[currentSlide];

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h2
              className="text-4xl font-bold text-white text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {currentSlideData.title}
            </motion.h2>

            {currentSlideData.isIntro ? (
              <motion.div
                className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <motion.p
                  className="text-green-200 text-lg text-center leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {currentSlideData.content}
                </motion.p>
              </motion.div>
            ) : (
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                {/* Position and Hand Display */}
                <motion.div
                  className="grid md:grid-cols-2 gap-8 mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Your Position</h3>
                    <p className="text-green-300 text-lg">{currentSlideData.position}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Your Hand</h3>
                    <div className="flex gap-2 justify-center">
                      {currentSlideData.hand.map((card, index) => (
                        <motion.div
                          key={card} // Use card as key if unique, or index if not
                          initial={{ opacity: 0, rotateY: -90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          transition={{ delay: 0.5 + (index * 0.2), duration: 0.5 }}
                        >
                          <PlayingCard card={card} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Previous Actions */}
                <motion.div
                  className="bg-blue-900/20 rounded-xl p-6 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-3">Previous Actions</h3>
                  <p className="text-blue-200 text-lg">{currentSlideData.previousActions}</p>
                </motion.div>

                {/* Optimal Action */}
                <motion.div
                  className="bg-yellow-400/10 rounded-xl p-6 mb-8 border border-yellow-400/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <h3 className="text-xl font-bold text-white mb-3">Optimal Action</h3>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-yellow-400">{currentSlideData.optimalAction}</span>
                  </div>
                </motion.div>

                {/* Explanation */}
                <motion.div
                  className="bg-green-950/30 rounded-xl p-6 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Explanation</h3>
                  {currentSlideData.explanation.map((point, index) => (
                    <motion.p
                      key={index}
                      className="text-green-200 leading-relaxed"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + (index * 0.2), duration: 0.4 }}
                    >
                      • {point}
                    </motion.p>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
              disabled={currentSlide === 0}
              variant="outline"
              className="border-green-600 text-green-300 hover:bg-green-600/20"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>
          </motion.div>

          <span className="text-green-300 font-medium">
            {currentSlide + 1} of {stage1Slides.length}
          </span>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {currentSlide < stage1Slides.length - 1 ? (
              <Button
                onClick={() => setCurrentSlide(s => s + 1)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentStage('stage2');
                  resetQuestionState();
                  setCurrentQuestion(0);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Continue to Practice
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  };

  const renderQuestionStage = (questions, stageTitle, nextStage) => {
    const question = questions[currentQuestion];
    // Removed isFinalStage check

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <h2 className="text-3xl font-bold text-white text-center mb-2">{question.title || stageTitle}</h2>
          <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {questions.length}</p>

          {/* Removed finalStage timer/progress bar */}

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-green-200 text-lg mb-4">{question.question}</p>
            {question.board && (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <p className="text-white font-bold">Board:</p>
                    <div className="flex gap-2">
                        {question.board.map(card => <PlayingCard key={card} card={card} />)}
                    </div>
                </div>
            )}
            {question.hand && (
              <div className="flex items-center justify-center gap-4">
                <p className="text-white font-bold">{question.position}:</p>
                <div className="flex gap-2"><PlayingCard card={question.hand[0]} /><PlayingCard card={question.hand[1]} /></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "secondary"}
                className={`h-16 text-lg ${selectedAnswer === index ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
                disabled={showExplanation}
              >
                {option}
              </Button>
            ))}
          </div>

          {!showExplanation && showHint > 0 && question[`hint${showHint}`] && (
            <div className="bg-blue-900/30 rounded-xl p-4 mb-6"><p className="text-blue-200"><strong>Hint:</strong> {question[`hint${showHint}`]}</p></div>
          )}

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${selectedAnswer === question.correct ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {selectedAnswer === question.correct ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{question.feedback || question.explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Logic for hints: display hint button only if not showing explanation and hints are available */}
            {!showExplanation && question.hint1 && showHint === 0 && (
                <Button onClick={() => setShowHint(1)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20">Need a Hint?</Button>
            )}
            {!showExplanation && question.hint2 && showHint === 1 && (
                <Button onClick={() => setShowHint(2)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20">Need another Hint?</Button>
            )}
            {(!question.hint1 || showHint === 2 || showExplanation) && (
                <div></div>
            )}

            {!showExplanation ? (
              <Button onClick={() => setShowExplanation(true)} disabled={selectedAnswer === null} className="bg-green-600 hover:bg-green-700 text-white">Submit Answer</Button>
            ) : (
              <Button onClick={() => {
                if (currentQuestion < questions.length - 1) {
                  setCurrentQuestion(q => q + 1);
                  resetQuestionState();
                } else {
                  setCurrentStage(nextStage);
                  setCurrentQuestion(0);
                  resetQuestionState();
                }
              }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Continue'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => {
    // Removed score and pass/fail logic
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Congratulations!</h2>
          <div className="bg-white/10 rounded-xl p-6 mb-8 text-center">
             <p className="text-green-400 font-bold text-lg">You have completed the Power of Position Game!</p>
          </div>
          <p className="text-green-200 text-lg mb-8">
            You now understand how acting last gives you a decisive strategic advantage. With this knowledge, you can identify when you hold positional power and adjust your strategy to extract more value. Keep practicing these insights, and you’ll consistently turn position into profit at the table!
          </p>
          <Button onClick={() => completeGame()} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Return to Home <ArrowRight className="ml-2 w-5 h-5" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Back to Home</Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={currentStage + '-' + currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            {currentStage === 'intro' && renderIntro()}
            {currentStage === 'explanation' && renderExplanation()}
            {currentStage === 'gameIntro' && renderGameIntro()}
            {currentStage === 'gameIntroInstructions' && renderGameIntroInstructions()}
            {currentStage === 'stage1' && renderStage1()}
            {currentStage === 'stage2' && renderQuestionStage(stage2Questions, "Stage 2: Guided Practice", "stage3")}
            {currentStage === 'stage3' && renderQuestionStage(stage3Questions, "Stage 3: Independent Practice", "completion")}
            {currentStage === 'completion' && renderCompletion()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
