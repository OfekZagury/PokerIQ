
import React, { useState, useEffect } from 'react';
import { UserService as User } from "@/services/user";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, TrendingUp, DollarSign, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayingCard from '../components/shared/PlayingCard';
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Value/Protection Sizing — give a bad price to draws - Introduction",
        content: "This mini-game focuses on mastering bet sizing when you hold the best hand post-flop. The goal is: to extract maximum value from opponents and to give them a bad mathematical price to call their draws, essentially forcing them into a negative expected value (-EV) situation. This strategic betting ensures your profitable moves.",
        icon: DollarSign
    },
    {
        title: "Part A: Understanding Board Texture",
        content: "The type of community cards on the board, known as board texture, significantly influences your betting strategy.",
        icon: TrendingUp
    },
    {
        title: "Part A: Understanding Board Texture – Wet Boards",
        content: "As you learned  before, Wet Boards are characterized by many drawing opportunities, meaning opponents are likely to have strong flush or straight draws. On these boards, your bets serve a dual purpose: value (getting money from worse hands) and protection (making it expensive for draws to continue). For example, if the board is 7♠ 8♠ K♥, many flush and straight draws are possible.",
        icon: Users
    },
    {
        title: "Part A: Understanding Board Texture – Dry Boards",
        content: "Dry boards offer limited drawing possibilities. On such boards, protection is less of a concern, and your focus shifts primarily to value betting. Opponents are less likely to hit a strong draw. For instance, a board of K♦ 7♣ 2♥ is considered dry.",
        icon: Target
    },
    {
        title: "Part B: Bet Sizing to Give a Bad Price",
        content: "The core principle of value/protection sizing is to ensure your bets make it mathematically unprofitable for opponents to call with their drawing hands. To achieve this, your bet size should be greater than your opponent's estimated drawing hand equity.",
        icon: DollarSign
    },
    {
        title: "Part B: Bet Sizing to Give a Bad Price - Opponent's Equity Estimation",
        content: "You'll need to estimate your opponent's equity (their chance of winning if the hand goes to showdown) based on their potential drawing hands. While We previously talked about the Rule of 2 and 4 as a tool for evaluating equity in general, for this specific context, we will implement a different method of calculation.",
        icon: TrendingUp
    },
    {
        title: "Part B: Bet Sizing to Give a Bad Price - Opponent's Equity Estimation - Calculation",
        content: "The Calculation: If an opponent needs, for example, 20% equity to call profitably, you should bet an amount that offers them pot odds worse than 20%. This is done by sizing your bet so that the cost to call is a larger percentage of the total pot (pot + your bet + call) than their equity percentage. For example, if the pot is $100 and you bet $75, an opponent needs to call $75 to win $175. This means they are getting pot odds of 75/175 = 42.8%. If their draw only has 20% equity, they are making a -EV call.",
        icon: Users
    },
    {
        title: "Part C: Advanced Considerations - Over-betting",
        content: "In certain situations, especially on wet boards where you strongly suspect opponents have strong draws, an over-bet (1.2 to 1.3 times the pot) can be appropriate. This amplifies the unfavorable pot odds, making it even harder for draws to continue.",
        icon: Target
    },
    {
        title: "Part C: Advanced Considerations - Implied Odds Caveat",
        content: "While giving a bad price is key, always consider implied odds and stack sizes. A deep-stacked opponent might still call a seemingly bad price if they expect to win a much larger pot by hitting their draw on a later street. This awareness is crucial for refining your bet sizing.",
        icon: Target
    }
];

const practiceQuestions = [
    {
        board: ["A♠", "K♦", "7♣"],
        hand: ["A♥", "Q♥"],
        scenario: "You have top pair, top kicker on a dry board. A passive opponent checks to you.",
        question: "What is your primary goal with a bet here?",
        options: ["To make them fold", "To get value from worse hands", "To see the next card cheaply"],
        correct: 1,
        explanation: "Your hand is very strong, and the primary goal is to bet for value, hoping to get called by weaker hands like a worse Ace, a King, or a drawing hand."
    },
    {
        board: ["10♥", "9♥", "4♠"],
        hand: ["Q♣", "Q♦"],
        scenario: "You have an overpair on a flush draw board. Your opponent checks.",
        question: "A bet here serves as both a value bet and a...?",
        options: ["Bluff", "Protection bet", "Slow-play"],
        correct: 1,
        explanation: "Betting here gets value from hands like top pair (a Ten) and also 'protects' your hand by charging flush draws the wrong price to continue."
    },
    {
        board: ["K♠", "J♦", "8♣", "4♥", "2♠"],
        hand: ["K♥", "9♥"],
        scenario: "The river completes a dry board. You have top pair. Your opponent is a known calling station.",
        question: "This is a good spot for what type of value bet?",
        options: ["A standard value bet", "A thin value bet", "No bet, check it down"],
        correct: 1,
        explanation: "This is a classic 'thin value' spot. You are likely ahead, but not by a huge margin. Against a calling station who will call with any pair, betting here extracts maximum long-term profit."
    }
];

