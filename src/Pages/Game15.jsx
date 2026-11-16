import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Gift, Target, ThumbsDown, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
  {
    title: "The Free Card: Introduction ",
    content: "The concept of a free card is fundamental in poker, particularly in games like five-card draw, seven-card stud, and Hold 'em, where there are multiple betting rounds. A free card is defined as a card received without requiring a player to place a bet. Understanding when to give or take a free card is crucial for maximizing your expectation in poker.",
    icon: Gift
  },
  {
    title: "Part A: Understanding the Free Card Concept",
    content: "At its core, the free card concept revolves around the idea that if you have the best hand, you generally do not want to give opponents a free card, as it allows them a chance to outdraw you and win the pot without cost. Conversely, if you currently hold a weaker hand and need to improve, you ideally want to receive a free card. This strategy helps in minimizing your losses or maximizing your potential gains, as you pay nothing to see if your hand improves.",
    icon: UserCheck
  },
  {
    title: "Part B: Giving a Free Card (When You Have the Best Hand)",
    content: "When you believe you have the best hand, the general rule is to bet, thereby forcing your opponents to pay to see the next card or fold. Giving a free card, such as by checking when you could bet, is often considered \"uncooperative\" because it reduces your mathematical expectation. For instance, if there's $50 in the pot and you bet $10, your opponent is getting 6-to-1 odds on their call. If they are a 5-to-1 underdog, they should call, illustrating that you want to make them pay to draw. ",
    icon: Target
  },
  {
    title: "Part B: Giving a Free Card (When You Have the Best Hand)",
    content: "It is almost never correct to give a free card in large pots, and rarely correct in medium-sized pots. It is almost always incorrect to bet when you have a decent hand and you think it is the best one. Deciding whether to bet a marginal hand to deny a free card involves considering factors like your chance of having the best hand, the likelihood the next card improves your opponent's hand if they fold, the pot size, and your chances of outdrawing a better hand that might call. ",
    icon: Target
  },
  {
    title: "Part C: Getting a Free Card (When You Need to Improve)",
    content: "If your hand is not yet the best, but has potential for improvement (e.g., a draw), the objective is often to get a free card. This is achieved by checking on an earlier betting round, hoping that opponents will also check behind you, thus allowing you to see the next card without having to call a bet. For example, if you hold two jacks on a board like Ten of Spades, Ten of Clubs, Three of Hearts, you should bet to win the pot immediately and deny opponents a free card ",
    icon: Target
  },
  {
    title: "Part C: Getting a Free Card (When You Need to Improve)",
    content: "checking allows them a chance to outdraw you or bluff you if an overcard falls. However, if giving a free card might lead your opponent to bet you out, or if you suspect they have a very strong hand, this strategy might not be advisable.",
    icon: Target
  },
  {
    title: "Part D: The Impact of Position on Free Cards",
    content: "Position is a critical factor influencing decisions around free cards. When you are in first position (acting first), checking might enable opponents to check behind you, effectively giving yourself a free card. Conversely, when you are in last position (acting last), you have the advantage of seeing what your opponents do first. If they check, you can choose to check and receive a free card, or bet if you think it's profitable. This positional advantage allows for more informed decisions on whether to give or take a free card, making it a key element of strategic play. ",
    icon: Target
  }
];

const practiceQuestions = [
  {
    board: ["K♥", "8♠", "7♥"],
    hand: ["A♥", "J♥"],
    scenario: "You are on the button with the nut flush draw. An opponent in middle position bets, and you call. The turn is the 2♣. Your opponent checks.",
    question: "What is the best strategic play here?",
    options: ["Bet (semi-bluff)", "Check (take a free card)"],
    correct: 1,
    explanation: "Check. By checking behind, you get to see the river card for free, giving you another chance to hit your powerful flush draw without any additional cost."
  },
  {
    board: ["Q♦", "J♦", "5♣"],
    hand: ["Q♠", "J♠"],
    scenario: "You have top two pair on a board with a clear flush draw. You are out of position and it's your turn to act.",
    question: "What is your primary goal?",
    options: ["Check and hope they don't bet", "Bet to prevent a free card"],
    correct: 1,
    explanation: "Bet. You must bet to charge opponents with flush draws. Checking is dangerous as it gives them a free chance to hit their hand and potentially beat your two pair."
  },
  {
    scenario: "",
    hand: [],
    question: "In which situation is 'giving a free card' the biggest mistake?",
    options: ["When you have the nuts", "When you have a weak drawing hand", "With strong, vulnerable hand on a wet board"],
    correct: 2,
    explanation: "Giving a free card is most dangerous when you have a strong but vulnerable hand (like a set or two pair) on a coordinated 'wet' board, as it gives opponents the chance to outdraw you for free."
  }
];

