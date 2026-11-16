
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Zap, TrendingUp, ThumbsDown, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Semi-Bluff Thresholds (9/12/15 Outs) the Rule of 2 and 4  - Introduction",
        content: "In poker, knowing when to bet big with a drawing hand can dramatically increase your profits. This game will teach you to quickly assess your hand's potential for an all-in semi-bluff, transforming your gut feelings into mathematically sound decisions.",
        icon: Zap
    },
    {
        title: "Part A: Defining the Semi-Bluff",
        content: "A semi-bluff in poker is a strategic bet made when you hold a drawing hand, such as a flush draw or a straight draw, meaning your hand is not yet complete but has the significant potential to improve on a later betting round. This differs fundamentally from a pure bluff, where a player bets with little to no chance of improving their hand and relies solely on their opponent folding. The primary goals of semi-bluffing are two ",
        icon: TrendingUp
    },
    {
        title: "Part A: Defining the Semi-Bluff - goals of semi-bluffing",
        content: "first, to maximize fold equity by pressuring your opponent to fold their potentially better hands, allowing you to win the pot outright without needing to improve. Second, if your semi-bluff is called, you aim to maximize value by hitting your draw and extracting additional chips from your opponent on subsequent streets. For example, betting with a flush draw hoping your opponent folds, or if they call, you still have a chance to hit your flush.",
        icon: Target
    },
    {
        title: "Part B: All-in Equity and the Rule of 2 and 4",
        content: "To determine the profitability of an all-in semi-bluff, poker players evaluate their all-in equity using the simplified Rule of 2 and 4. This rule allows for quick estimation of your percentage chance of hitting your desired cards (outs) by the river without complex calculations. If you are on the flop and are going all-in, you multiply your number of outs by 4 to estimate your equity by the river. If you are on the turn and are going all-in, you multiply your number of outs by 2 to estimate your equity by the river. ",
        icon: TrendingUp
    },
    {
        title: "Part B: All-in Equity and the Rule of 2 and 4 - Example",
        content: "For example, if you have a hand with 8 outs (like an open-ended straight draw) on the flop and decide to go all-in, your estimated all-in equity is 8 outs x 4 = 32%.",
        icon: TrendingUp
    },
    {
        title: "Part C: Semi-Bluffing Equity Thresholds (9, 12, 15 Outs)",
        content: "There are specific strong drawing hands that are ideal for all-in semi-bluffing due to their substantial equity. These include a Nut Flush Draw (which has 9 outs), a Flush with a Gut Shot Straight Draw (equating to 12 outs), and a Flush with an Open-Ended Straight Draw (offering a powerful 15 outs). Using the Rule of 2 and 4 for a flop all-in scenario, these hands have approximate equities:\n" +
            "•\tNut Flush Draw (9 outs): 9 outs x 4 = 36% equity.\n" +
            "•\tFlush with Gut Shot Straight Draw (12 outs): 12 outs x 4 = 48% equity.\n" +
            "•\tFlush with Open-Ended Straight Draw (15 outs): 15 outs x 4 = 60% equity.\n",
        icon: Target
    },
    {
        title: "Part C: Semi-Bluffing Equity Thresholds (9, 12, 15 Outs)",
        content: "The optimal equity thresholds for going all-in as a semi-bluff depend on the number of opponents. In a heads-up pot (against one opponent), you can profitably semi-bluff all-in when holding approximately 50% equity. In a three-way pot (against two opponents), you can consider going all-in with around 33% equity. Aggressively playing these strong draws, especially those with 12 or more outs on the flop, can lead to higher variance but are considered +EV (positive expected value) in the long run.",
        icon: TrendingUp
    }
];

const practiceQuestions = [
    {
        board: ["K♠", "8♥", "4♥"],
        hand: ["A♥", "J♥"],
        scenario: "You have the nut flush draw on the flop.",
        question: "Is this a good hand to semi-bluff with?",
        options: ["Yes, it's a strong draw", "No, wait to see if you hit", "No, your hand has no value"],
        correct: 0,
        explanation: "Yes. The nut flush draw is an excellent candidate for a semi-bluff. It has strong equity (9 outs) and can apply pressure, potentially winning the pot immediately."
    },
    {
        scenario: "You have a strong drawing hand and are considering a semi-bluff.",
        question: "What are the two ways a semi-bluff can win the pot?",
        options: ["Opponent folds or you hit your draw", "Best hand or opponent misreads the board", "Opponent is a beginner or you get lucky"],
        correct: 0,
        explanation: "A semi-bluff wins if your opponent folds to your aggression (fold equity) or if you improve to the best hand on a later street (hand equity)."
    },
    {
        board: ["7♣", "8♣", "K♠"],
        hand: ["9♦", "10♦"],
        scenario: "You have an open-ended straight draw (8 outs).",
        question: "Using the Rule of 4, what is your approximate equity on the flop?",
        options: ["8%", "16%", "32%", "40%"],
        correct: 2,
        explanation: "With 8 outs on the flop, you multiply by 4 to get your approximate equity to hit by the river. 8 * 4 = 32%."
    }
];

