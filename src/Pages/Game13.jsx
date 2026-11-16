
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, ThumbsDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Introduction: Flop Defines the Hand — Fold Guideline When We Miss",
        content: "The flop is considered the defining moment in Texas Hold'em, as it reveals 71 percent of your hand for the cost of only a single round of betting. \n" +
            "In this mini-game, you'll learn to quickly assess if the flop strengthens your hand enough to continue playing or if it's time to save your chips and fold.\n",
        icon: Eye
    },
    {
        title: "Part A: The Flop as the Defining Moment",
        content: "In Texas Hold'em, the flop is considered the game's defining moment. It's when three communal cards are simultaneously turned face up in the center of the table, immediately after the first round of betting. At this point, you are looking at five out of the seven cards that will eventually form your best possible five-card poker hand (your two private cards plus the three communal cards). This means 71 percent of your hand is defined on the flop. Crucially, the cost to see this significant portion of your hand is only a single round of betting. This makes the flop a critical decision point where you gain a large amount of information for a relatively small initial investment.",
        icon: Target
    },
    {
        title: "Part B: The 'Fit or Fold' Principle",
        content: "The fundamental principle for playing the flop in Hold'em is \"fit or fold\". This means that if the flop does not fit your hand by strengthening it or offering a very strong draw, you should generally release it (fold) immediately. Ignoring this principle and continuing to play long-shot holdings after the flop is a sure way to lose money. While it's human nature to want to play every hand, winning poker requires selectivity. Even strong initial two-card holdings can be rendered nearly worthless by an unfavorable flop. When in doubt, it costs less to err on the side of caution.",
        icon: Eye
    },
    {
        title: "Part C: Recognizing a \"Fit\" A flop \"fits\" your hand if one of three conditions is met: Condition 1",
        content: "It improves your hand significantly: For example, you were dealt a high pair (like Pocket Aces) and the flop includes a matching card (e.g., another Ace), giving you Three-of-a-kind. Or, you held Ace-King and the flop includes an Ace or King, giving you Top Pair with Top Kicker.",
        icon: Target
    },
    {
        title: "Part C: Recognizing a \"Fit\" A flop \"fits\" your hand if one of three conditions is met: Condition 2",
        content: "It offers a draw that figures to pay off handsomely if you hit it: This typically means a four-flush (four cards of the same suit) or an open-ended straight draw. These draws, especially nut flush draws or draws to the best possible straight, have a good chance of winning if completed and the pot is large enough to justify the draw.",
        icon: Target
    },
    {
        title: "Part C: Recognizing a \"Fit\" A flop \"fits\" your hand if one of three conditions is met: Condition 3",
        content: "You held a big pair before the flop: If you started with a powerful pair (e.g., Jacks or higher) and the flop does not present obvious dangers (like a paired board or three cards of the same suit), your hand may still be the best, even if it didn't improve. If none of these conditions are met, and you don't have a big hand or a draw with a nice potential payoff, you should fold.",
        icon: Target
    },
    {
        title: "Part D: The Cost of Missing the Flop ",
        content: "The financial implications of ignoring the \"fit or fold\" rule are significant. After the flop, the relationship between the betting and cards-to-come is reversed. You're now looking at spending 83 percent of the potential total cost of a hand for the remaining 29 percent of the cards. This means that a large portion of your investment in the hand comes after the flop, even though a much smaller percentage of the total cards will be dealt. Therefore, continuing with a hand that didn't connect strongly with the flop is statistically unprofitable in the long run. ",
        icon: ThumbsDown
    }
];

const finalChallengeQuestions = [
    {
        hand: ["A♠", "K♦"],
        board: ["K♥", "8♣", "3♠"],
        question: "Does this hand 'fit' the flop?",
        options: ["Yes, strong fit", "No, it's a fold"],
        correct: 0,
        feedback: "Yes. You've hit top pair with the best possible kicker. This is a very strong fit and a hand you should be looking to get value with."
    },
    {
        hand: ["7♣", "8♣"],
        board: ["5♦", "6♥", "A♠"],
        question: "Does this hand 'fit' the flop?",
        options: ["Yes, strong draw", "No, weak hand"],
        correct: 0,
        feedback: "Yes. You've flopped an open-ended straight draw (8 outs). This is a strong draw and a good fit to continue with."
    },
    {
        hand: ["A♠", "Q♦"],
        board: ["J♥", "8♣", "3♠"],
        question: "Does this hand 'fit' the flop?",
        options: ["Yes, I have overcards", "No, it's a fold"],
        correct: 1,
        feedback: "No. While you have two overcards, this is a very weak hand with no made value and no strong draw. According to the 'Fit or Fold' principle, this is a clear fold."
    },
    {
        hand: ["10♥", "10♦"],
        board: ["A♣", "K♦", "Q♠"],
        question: "You have pocket tens. Does your hand 'fit' this flop?",
        options: ["Yes, it's a pair", "No, too many overcards"],
        correct: 1,
        feedback: "No. Your pocket pair is now an underpair to three higher cards on the board. This is a dangerous situation and a very poor fit. It's a fold against any aggression."
    },
    {
        hand: ["A♥", "5♥"],
        board: ["K♥", "9♥", "2♠"],
        question: "Does this hand 'fit' the flop?",
        options: ["Yes, nut flush draw", "No, just ace-high"],
        correct: 0,
        feedback: "Yes. You've flopped the nut flush draw. This is a powerful draw and an excellent fit with the flop."
    },
    {
        hand: ["K♠", "J♠"],
        board: ["A♦", "Q♣", "10♥"],
        question: "Does this hand 'fit' the flop?",
        options: ["Yes, nut straight", "No, no pair"],
        correct: 0,
        feedback: "Yes! You've flopped the best possible hand, the nut straight. This is the ultimate 'fit'."
    }
];