const finalChallengeQuestions = [
  {
    hand: ["A♠", "10♠"],
    board: ["K♠", "Q♠", "4♦"],
    position: "In Position",
    action: "Opponent checks to you",
    question: "You have the nut flush draw. Take a free card?",
    options: ["Yes, check behind", "No, bet"],
    correct: 0,
    feedback: "Checking behind is the perfect play. You're in position and get to see the next card for free to potentially hit your nut flush."
  },
  {
    hand: ["8♦", "8♣"],
    board: ["8♠", "J♥", "Q♥"],
    position: "Out of Position",
    action: "It's your turn to act",
    question: "You have a set on a very wet board. Give a free card?",
    options: ["Yes, check", "No, bet"],
    correct: 1,
    feedback: "You must bet to protect your hand. Checking gives opponents with flush or straight draws a free chance to outdraw your set."
  },
  {
    hand: ["A♦", "K♦"],
    board: ["10♦", "J♦", "Q♠"],
    position: "Out of Position",
    action: "It's your turn to act",
    question: "You have the nut straight. Give a free card?",
    options: ["Yes, checking is fine", "No, you must bet"],
    correct: 0,
    feedback: "You have the nuts, so you cannot be outdrawn. Checking here is a valid option, as it can be part of a slow-playing strategy to disguise the strength of your hand."
  },
  {
    hand: ["K♠", "Q♠"],
    board: ["K♥", "Q♥", "5♦"],
    position: "Out of Position",
    action: "It's your turn",
    question: "Two pair on a board with a flush draw. Give a free card?",
    options: ["Yes, it's a strong hand", "No, bet for value and protection"],
    correct: 1,
    feedback: "This is a classic value/protection bet. You must charge flush draws to continue, preventing them from seeing a free card."
  },
  {
    hand: ["A♣", "7♣"],
    board: ["K♣", "9♣", "2♦"],
    position: "In Position",
    action: "Opponent checks to you",
    question: "Nut flush draw. Take a free card?",
    options: ["Yes, check", "No, semi-bluff"],
    correct: 0,
    feedback: "While a semi-bluff is also a possible play, taking a free card with such a strong draw when in position is often the most standard and profitable line."
  }
];

const StageDivider = ({ title, description, onContinue }) => (
    <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl"
      >
        <h2 className="text-4xl font-bold text-yellow-400 mb-6">{title}</h2>
        {description && <p className="text-green-200 text-lg mb-8">{description}</p>}
        <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
          Continue <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </div>
);

