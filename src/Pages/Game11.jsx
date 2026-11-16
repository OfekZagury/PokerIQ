
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Info, Target, Zap, Users, ThumbsDown, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

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

export default function Game11() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1); // 1 for next, -1 for previous
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [finalStageScore, setFinalStageScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(20);
  const [user, setUser] = useState(null);
  const gameId = 11;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  const explanationSlides = [
    { title: "The Power of Position: Pre-Flop Hand Selection", content: "Poker is not just about the cards you hold; your position at the table is a crucial strategic element. Your position determines when you act relative to other players, which directly impacts the information you have available before making a decision. The later you act in a betting round, the more information you gain from your opponents' actions. This mini-game focuses on how your position should influence your starting hand selection, particularly emphasizing a tight strategy in early positions." },
    { title: "Part A: Understanding Position and Information Advantage", content: "In Texas Hold'em, your position is fixed for the entire hand. The player with the dealer button (often called the 'BTN') acts last in every betting round except the first. Acting last, also known as being in late position, is 'almost always advantageous' because you get to see what most of your opponents do before you have to make your decision. This provides you with an information advantage. Conversely, acting early means you have less information, as many players are yet to act after you. This concept of 'who acts after me?' is fundamental to profitable play. " },
    { title: "Part B: The Principle of Early-Position Tightness", content: "Early position includes the players who act first after the blinds, such as 'Under the Gun' (UTG). When in early position, you are forced to act with less information than most other players. This lack of information makes it difficult to play marginal hands profitably. Therefore, winning poker requires discipline in throwing away poor starting hands, especially from early positions, to avoid costly mistakes over time. The objective in poker is to win money, not pots, and being selective about the hands you play is essential." },
    { title: "Part B: The Principle of Early-Position Tightness", content: "Consider this example from the sources: Always defending your small blind in Hold'em with a 'throwaway hand' like 7♠ 2♦ could lead to an approximate loss of $5,000 over 1,000 hours of play. This illustrates that even small, frequent errors, like playing too loosely from early position, 'add up fast'. " },
    { title: "Part C: Pre-Flop Hand Selection Guidelines by Position", content: "Your starting standards—the hands you decide to play pre-flop—are critically important because initial choices predicate subsequent decisions in a hand. Early Position (High Selectivity Required): In early position, where you act before most opponents, you must play a tighter range of hands to mitigate your information disadvantage . " },
    {
      title: "Part C2: Pre-Flop Hand Selection Guidelines by Position",
      content: "Middle and Late Position (Increased Playability): As you move to middle and late positions, acting after more opponents provides you with more information. This positional power allows you to play a wider variety of hands profitably. Hands that would be folded in early position can become raising hands in late position if the pot hasn't been raised. However, even in late position, marginal hands (referred to as bargain basement specials) should be approached with caution and typically released if the flop brings anything less than an abundant harvest of friendly cards. We will now see  detailed lists of playable hands for middle and late positions."
    },
    {
      title: "Playable Hands: Early Position",
      content: "These would be suitable hands to play with Early position: Pairs: 77+, Suited: T9o And better, Offsuit: KJs And better",
      details: {
        "Pairs": ["77", "88", "99", "TT", "JJ", "QQ", "KK", "AA"],
        "Suited": ["AKs", "AQs", "AJs", "A10s", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs", "J9s", "T9s"],
        "Offsuit": ["AKo", "AQo", "AJo", "ATo", "KQo", "KJo"]
      }
    },
    {
      title: "Playable Hands: Middle Position",
      content: "These would be suitable hands to play with Middle position, In addition to those of early position: Pairs: 55+, Suited: 98o And better, Offsuit: JTs and better",
      details: {
        "Pairs": ["55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA"],
        "Suited": ["A9s", "A8s", "A7s", "A6s", "K9s", "Q9s", "Q8s", "J9s", "T8s", "98s"],
        "Offsuit": ["KTo", "QTo", "JTo", "QKo"]
      }
    },
    {
      title: "Playable Hands: Late Position",
      content: "These would be suitable hands to play with Late position, In addition to those of early and mid position, Pairs: All pocket pairs, Suited: 54o And better, Offsuit: 87s And better ",
      details: {
        "Pairs": ["22", "33", "44", "55", "66", "77", "88", "99", "TT", "JJ", "QQ", "KK", "AA"],
        "Suited": ["A5s", "A4s", "A3s", "A2s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "Q7s", "T7s", "97s", "96s", "87s", "86s", "76s", "75s", "65s", "54s"],
        "Offsuit": ["K9o", "Q9o", "J9o", "J8o", "T9o", "T8o", "98o", "97o", "87o"]
      }
    }
  ];

  const stage2Questions = [
    { hand: ["7♠", "2♦"], position: "UTG", options: ["Fold", "Call", "Raise"], correct: 0, hint: "Remember the principle of early-position tightness. You have very little information, and this is considered the worst starting hand in poker. Is it strong enough to play when acting first?" },
    { hand: ["K♥", "Q♥"], position: "MP", options: ["Fold", "Call", "Raise"], correct: 2, hint: "In middle position, you have more information. King-Queen suited is a strong, playable hand. How can you best use its strength in an unraised pot?" },
    { hand: ["K♦", "2♦"], position: "BTN", options: ["Fold", "Call", "Raise"], correct: 1, hint: "You're in late position with a significant information advantage. This allows you to play a wider variety of hands. While K-2 suited is weak, is it worth seeing a cheap flop from the best position?" }
  ];

  const stage3Questions = [
    { hand: ["7♦", "7♣"], position: "UTG", correct: "Raise", explanation: " A pair of Sevens or higher is a strong early-position hand worth raising to build the pot and narrow the field." },
    { hand: ["Q♠", "J♣"], position: "Middle Position", correct: "Call", explanation: " Q-J offsuit is a solid hand in middle position, allowing you to call or raise depending on the action before you." },
    { hand: ["J♥", "7♥"], position: "Cutoff", correct: "Call", explanation: " J-7 suited can be played profitably from late position in unraised pots due to your positional advantage. Fold if the flop isn't favorable." },
    { hand: ["A♣", "9♦"], position: "Early position", correct: "Fold", explanation: " Ace-Nine offsuit is a marginal hand that is generally not strong enough to play from middle position. Focus on stronger hands to avoid costly mistakes." }
  ];

  const finalChallengeQuestions = React.useMemo(() => [
    { hand: ["K♠", "K♦"], position: "UTG", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 2, feedback: "Pair of Kings is an extremely strong hand. In early position, it is essential to build the pot and protect your value by raising." },
    { hand: ["6♠", "6♦"], position: "UTG", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "Although a pair of sixes can be playable in later positions, it's too marginal for early position where you have limited information." },
    { hand: ["A♣", "K♣"], position: "Early positio", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 2, feedback: "Ace-King Suited is a premium hand. In middle position, raising is a great way to build the pot and isolate opponents." },
    { hand: ["J♠", "9♦"], position: "Middle Position", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "Jack-Nine offsuit is a marginal hand not strong enough for middle position. Folding is the disciplined play." },
    { hand: ["A♥", "8♥"], position: "BTN", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 1, feedback: "Ace-Eight suited is a good speculative hand to play in late position. You can see a cheap flop and capitalize on your information advantage." },
    { hand: ["Q♠", "Q♦"], position: "Cutoff", potStatus: "UTG Raised", options: ["Fold", "Call", "Raise"], correct: 2, feedback: "Pair of Queens is an extremely strong hand. Facing a raise, reraising (Raise) from late position is the best way to extract value." },
    { hand: ["9♥", "7♥"], position: "BTN", potStatus: "UTG Raised", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "While 9-7 suited is playable in an unraised pot from the button, it's not strong enough to call a raise from early position." },
    { hand: ["A♠", "J♠"], position: "UTG", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 2, feedback: "Ace-Jack suited is a very strong hand. Even from early position, raising is the standard action to build the pot." },
    { hand: ["K♠", "10♦"], position: "Late Position", potStatus: "UTG Raised", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "King-Ten offsuit is playable in an unraised pot but becomes too marginal when facing a raise from early position." },
    { hand: ["7♣", "3♦"], position: "Cutoff", potStatus: "Unraised", options: ["Fold", "Call", "Raise"], correct: 0, feedback: "Despite the position advantage, very weak hands like 7-3 offsuit are still unprofitable. Folding prevents cumulative losses." },
    { hand: ["5♥", "4♥"], position: "BTN", potStatus: "1 Limper", options: ["Fold", "Call", "Raise"], correct: 1, feedback: "Five-Four suited is a great speculative hand. With one limper, you can call to see a cheap flop and potentially hit a monster hand from the best position." }
  ], []);

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
  }, []);

  const resetFinalChallengeState = useCallback(() => {
    resetQuestionState();
    setTimeLeft(20);
  }, [resetQuestionState]);

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

  const handleFinalStageNext = useCallback((timeOut = false) => {
    setShowExplanation(true);

    if (!timeOut && selectedAnswer === finalChallengeQuestions[currentQuestion].correct) {
      setFinalStageScore(s => s + 1);
    } else if (timeOut || selectedAnswer !== finalChallengeQuestions[currentQuestion].correct) {
      setLives(l => l - 1);
    }

    setTimeout(() => {
      // The 'lives > 1' check is intentional. If lives is 1 and user gets it wrong, it becomes 0.
      // The check here uses the value of 'lives' from the closure (which was 1), so '1 > 1' is false,
      // correctly ending the game.
      if (currentQuestion < finalChallengeQuestions.length - 1 && lives > 1) {
        setCurrentQuestion(q => q + 1);
        resetFinalChallengeState();
      } else {
        setCurrentStage('completion');
      }
    }, 2000); // Show explanation for 2 seconds
  }, [selectedAnswer, currentQuestion, lives, finalChallengeQuestions, resetFinalChallengeState]);

  useEffect(() => {
    if (currentStage !== 'final' || showExplanation) return;

    if (timeLeft <= 0 || lives <= 0) {
      handleFinalStageNext(true); // timeOut = true
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000); // Changed to 1 second for accurate countdown
    return () => clearTimeout(timer);
  }, [currentStage, timeLeft, lives, showExplanation, handleFinalStageNext]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const completeGame = async (passed) => {
    if (!user) return;
    if (passed) {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = timer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      try {
        await User.completeGame(11);
      } catch (e) {
        console.error("Failed to update user data", e);
      }
    }
    navigate(createPageUrl("Home"));
  };

  const handleNextQuestion = (questions, nextStage) => {
    resetQuestionState();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setCurrentStage(nextStage);
      setCurrentQuestion(0);
    }
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Users className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Game 11: Hand Selection by Position</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">Mastering Pre-Flop Strategy</h2>
        <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Start Learning <ArrowRight className="ml-2 w-5 h-5" /></Button>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: slideDirection * 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slideDirection * 300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
              <div className="text-center mb-8"><h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2></div>
              <div className="bg-white/10 rounded-xl p-6 mb-6 min-h-[200px] flex items-center justify-center">
                <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
              </div>
              {slide.details && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-4">
                    {Object.entries(slide.details).map(([category, hands]) => (
                        <div key={category} className="bg-black/20 p-3 rounded-lg">
                            <h4 className="font-bold text-yellow-400 mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {hands.map(hand => <span key={hand} className="text-xs bg-gray-700 text-white px-2 py-1 rounded">{hand}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
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
        <h2 className="text-3xl font-bold text-white mb-6">Position Power: Spot the Winning Pre-Flop Hand</h2>
        <div className="bg-yellow-400/10 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
          <p className="text-green-200">Accurately select optimal pre-flop starting hands for Early, Middle, and Late positions by applying the principle of positional information advantage.</p>
        </div>
        <Button onClick={() => setCurrentStage('stage2Intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Begin Game <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderStage2Intro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Stage 2: Guided Practice</h2>
        <div className="bg-green-900/30 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">What You'll Do:</h3>
          <p className="text-green-200 mb-4">
            Now it's time to practice! You'll be presented with different poker hands and positions,
            and you'll need to choose the optimal action: Fold, Call, or Raise.
          </p>
          <p className="text-green-200 mb-4">
            Don't worry - you'll have hints available if you need them, and detailed explanations
            will help you understand the reasoning behind each correct answer.
          </p>
          <p className="text-yellow-200 text-sm">
            <strong>Tip:</strong> Think about your position and the information advantage it provides before making your decision.
          </p>
        </div>
        <Button
          onClick={() => { setCurrentStage('stage2'); resetQuestionState(); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Start Practice
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderStage3Intro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Stage 3: Independent Practice</h2>
        <div className="bg-purple-900/30 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">Final Practice Round:</h3>
          <p className="text-green-200 mb-4">
            This is your chance to demonstrate what you've learned! You'll face more challenging
            scenarios without hints, relying on your understanding of position-based hand selection.
          </p>
          <p className="text-green-200 mb-4">
            Apply the principles you've learned: tight play in early position, expanding your range
            in middle position, and taking advantage of late position opportunities.
          </p>
          <p className="text-red-200 text-sm">
            <strong>Challenge:</strong> No hints available - trust your knowledge!
          </p>
        </div>
        <Button
          onClick={() => { setCurrentStage('stage3'); resetQuestionState(); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
        >
          Final Practice
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderFinalChallengeIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
        <h2 className="text-3xl font-bold text-white mb-6">Final Challenge</h2>
        <div className="bg-red-900/30 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-xl font-bold text-white mb-4">The Ultimate Test:</h3>
          <p className="text-green-200 mb-4">
            This is the final challenge! You'll face time pressure and have limited lives.
            Each question must be answered within 20 seconds, and wrong answers cost you a life.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-bold mb-2">Rules:</h4>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• 20 seconds per question</li>
                <li>• 3 lives total</li>
                <li>• No hints available</li>
                <li>• Must score 70% to pass</li>
              </ul>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-yellow-400 font-bold mb-2">Focus On:</h4>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• Position-based decisions</li>
                <li>• Pot status awareness</li>
                <li>• Quick, confident choices</li>
                <li>• Trust your training</li>
              </ul>
            </div>
          </div>
          <p className="text-yellow-200 text-center font-bold">
            Are you ready to prove your mastery?
          </p>
        </div>
        <Button
          onClick={() => { setCurrentStage('final'); resetQuestionState(); setFinalStageScore(0); setLives(3); }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 text-lg"
        >
          Accept Challenge
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const renderQuestionStage = (questions, stageTitle, nextStage) => {
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === (typeof question.correct === 'number' ? question.correct : (question.options?.indexOf(question.correct) ?? -1));

    return (
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
              <h2 className="text-3xl font-bold text-white text-center mb-2">{stageTitle}</h2>
              <p className="text-center text-green-300 mb-8">Question {currentQuestion + 1} of {questions.length}</p>

              <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
                <div className="flex justify-center items-center gap-4 mb-4">
                  <p className="text-green-200">Hand: </p>
                  {question.hand.map(c => <PlayingCard key={c} card={c} />)}
                  <p className="text-green-200 ml-4">Position: <span className="font-bold text-yellow-400">{question.position}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {question.options.map((option, index) => (
                  <Button key={index} variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "secondary"} className={`h-16 text-lg ${selectedAnswer === index ? '' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => !showExplanation && setSelectedAnswer(index)} disabled={showExplanation}>
                    {option}
                  </Button>
                ))}
              </div>

              {!showExplanation && showHint && (
                <div className="bg-blue-900/30 rounded-xl p-4 mb-6 text-blue-200"><strong>Hint:</strong> {question.hint}</div>
              )}

              {showExplanation && (
                <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
                  <div className="flex items-center gap-2 mb-3">
                    {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                    <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                  </div>
                  <p className="text-green-200">{question.explanation || (isCorrect ? `In this position, ${question.options[question.correct]} is the optimal play.` : `Incorrect, In this position ${question.options[question.correct]} is the optimal play.`)}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                {!showExplanation && question.hint && !showHint && stageTitle.includes("Guided") ? <Button onClick={() => setShowHint(true)} variant="outline" className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"><ShieldQuestion className="w-4 h-4 mr-2" /> Hint</Button> : <div></div>}
                {!showExplanation ? (
                  <Button onClick={() => setShowExplanation(true)} disabled={selectedAnswer === null} className="bg-green-600 hover:bg-green-700 text-white ml-auto">Submit Answer</Button>
                ) : (
                  <Button onClick={() => handleNextQuestion(questions, nextStage)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold ml-auto">Next <ArrowRight className="ml-2 w-5 h-5" /></Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderFinalChallenge = () => {
    const question = finalChallengeQuestions[currentQuestion];
    const isAnswerCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-white">Final Challenge</h2>
                <div className="flex gap-2 items-center text-red-400 font-bold">
                  {[...Array(3)].map((_, i) => <Zap key={i} className={i < lives ? 'fill-current' : 'opacity-30'} />)}
                </div>
              </div>
              <div className="mb-4"><Progress value={(timeLeft / 20) * 100} className="w-full h-2 bg-red-400" /></div>

              <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
                <p className="text-green-200 mb-2">{question.potStatus}</p>
                <div className="flex justify-center items-center gap-4 mb-4">
                  <p className="text-green-200">Hand: </p>
                  {question.hand.map(c => <PlayingCard key={c} card={c} />)}
                  <p className="text-green-200 ml-4">Position: <span className="font-bold text-yellow-400">{question.position}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {question.options.map((option, index) => (
                  <Button key={index} variant="secondary" className={`h-16 text-lg ${showExplanation && selectedAnswer === index ? (isAnswerCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700') : 'bg-yellow-500 hover:bg-white/20 text-black'}`} onClick={() => !showExplanation && setSelectedAnswer(index)} disabled={showExplanation}>
                    {option}
                  </Button>
                ))}
              </div>

              {showExplanation && (
                <div className={`rounded-xl p-6 mb-6 ${isAnswerCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
                  <div className="flex items-center gap-2 mb-3">
                    {isAnswerCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                    <h3 className="text-xl font-bold text-white">{isAnswerCorrect ? 'Correct!' : `Incorrect! Lives left: ${lives}`}</h3>
                  </div>
                  <p className="text-green-200">{question.feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
              {!showExplanation && (
                  <Button onClick={() => handleFinalStageNext()} disabled={selectedAnswer === null} className="bg-red-600 hover:bg-red-700 text-white">Confirm Decision</Button>
              )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const renderCompletion = () => {
    const totalQuestions = finalChallengeQuestions.length;
    const passed = (finalStageScore / totalQuestions) >= 0.7;

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">{lives > 0 ? "Challenge Complete!" : "Game Over"}</h2>

          <div className="bg-white/10 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Your Score: {finalStageScore} / {totalQuestions}</h3>
            {passed ? (
              <p className="text-green-400 font-bold text-lg">You passed! You've mastered Hand Selection by Position.</p>
            ) : (
              <p className="text-red-400 font-bold text-lg">You didn't pass this time. Review the concepts and try again!</p>
            )}
          </div>

          {passed && (
            <p className="text-green-200 text-lg mb-8">
              Congratulations! You now master the selection of optimal pre-flop starting hands for various positions.
              This knowledge is a significant advantage at the poker tables. Keep practicing what you have learned!
            </p>
          )}

          <Button onClick={() => completeGame(passed)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
            Return to Home <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  const getStageContent = () => {
    switch (currentStage) {
      case 'intro': return renderIntro();
      case 'explanation': return renderExplanation();
      case 'gameIntro': return renderGameIntro();
      case 'stage2Intro': return renderStage2Intro();
      case 'stage2': return renderQuestionStage(stage2Questions, "Stage 2: Guided Practice", "stage3Intro");
      case 'stage3Intro': return renderStage3Intro();
      case 'stage3': return renderQuestionStage(stage3Questions.map(q => ({...q, options: ["Fold", "Call", "Raise"]})), "Stage 3: Independent Practice", "finalIntro");
      case 'finalIntro': return renderFinalChallengeIntro();
      case 'final': return renderFinalChallenge();
      case 'completion': return renderCompletion();
      default: return renderIntro();
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Back to Home</Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            {getStageContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
