
import React, { useState, useEffect } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, ThumbsDown, Layers, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";


const explanationSlides = [
    {
        title: "Introduction",
        content: "In post-flop poker, understanding the board texture is essential for making profitable betting decisions. The board texture refers to the characteristics of the community cards that have been dealt, influencing the types of hands opponents might hold and how they might continue to play. Correctly recognizing the board texture allows you to size your bets effectively, aiming to extract maximum value from your strong hands while giving your opponents unfavorable pot odds to call.",
        icon: Layers
    },
    {
        title: "Part A: Wet Board Texture Recognition",
        content: "Wet boards are characterized by being draw-heavy and coordinated. This means the community cards present numerous opportunities for players to hit strong draws, such as straights or flushes. On a wet board, there's an increased risk that your opponents already have, or are drawing to, powerful hands. Because of these drawing possibilities, your betting strategy on wet boards must consider both value (getting paid by worse hands) and protection (preventing opponents from drawing out cheaply). You need to evaluate your opponents' potential outs and adjust your bet sizing to make their drawing calls negative expected value (–EV).",
        icon: BrainCircuit
    },
    {
        title: "Part A: Wet Board Texture Recognition - Example",
        content: "If the flop is 9♦ 8♦ 7♠, this is a wet board. Many players could have straight draws (like 6-10, 5-6, 10-J) or flush draws (any two diamonds). If you have a strong made hand, you would bet to extract value and charge these draws a high price to continue, ideally making their calls (–EV).",
        icon: BrainCircuit
    },
    {
        title: "Part B: Dry Board Texture Recognition",
        content: "In contrast, dry boards have limited drawing possibilities. On these boards, the community cards do not offer many ways for players to complete straights, flushes, or other strong draws. This significantly reduces the chances of your opponents having strong drawing hands. Consequently, your focus shifts primarily towards value betting. You don't need to be as concerned with \"protection\" because the likelihood of opponents hitting a game-changing card is minimal. Opponents on dry boards are typically either holding a made hand or very weak hands, sometimes only backdoor draws. Your bet sizing should aim to encourage calls from these weaker, made hands or to fold out hands with little chance to improve.",
        icon: BrainCircuit
    },
    {
        title: "Part B: Dry Board Texture Recognition - Example",
        content: "If the flop is K♣ 7♥ 2♠, this is a dry board. It's unlikely anyone has a straight or flush draw. Most hands that connect with this board will be strong pairs or sets. If you have a strong hand like a top pair, your goal is to bet an amount that a weaker pair might call, ensuring their call is –EV if they are drawing thin or chasing a backdoor draw.",
        icon: BrainCircuit
    }
];

const finalChallengeQuestions = [
    {
        board: ["K♥", "Q♥", "5♥"],
        question: "What is the primary texture of this board?",
        options: ["Dry", "Wet", "Paired"],
        correct: 1,
        feedback: "Correct. This is a very 'wet' monotone board, offering an immediate flush to anyone holding two hearts and strong flush draws for anyone with one heart."
    },
    {
        board: ["A♠", "9♦", "2♣"],
        question: "What is the primary texture of this board?",
        options: ["Dry", "Wet", "Paired"],
        correct: 0,
        feedback: "Correct. This is a classic 'dry' rainbow board. There are no obvious straight or flush draws, making made hands like top pair very strong."
    },
    {
        board: ["8♣", "8♠", "J♥"],
        question: "What is the primary texture of this board?",
        options: ["Dry", "Wet", "Paired"],
        correct: 2,
        feedback: "Correct. This is a 'paired' board. The main danger is an opponent holding a Jack for a full house or an 8 for trips."
    },
    {
        board: ["9♠", "10♦", "J♣"],
        question: "What is the primary texture of this board?",
        options: ["Dry", "Wet", "Paired"],
        correct: 1,
        feedback: "Correct. This is a very 'wet' board, offering numerous open-ended straight draw possibilities for hands like Q-K, 7-8, or Q-8."
    },
    {
        board: ["K♠", "K♦", "K♥"],
        question: "You have A♠ K♣. What do you have?",
        options: ["A Full House", "Four of a Kind", "A Flush"],
        correct: 1,
        feedback: "Correct. With one King in your hand and three on the board, you have four of a kind, an enormous hand."
    },
    {
        board: ["7♦", "8♦", "A♠"],
        question: "Which hand has the most equity on this board?",
        options: ["A♣ K♣ (Top Pair)", "9♦ 10♦ (Flush & Straight Draw)", "J♠ J♣ (Overpair)"],
        correct: 1,
        feedback: "Correct. The combo draw (9♦ 10♦) has the most equity, as it can win by making a straight or a flush, giving it many outs."
    }
];

const StageDivider = ({ title, onContinue }) => (
  <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl"
    >
      <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
        <div className="bg-white/10 rounded-xl p-6 min-h-[150px] flex items-center">
            <p className="text-green-200 text-lg leading-relaxed">You are now have the knowledge necessary for understanding how to distinguish between the defferent board textures. You will now face the final challenge - 6 questions, no timer, get at least 4 correct to pass. You can do it, Good Luck</p>
        </div>
      <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
        Continue <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  </div>
);


export default function Game14() {
    const [currentStage, setCurrentStage] = useState('intro');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideDirection, setSlideDirection] = useState(1);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [user, setUser] = useState(null);
    const gameId = 14;
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
            await User.completeGame(14);
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
                <h1 className="text-4xl font-bold text-white mb-4">Game 14: Board Texture Recognition</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Board Blueprint: Can You Spot the Winning Setup?</h2>
                <p className="text-green-200 text-lg mb-8">
                    In post-flop poker, understanding the community cards is paramount. This mini-game will train your eye to quickly recognize wet, dry, and paired boards.
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
                        initial={{ opacity: 0, x: slideDirection * 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -slideDirection * 100 }}
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
                    <Button onClick={() => setCurrentStage('challenge-intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
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
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Board Texture Challenge</h2>
                    <p className="text-center text-red-300 mb-6">Question {currentQuestion + 1} of {finalChallengeQuestions.length}</p>
                    <Progress value={((currentQuestion + 1) / finalChallengeQuestions.length) * 100} className="mb-6" />


                    <div className="bg-white/5 rounded-xl p-6 mb-6 min-h-[200px]">
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <p className="text-white font-bold text-lg">Board:</p>
                            <div className="flex gap-2">
                                {question.board.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>

                        {question.hand && (
                             <div className="flex justify-center items-center gap-4 my-4">
                                <p className="text-white font-bold text-lg">Your Hand:</p>
                                <div className="flex gap-2">
                                     <PlayingCard card={question.hand} />
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
        const passed = finalScore >= 5; // Passing score is 5 out of 6 questions

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
                            {passed ? "Excellent! You have a sharp eye for board texture." : "You need at least 5 correct answers to pass. Keep practicing!"}
                        </p>
                    </div>

                    {passed ? (
                         <>
                            <p className="text-green-200 text-lg mb-8">
                                Congratulations! You can now quickly identify wet, dry, and paired boards to make more accurate post-flop decisions.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-red-200 text-lg mb-8">
                                Mastering board texture is crucial. Review the concepts and give the challenge another try.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={retryChallenge} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
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
        case 'challenge-intro': return (
            <StageDivider
                title="Final Challenge: Board Texture Recognition"
                onContinue={() => setCurrentStage('challenge')}
            />
        );
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