export default function Game15() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [user, setUser] = useState(null);
  const gameId = 15;
  const navigate = useNavigate();
  const timer = useActiveStopwatch();
  const completedRef = React.useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("User not loaded.", error);
      }
    };
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

  const completeGame = async (passed) => {
    if (!user) return;

    if (passed) {
      const today = new Date().toISOString().split('T')[0];
      completedRef.current = true;
      const spentSec = timer.readSeconds();
      track("Game Completed", { gameId, spentSec });
      await User.completeGame(15);
    }
    navigate(createPageUrl("Home"));
  };

  const handleNext = (isPractice) => {
    const questions = isPractice ? practiceQuestions : finalChallengeQuestions;
    const nextStage = isPractice ? 'final_challenge_intro' : 'completion';

    setShowExplanation(false);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setCurrentStage(nextStage);
      setCurrentQuestion(0);
    }
  };

  const handleAnswer = (isPractice) => {
    const questions = isPractice ? practiceQuestions : finalChallengeQuestions;
    const question = questions[currentQuestion];

    if (showExplanation) {
      handleNext(isPractice);
      return;
    }

    if (selectedAnswer === question.correct) {
      if (!isPractice) {
        setFinalScore(s => s + 1);
      }
    }
    setShowExplanation(true);
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
        <Gift className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Game 15: Free Card Strategy</h1>
        <h2 className="text-2xl font-semibold text-green-300 mb-6">Free Card Frenzy: Can You Spot the Winning Play?</h2>
        <p className="text-green-200 text-lg mb-8">
          Master the art of giving and taking free cards based on hand strength and position.
        </p>
        <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">Start Learning <ArrowRight className="ml-2 w-5 h-5" /></Button>
      </div>
    </div>
  );

  const renderExplanation = () => {
    const slide = explanationSlides[currentSlide];
    const Icon = slide.icon;
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
          <div className="text-center mb-6">
            <Icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
          </div>
          <div className="bg-white/10 rounded-xl p-6 min-h-[150px] flex items-center">
            <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-6">
          <Button onClick={() => setCurrentSlide(s => Math.max(0, s - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
          <div className="flex gap-2">
            {explanationSlides.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700'}`}></button>
            ))}
          </div>
          {currentSlide < explanationSlides.length - 1 ? (
            <Button onClick={() => setCurrentSlide(s => s + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
          ) : (
            <Button onClick={() => { setCurrentStage('practice_intro'); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Practice <ArrowRight className="ml-2 w-4 h-4" /></Button>
          )}
        </div>
      </div>
    );
  };

  const renderQuestion = (isPractice) => {
    const questions = isPractice ? practiceQuestions : finalChallengeQuestions;
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    return (
      <div className="max-w-4xl mx-auto">
        <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${isPractice ? 'border-green-600/30' : 'border-red-600/30'}`}>
          <h2 className="text-3xl font-bold text-white text-center mb-2">{isPractice ? 'Practice Round' : 'Final Challenge'}</h2>
          <p className="text-center text-green-300 mb-6">Question {currentQuestion + 1} of {questions.length}</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            {question.scenario && <p className="text-green-200 text-lg text-center mb-4">{question.scenario}</p>}
            {question.board && question.board.length > 0 && (
              <div className="flex justify-center items-center gap-4 mb-4">
                <p className="text-white font-bold">Board:</p>
                <div className="flex gap-2">
                  {question.board.map(card => <PlayingCard key={card} card={card} />)}
                </div>
              </div>
            )}
            {question.hand && question.hand.length > 0 && (
              <div className="flex justify-center items-center gap-4">
                <p className="text-white font-bold">Your Hand:</p>
                <div className="flex gap-2">
                  {question.hand.map(card => <PlayingCard key={card} card={card} />)}
                </div>
              </div>
            )}
            <h4 className="text-xl font-bold text-white text-center mt-6">{question.question}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "secondary"}
                className="h-16 text-lg bg-white/10 hover:bg-white/20"
                onClick={() => !showExplanation && setSelectedAnswer(index)}
                disabled={showExplanation}
              >
                {option}
              </Button>
            ))}
          </div>

          {showExplanation && (
            <div className={`rounded-xl p-6 mb-6 ${isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} border`}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-6 h-6 text-green-400" /> : <ThumbsDown className="w-6 h-6 text-red-400" />}
                <h3 className="text-xl font-bold text-white">{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
              </div>
              <p className="text-green-200">{isPractice ? question.explanation : question.feedback}</p>
            </div>
          )}

          <div className="text-center mt-4">
            <Button
              onClick={() => handleAnswer(isPractice)}
              disabled={selectedAnswer === null && !showExplanation}
              className={`px-8 py-3 text-lg ${showExplanation ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-yellow-500 hover:bg-yellow-600 text-black"}`}
            >
              {showExplanation ? 'Next' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompletion = () => {
    const passed = finalScore >= 4;

    const retryChallenge = () => {
        setCurrentStage('final_challenge');
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setFinalScore(0);
    };

    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${passed ? 'border-green-600/30' : 'border-red-600/30'}`}>
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">{passed ? "Congratulations!" : "Challenge Complete"}</h2>

          <div className="bg-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Your Score: {finalScore} / {finalChallengeQuestions.length}</h3>
            <p className={`font-bold text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
              {passed ? "Excellent! You've mastered the free card strategy." : "You need at least 4 correct answers to pass. Keep practicing!"}
            </p>
          </div>

          {passed ? (
              <>
                <p className="text-green-200 text-lg mb-8">
                    You now know when to take a free card to realize your equity and when to bet to prevent your opponents from outdrawing you.
                </p>
                <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                    Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </>
          ) : (
              <>
                 <p className="text-red-200 text-lg mb-8">
                    Mastering the 'Free Card' principle is key. Review the concepts and try the challenge again.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={retryChallenge} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 text-lg">
                         Try Again
                     </Button>
                    <Button onClick={() => completeGame(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 text-lg">
                         Return to Home
                     </Button>
                </div>
              </>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStage) {
      case 'intro': return renderIntro();
      case 'explanation': return renderExplanation();
      case 'practice_intro': return <StageDivider title="Practice Round" description="Let's practice what you've learned to solidify your understanding." onContinue={() => {setCurrentStage('practice'); setCurrentQuestion(0);}} />;
      case 'practice': return renderQuestion(true);
      case 'final_challenge_intro': return <StageDivider title="Final Challenge" description="Now, put your knowledge to the ultimate test!" onContinue={() => {setCurrentStage('final_challenge'); setCurrentQuestion(0);}} />;
      case 'final_challenge': return renderQuestion(false);
      case 'completion': return renderCompletion();
      default: return renderIntro();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto mb-6">
        <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage + (currentStage === 'explanation' ? currentSlide : currentQuestion)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