const finalChallengeQuestions = [
    {
        hand: ["A♦", "K♦"],
        board: ["Q♦", "8♠", "2♦"],
        question: "Nut flush draw (9 outs). Good to semi-bluff?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. This is a premium drawing hand. Semi-bluffing applies pressure and can win the pot outright or realize your strong equity."
    },
    {
        hand: ["7♣", "6♣"],
        board: ["5♦", "8♥", "A♠"],
        question: "Gutshot straight draw (4 outs). Good to semi-bluff?",
        options: ["Yes, apply pressure", "No, weak draw"],
        correct: 1,
        feedback: "No. A gutshot draw has weak equity (only 4 outs). It's generally not strong enough to semi-bluff with, as you don't have enough of a backup plan if you get called."
    },
    {
        hand: ["K♥", "Q♥"],
        board: ["A♥", "10♥", "2♠"],
        question: "Flush draw + gutshot straight draw (12 outs). Good to semi-bluff?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. This is a monster combo draw with huge equity. It's a perfect candidate for an aggressive semi-bluff, even an all-in."
    },
    {
        hand: ["9♠", "8♠"],
        board: ["6♦", "7♦", "K♦"],
        question: "You have an open-ended straight draw on a monotone (all one suit) board. Semi-bluff?",
        options: ["Yes", "No, be cautious"],
        correct: 1,
        feedback: "No, be cautious. While you have a straight draw, it's very likely an opponent has a flush draw or a made flush. Bluffing into this board is extremely risky."
    },
    {
        hand: ["A♠", "5♠"],
        board: ["K♠", "J♠", "2♥"],
        question: "You have the nut flush draw. Your opponent is a known 'calling station'. Should you semi-bluff?",
        options: ["Yes, always", "No, just call and try to hit"],
        correct: 1,
        feedback: "No. Against a calling station, your fold equity is very low. It's often more profitable to just call and use your hand's strong equity to win at showdown, rather than trying to make them fold."
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

export default function Game17() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [user, setUser] = useState(null);
  const gameId = 17;
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
            await User.completeGame(1);
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

    const handleSlideChange = (newSlide) => {
        setSlideDirection(newSlide > currentSlide ? 1 : -1);
        setCurrentSlide(newSlide);
    };

    const renderIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <TrendingUp className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Game 17: Semi-Bluff Threshold</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Can You Spot the +EV All-in?</h2>
                <p className="text-green-200 text-lg mb-8">
                    Knowing when to bet big with a drawing hand can dramatically increase your profits.
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
                        initial={{ opacity: 0, x: slideDirection * 200 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -slideDirection * 200 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
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
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <p className="text-white font-bold">Board:</p>
                            <div className="flex gap-2">
                                {question.board && question.board.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <p className="text-white font-bold">Your Hand:</p>
                            <div className="flex gap-2">
                                {question.hand && question.hand.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-white text-center mt-6">{question.question}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                            {passed ? "You're a semi-bluff master." : "You need at least 4 correct answers to pass. Good try!"}
                        </p>
                    </div>

                    {passed ? (
                        <>
                            <p className="text-green-200 text-lg mb-8">
                                You can now identify high-equity drawing hands and know when to apply maximum pressure with a semi-bluff.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-red-200 text-lg mb-8">
                                Mastering the semi-bluff is key. Review the concepts and try the challenge again.
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
            case 'practice_intro': return <StageDivider title="Practice Round" description="Let's practice what you've learned about semi-bluffing. There is no score here, just learning!" onContinue={() => setCurrentStage('practice')} />;
            case 'practice': return renderQuestion(true);
            case 'final_challenge_intro': return <StageDivider title="Final Challenge" description="Time to test your skills! You need at least 4 out of 5 correct answers to pass." onContinue={() => setCurrentStage('final_challenge')} />;
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
                    key={currentStage + currentQuestion + currentSlide}
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