export default function Game13() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [user, setUser] = useState(null);
  const gameId = 13;
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
            await User.completeGame(13);
        }
        navigate(createPageUrl("Home"));
    };

    const handleAnswer = () => {
        const question = finalChallengeQuestions[currentQuestion];
        if (showExplanation) {
            // Move to next question
            if (currentQuestion < finalChallengeQuestions.length - 1) {
                setCurrentQuestion(q => q + 1);
                setShowExplanation(false);
                setSelectedAnswer(null);
            } else {
                setCurrentStage('completion');
            }
        } else {
            // Check answer
            if (selectedAnswer === question.correct) {
                setFinalScore(s => s + 1);
            }
            setShowExplanation(true);
        }
    };

    const handleSlideChange = (newSlide) => {
        setSlideDirection(newSlide > currentSlide ? 1 : -1);
        setCurrentSlide(newSlide);
    };

    const renderIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <Target className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Game 13: Flop Defines the Hand</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Mastering the "Fit or Fold" Principle</h2>
                <p className="text-green-200 text-lg mb-8">
                    Learn to quickly assess if the flop strengthens your hand enough to continue playing or if it's time to save your chips and fold.
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
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: slideDirection * 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -slideDirection * 300 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                            <div className="text-center mb-6">
                                <Icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
                            </div>
                            <div className="bg-white/10 rounded-xl p-6 min-h-[150px] flex items-center">
                                <p className="text-green-200 text-lg leading-relaxed">{slide.content}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
                <div className="flex justify-between items-center mt-6">
                    <Button onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
                    <div className="flex gap-2">
                        {explanationSlides.map((_, index) => (
                            <button key={index} onClick={() => handleSlideChange(index)} className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700'}`}></button>
                        ))}
                    </div>
                    {currentSlide < explanationSlides.length - 1 ? (
                        <Button onClick={() => handleSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={() => { setCurrentStage('challenge'); setCurrentQuestion(0); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Challenge <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    )}
                </div>
            </div>
        );
    };

    const renderChallenge = () => {
        const question = finalChallengeQuestions[currentQuestion];
        const isCorrect = selectedAnswer === question.correct;

        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Fit or Fold Challenge</h2>
                    <p className="text-center text-red-300 mb-6">Question {currentQuestion + 1} of {finalChallengeQuestions.length}</p>
                    <Progress value={((currentQuestion + 1) / finalChallengeQuestions.length) * 100} className="mb-6" />


                    <div className="bg-white/5 rounded-xl p-6 mb-6">
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <p className="text-white font-bold">Board:</p>
                            <div className="flex gap-2">
                                {question.board.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <p className="text-white font-bold">Your Hand:</p>
                            <div className="flex gap-2">
                                {question.hand.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
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
                            <p className="text-green-200">{question.feedback}</p>
                        </div>
                    )}

                    <div className="text-center mt-4">
                        <Button
                            onClick={handleAnswer}
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
        const passed = finalScore >= 5;

        const retryChallenge = () => {
            setCurrentStage('challenge');
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
                            {passed ? "Excellent! You've passed the challenge." : "You need at least 5 correct answers to pass. Keep practicing!"}
                        </p>
                    </div>

                    {passed ? (
                        <>
                            <p className="text-green-200 text-lg mb-8">
                                Congratulations! You can now instantly recognize whether to continue with a hand post-flop or save your chips for a better opportunity.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                             <p className="text-red-200 text-lg mb-8">
                                Mastering the 'Fit or Fold' principle is key. Review the concepts and try the challenge again.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={retryChallenge} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 text-lg">
                                    Try Again
                                </Button>
                                <Button onClick={() => completeGame(false)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 text-lg">
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
            case 'challenge': return renderChallenge();
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
            key={currentStage}
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