const finalChallengeQuestions = [
    {
        hand: ["K♠", "K♦"],
        board: ["K♥", "8♣", "3♠"],
        question: "You flop top set. Your primary goal is to:",
        options: ["Check to trap", "Bet for value", "Bet small to keep them in"],
        correct: 1,
        feedback: "Bet for value. With a monster hand, your main goal is to build the pot and get paid by weaker hands."
    },
    {
        hand: ["A♣", "J♣"],
        board: ["J♥", "10♥", "5♦"],
        question: "Top pair on a draw-heavy board. A bet protects against:",
        options: ["Better Jacks", "Flush and Straight draws", "Pocket Aces"],
        correct: 1,
        feedback: "A bet protects your hand by charging flush and straight draws the incorrect odds to continue."
    },
    {
        hand: ["A♠", "10♠"],
        board: ["10♣", "8♦", "3♥", "2♣", "7♠"],
        opponent: "Calling Station",
        question: "Top pair, decent kicker vs. a calling station on the river. This is a spot for a:",
        options: ["Check", "Bluff", "Thin value bet"],
        correct: 2,
        feedback: "This is a perfect spot for a thin value bet. Your opponent will call with many worse hands, making a bet here profitable."
    },
    {
        hand: ["Q♠", "Q♥"],
        board: ["A♦", "K♣", "8♠"],
        question: "You have pocket Queens on an Ace-King high board. An opponent bets into you. You should:",
        options: ["Raise for value", "Call the bet", "Fold"],
        correct: 2,
        feedback: "Fold. This is not a value bet situation. Your hand is likely beaten, and continuing would be a mistake. The goal is to bet for value when you are ahead."
    },
    {
        hand: ["J♠", "J♥"],
        board: ["J♣", "10♣", "9♣"],
        question: "You have a set on a monotone board. A bet here is for:",
        options: ["Value and Protection", "A pure bluff", "Just to see the turn"],
        correct: 0,
        feedback: "This is a classic value and protection bet. You get value from hands like two pair or a lower flush, and you protect against hands drawing to a higher flush."
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

export default function Game16() {
    const [currentStage, setCurrentStage] = useState('intro');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [user, setUser] = useState(null);
    const gameId = 1;
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
            setCurrentQuestion(0); // Reset for next stage
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
                <Target className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Game 16: Value Master</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Can You Spot the Winning Bet?</h2>
                <p className="text-green-200 text-lg mb-8">
                    Learn the art of strategically sizing bets when you hold the best hand post-flop.
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
                        {question.board && (
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <p className="text-white font-bold">Board:</p>
                                <div className="flex gap-2">
                                    {question.board.map(card => <PlayingCard key={card} card={card} />)}
                                </div>
                            </div>
                        )}
                        {question.hand && (
                            <div className="flex justify-center items-center gap-4">
                                <p className="text-white font-bold">Your Hand:</p>
                                <div className="flex gap-2">
                                    {question.hand.map(card => <PlayingCard key={card} card={card} />)}
                                </div>
                            </div>
                        )}
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
                            {passed ? "Excellent! You're a true value master." : "You need at least 4 correct answers to pass. Keep practicing!"}
                        </p>
                    </div>

                    {passed ? (
                        <>
                            <p className="text-green-200 text-lg mb-8">
                                You can now confidently distinguish between value, protection, and thin value bets to maximize your profits.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-red-200 text-lg mb-8">
                                Mastering value betting is crucial. Review the concepts and try the challenge again.
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
            case 'practice_intro': return <StageDivider title="Practice Round" description="Let's practice what you've learned about value betting. Get comfortable applying the concepts before the final challenge." onContinue={() => setCurrentStage('practice')} />;
            case 'practice': return renderQuestion(true);
            case 'final_challenge_intro': return <StageDivider title="Final Challenge" description="Time to test your mastery! Answer 5 questions correctly to prove you're a Value Master. You need at least 4 out of 5 correct answers to pass." onContinue={() => setCurrentStage('final_challenge')} />;
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

