
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Lightbulb, Target, Zap, ThumbsDown, Eye, Calculator, BrainCircuit, Bot, Timer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PokerTable from "../components/game2/PokerTable";
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        icon: Target,
        title: "Part A: Understanding Bluff Break-even Point",
        content: "When you bluff in poker, you make a bet with a hand that is likely not the best, aiming to make your opponent fold. A crucial insight from 'Essential Poker Math' is that bluffs don't need to succeed 100% of the time to be profitable. Instead, their long-term profitability depends on how often they succeed versus the amount risked."
    },
    {
        icon: Target,
        title: "Part A: Understanding Bluff Break-even Point",
        content: "To determine this, you calculate a bluff's break-even point, which is the minimum percentage of the time your bluff must work for you to avoid losing money in the long run. This calculation is fundamentally based on the risk-to-reward ratio of your bet."
    },
    {
        icon: Calculator,
        title: "Part A: Understanding Bluff Break-even Point - The formula",
        content: "The formula for calculating a bluff's break-even percentage is: Risk / (Risk + Reward). Here, 'Risk' is the amount you are betting, and 'Reward' is the total size of the pot you are trying to win before your current bet."
    },
    {
        icon: Calculator,
        title: "Part A: Understanding Bluff Break-even Point - The formula",
        content: "For example, imagine there's $100 in the pot, and you bluff $50.\n•\tYour Risk = $50\n•\tYour Reward = $100 (the pot you win if they fold)\n•\tBreak-even Percentage = $50 / ($50 + $100) = $50 / $150 = 0.3333 or 33.3%. This means if your bluff works more than 33.3% of the time, it is a profitable play over the long run."
    },
    {
        icon: BrainCircuit,
        title: "Part B: Expected Value (EV) of Bluffs",
        content: "Beyond the simple break-even point, you can evaluate the overall long-term profitability of your bluffs using Expected Value (EV). EV quantifies the average profit or loss you can anticipate from a specific action over many repetitions, irrespective of the outcome of any single hand."
    },
    {
        icon: BrainCircuit,
        title: "Part B: Expected Value (EV) of Bluffs",
        content: "A +EV play is expected to be profitable in the long run, while a -EV play is expected to be unprofitable. The basic EV calculation is: EV = [Expected Winnings] - [Expected Losses]."
    },
    {
        icon: Zap,
        title: "Part B: Expected Value (EV) of Bluffs",
        content: "For bluffs (including semi-bluffs, which are bets made with a drawing hand that also has the potential to improve), the EV calculation considers multiple scenarios that might occur:\n1.\tYour opponent folds: You win the current pot outright.\n2.\tYour opponent calls and you win (applicable primarily to semi-bluffs where your hand improves and wins at showdown). For a pure bluff, this outcome's value would typically be zero.\n3.\tYour opponent calls and you lose (your bluff is called and you do not have the best hand)."
    },
    {
        icon: Zap,
        title: "Part B: Expected Value (EV) of Bluffs - Example",
        content: "An example of a semi-bluff EV calculation: Suppose you semi-bluff with estimated outcomes as follows:\n•\tThe villain folds 20% of the time, leading to a win of $15.\n•\tThe villain calls 80% of the time, and you win 32% of those calls, leading to a win of $64.\n•\tThe villain calls 80% of the time, and you lose 68% of those calls, leading to a loss of $54.40.\n•\tThe Total EV for this semi-bluff is calculated as: $15 + $64 - $54.40 = $24.60 (+EV)."
    },
    {
        icon: ThumbsDown,
        title: "Part C: Identifying No-Bluff Spots",
        content: "While bluffing is an essential part of poker strategy, not all situations are suitable for it. Identifying no-bluff spots where your bluff is unlikely to succeed is critical for maximizing profitability. Understanding opponent types is crucial for tailoring your strategy effectively. There are Two key opponent types that often represent no-bluff spots."
    },
    {
        icon: Bot,
        title: "Part C: Identifying No-Bluff Spots - Opponent Types",
        content: "1. Calling Stations: These players are characterized by rarely folding and calling bets frequently, often with weak or marginal hands. Bluffing against a Calling Station is generally ineffective because they are unlikely to be deterred by your bet due to their strong tendency to call. Your 'fold equity'—the probability that your opponent will fold when you bet—is very low against them."
    },
    {
        icon: Bot,
        title: "Part C: Identifying No-Bluff Spots - Opponent Types",
        content: "2. NITs (Really Tight Players): These players are extremely selective with their starting hands and only engage with premium hands post-flop. They are risk-averse and tend to be predictable. If a NIT raises from an early position (like Under the Gun, UTG), they likely have a very strong hand, making it a poor opportunity to bluff against them because their hand ranges are strong, indicating low fold equity."
    },
    {
        icon: Eye,
        title: "Part C: Identifying No-Bluff Spots",
        content: "The success of bluffs depends on various situational factors such as board texture, perceived ranges, stack depth, and opponents' styles. Therefore, combining mathematical understanding with keen observation of opponent tendencies is key to avoiding unprofitable bluff attempts and identifying these crucial no-bluff spots."
    }
];

const demoScenarios = [
    {
        title: "Demo 1: Bluff Break-even Point",
        steps: [
            {
                narration: "Imagine you're on the river with $100 in the pot. You decide to make a bluff bet of $50.",
                pot: 100,
                bet: 50,
                showFormula: false,
                formulaStep: 0
            },
            {
                narration: "To determine how often your bluff needs to work, we calculate its break-even percentage. The formula is: Risk / (Risk + Reward).",
                pot: 100,
                bet: 50,
                showFormula: true,
                formulaStep: 1
            },
            {
                narration: "Here, your Risk = $50 (your bet) and the Reward = $100 (the pot). So, we calculate: $50 / ($50 + $100).",
                pot: 100,
                bet: 50,
                showFormula: true,
                formulaStep: 2
            },
            {
                narration: "This equals 33.3%. If your bluff makes your opponent fold more than 33.3% of the time, it's a profitable play in the long run.",
                pot: 100,
                bet: 50,
                showFormula: true,
                formulaStep: 3
            }
        ]
    },
    {
        title: "Demo 2: Identifying a No-Bluff Spot",
        steps: [
            {
                narration: "You are on the river with an air hand. The pot is $80, and you're considering a $40 bluff against a known 'Calling Station'.",
                pot: 80,
                bet: 0,
                opponentType: "Calling Station",
                showNoBluffSymbol: false
            },
            {
                narration: "A 'Calling Station' rarely folds. This means your 'fold equity'—the chance they will fold—is extremely low.",
                pot: 80,
                bet: 40,
                opponentType: "Calling Station",
                showNoBluffSymbol: false
            },
            {
                narration: "Despite favorable pot math (33.3% breakeven if you bet into $80 pot), bluffing here is a losing play. This is a clear no-bluff spot.",
                pot: 80,
                bet: 40,
                opponentType: "Calling Station",
                showNoBluffSymbol: true
            }
        ]
    }
];

const stage2Questions = [
    {
        type: 'calculation',
        title: 'Question 1 (Break-even Calculation)',
        scenario: "The pot is $120. Your opponent bets $60. What is the break-even percentage for a hero call?",
        pot: 120,
        bet: 60,
        correctAnswer: 25, // Corrected from 33.3 based on provided explanation: $60 / ($180 + $60) = 25%
        hint1: "Remember the break-even formula: Risk / (Risk + Reward). 'Risk' is what you have to call, 'Reward' is the total pot BEFORE your call.",
        hint2: "You are risking $60 to win a pot that is currently $120 (original pot) + $60 (opponent's bet) = $180. The formula for hero call break-even is: Risk / (Total Pot after opponent's bet + Risk)."
        ,
        explanation: "To find the break-even point for a hero call, you divide the amount you need to call (your Risk) by the total pot size after you've called (the Reward + your Risk). Here, you risk $60 to win a pot that will be $240 ($120 + $60 from opponent + your $60 call). So, the calculation is $60 / $240 = 0.25 or 25%. You need to be right more than 25% of the time for the call to be profitable."
    },
    {
        type: 'mc',
        title: 'Question 2 (No-Bluff Spot - NIT)',
        scenario: "You're in a hand against a NIT (Really Tight Player) who opened from an early position (UTG) and then bet strongly on a dry flop. You have an air hand. Should you attempt a bluff on the turn?",
        options: ["Yes, this is a good spot.", "No, this is a bad spot.", "It depends on my hand."],
        correctAnswer: 1, // Index of correct option
        hint1: "What are the characteristics of a NIT? Do they play many hands, or only premium ones?",
        hint2: "When a NIT shows strength from early position, their hand range is usually very strong. Is their 'fold equity' high or low?",
        explanation: "Correct Answer: No, this is a bad spot. NITs are extremely selective and only engage with premium hands, especially when they show aggression from early positions. Bluffing them would be ineffective due to very low fold equity."
    },
    {
        type: 'calculation',
        title: 'Question 3 (EV of Semi-Bluff – simplified)',
        scenario: "You are considering a semi-bluff. You estimate your opponent folds 25% of the time (you win $100). If they call (75% of the time), you estimate you will win at showdown 30% of those calls (you win an additional $200), and lose 70% of those calls (you lose $150). What is the total EV of this semi-bluff?",
        correctAnswer: -8.75,
        hint1: "Recall the extended EV formula for semi-bluffs: EV = (Fold % * Win when fold) + (Call % * Win % * Win when called) - (Call % * Lose % * Lose when called).",
        hint2: "Break it down: (0.25 * 100) + (0.75 * 0.30 * 200) - (0.75 * 0.70 * 150)",
        explanation: "The EV is calculated as: (0.25 * $100) + (0.75 * 0.30 * $200) - (0.75 * 0.70 * $150) = $25 + $45 - $78.75 = -$8.75. This is a negative EV play and would lose money in the long run."
    }
];

const stage3Questions = [
    {
        type: 'calculation',
        scenario: "You are on the river with an air hand, and you decide to bluff. The pot is currently $250. You bet $125. What is the breakeven point percentage for this bluff?",
        correctAnswer: 33.3,
        explanation: "The breakeven point is your Risk / (Risk + Reward). Here, it's $125 / ($125 + $250) = $125 / $375 = 33.3%. Your bluff needs to work more than a third of the time."
    },
    {
        type: 'mc',
        scenario: "You are at the end of a hand on the river against a Loose Passive player who often folds to aggression. You have a marginal hand with no chance of winning at showdown. Is this a good spot to bluff?",
        options: ["Yes", "No"],
        correctAnswer: 0,
        explanation: "Yes. Loose Passive players tend to call a lot but often fold to significant aggression, especially on the river. Since they play many weak hands, your bluff has a high chance of success (high fold equity)."
    },
    {
        type: 'calculation',
        scenario: "You are on the river, the pot is $90. Your opponent has moved all-in for $180. You are considering a Hero Call. What is the minimum success rate your call needs to be profitable?",
        correctAnswer: 40, // Corrected from 50 based on provided explanation: $180 / ($180 + $270) = 40%
        explanation: "This is a hero call scenario. Your Risk is $180 (the amount you call). The Reward is the total pot *before* your call, which is $90 (original pot) + $180 (opponent's bet) = $270. The break-even percentage for a hero call is Risk / (Risk + Reward). So, $180 / ($180 + $270) = $180 / $450 = 0.40 or 40%. You need to be right more than 40% of the time."
    },
    {
        type: 'mc',
        scenario: "You are facing a NIT who raised pre-flop from the button. The flop is Q-Q-2. You have an air hand. Should you try to bluff this player?",
        options: ["Yes", "No"],
        correctAnswer: 1,
        explanation: "No. A paired board like Q-Q-2 is very likely to have hit a NIT's strong starting hand range (e.g., they could have a Queen, or a pocket pair for a full house). Your fold equity is extremely low."
    },
    {
        type: 'calculation',
        scenario: "Consider a pure bluff. The pot is $70. You bet $35. What is the minimum success rate required for this bluff to be profitable?",
        correctAnswer: 33.3,
        explanation: "Your Risk is $35. The Reward (pot) is $70. Break-even = Risk / (Risk + Reward) = $35 / ($35 + $70) = $35 / $105 = 33.3%."
    }
];

const finalChallengeQuestions = [
    { type: 'calculation', scenario: "On the river, the pot is $150. You bluff $75. What's the breakeven percentage?", correctAnswer: 33.3 },
    { type: 'mc', scenario: "Your opponent is a 'Calling Station' who checked to you on the river. You have a complete air hand. Should you bluff?", options: ["Yes", "No"], correctAnswer: 1 },
    { type: 'calculation', scenario: "The pot is $90. You bluff $45. How often does this bluff need to work?", correctAnswer: 33.3 },
    { type: 'mc', scenario: "A NIT opened from UTG and bet a K-7-2 rainbow board. Should you bluff the turn?", options: ["Yes", "No"], correctAnswer: 1 },
    { type: 'calculation_mc', scenario: "Against a Loose Passive player, pot is $120, you bluff $60. What's the break-even % and is it a good spot?", mcOptions: ["Good Spot", "Bad Spot"], calcCorrect: 33.3, mcCorrect: 0 },
];

export default function Game23() {
    const [currentStage, setCurrentStage] = useState('intro');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideDirection, setSlideDirection] = useState(1);
    const [currentDemo, setCurrentDemo] = useState(0);
    const [currentDemoStep, setCurrentDemoStep] = useState(0);

    // State for practice stages
    const [questionIndex, setQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState(null); // For MC questions (index of option)
    const [userCalcAnswer, setUserCalcAnswer] = useState(""); // For calculation questions (string)
    const [showHint, setShowHint] = useState(0); // 0: no hint, 1: hint1, 2: hint2
    const [showExplanation, setShowExplanation] = useState(false); // Whether to show feedback
    const [finalChallengeAnswers, setFinalChallengeAnswers] = useState([]); // Array of boolean results for final challenge
    const [timer, setTimer] = useState(30);
    const [hasPassed, setHasPassed] = useState(false);

    const [user, setUser] = useState(null);
    const gameId = 23;
    const navigate = useNavigate();
    const tracktimer = useActiveStopwatch();
    const completedRef = React.useRef(false);

    const resetForNextQuestion = useCallback(() => {
        setUserAnswer(null);
        setUserCalcAnswer("");
        setShowHint(0);
        setShowExplanation(false);
        setTimer(30); // Reset timer for each new question
    }, []);

    const handleNextQuestion = useCallback((timeout = false) => {
        let isCorrect = false;
        const questionsArray = currentStage === 'stage2_practice' ? stage2Questions : currentStage === 'stage3_practice' ? stage3Questions : finalChallengeQuestions;
        const question = questionsArray[questionIndex];

        if (!timeout) { // Only evaluate answer if not a timeout
            if (question.type === 'mc') {
                isCorrect = userAnswer === question.correctAnswer;
            } else if (question.type === 'calculation') {
                isCorrect = Math.abs(parseFloat(userCalcAnswer) - question.correctAnswer) < 0.5;
            } else if (question.type === 'calculation_mc') {
                const calcCorrect = Math.abs(parseFloat(userCalcAnswer) - question.calcCorrect) < 0.5;
                const mcCorrect = userAnswer === question.mcCorrect;
                isCorrect = calcCorrect && mcCorrect;
            }
        }

        if (currentStage === 'final_challenge') {
            const updatedAnswers = [...finalChallengeAnswers, isCorrect];
            setFinalChallengeAnswers(updatedAnswers);
            if (questionIndex < finalChallengeQuestions.length - 1) {
                setQuestionIndex(q => q + 1);
                resetForNextQuestion();
            } else {
                const score = updatedAnswers.filter(Boolean).length;
                setHasPassed(score >= 4); // Need 4 out of 5 correct to pass
                setCurrentStage('completion');
            }
        } else {
            setShowExplanation(true); // For practice stages, show explanation
        }
    }, [currentStage, questionIndex, userAnswer, userCalcAnswer, finalChallengeAnswers, resetForNextQuestion, setQuestionIndex, setFinalChallengeAnswers, setHasPassed, setCurrentStage]);

    // Timer effect for final challenge
    useEffect(() => {
        let interval;
        if (currentStage === 'final_challenge' && !showExplanation) {
            if (timer > 0) {
                interval = setInterval(() => {
                    setTimer(t => t - 1);
                }, 1000);
            } else {
                handleNextQuestion(true); // Timeout, trigger submission
            }
        }
        return () => clearInterval(interval);
    }, [timer, currentStage, showExplanation, handleNextQuestion]);


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

    const completeGame = async () => {
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];
        completedRef.current = true;
        const spentSec = tracktimer.readSeconds();
        track("Game Completed", { gameId, spentSec });
        await User.completeGame(23);
        navigate(createPageUrl("Home"));
    };

    const advanceAfterExplanation = () => {
        const questions = currentStage === 'stage2_practice' ? stage2Questions : stage3Questions;
        if (questionIndex < questions.length - 1) {
            setQuestionIndex(q => q + 1);
            resetForNextQuestion();
        } else {
            const nextStage = currentStage === 'stage2_practice' ? 'stage3_intro' : 'final_challenge_intro';
            setCurrentStage(nextStage);
            setQuestionIndex(0);
            resetForNextQuestion();
        }
    };

    const handleSlideChange = (newSlide) => {
        setSlideDirection(newSlide > currentSlide ? 1 : -1);
        setCurrentSlide(newSlide);
    };

    const handleDemoStep = (direction) => {
        const demo = demoScenarios[currentDemo];
        if (direction === 1) { // Next
            if (currentDemoStep < demo.steps.length - 1) {
                setCurrentDemoStep(s => s + 1);
            } else if (currentDemo < demoScenarios.length - 1) {
                setCurrentDemo(d => d + 1);
                setCurrentDemoStep(0);
            } else {
                setCurrentStage('stage2_intro'); // Transition to next stage after all demos
            }
        } else { // Previous
            if (currentDemoStep > 0) {
                setCurrentDemoStep(s => s - 1);
            } else if (currentDemo > 0) {
                const prevDemo = demoScenarios[currentDemo - 1];
                setCurrentDemo(d => d - 1);
                setCurrentDemoStep(prevDemo.steps.length - 1);
            }
        }
    };

    const renderIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <Target className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">
                    Game 23: Bluffs - Breakeven & No-Bluff Situations
                </h1>
                <p className="text-green-200 text-lg mb-8">
                    Learn the math behind profitable bluffing and when to avoid bluffing altogether.
                </p>
                <Button onClick={() => setCurrentStage('explanation')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                    Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </motion.div>
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
                                <p className="text-green-200 text-lg leading-relaxed whitespace-pre-line">{slide.content}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
                <div className="flex justify-between items-center mt-6">
                    <Button onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
                    <div className="flex gap-2">
                        {explanationSlides.map((_, index) => (
                            <button key={index} onClick={() => handleSlideChange(index)} className={`w-3 h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-yellow-400' : 'bg-green-700 hover:bg-green-600'}`}></button>
                        ))}
                    </div>
                    {currentSlide < explanationSlides.length - 1 ? (
                        <Button onClick={() => handleSlideChange(currentSlide + 1)} className="bg-green-600 hover:bg-green-700 text-white">Next <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={() => setCurrentStage('game_intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Game Intro <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    )}
                </div>
            </div>
        );
    };

    const renderGameIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30 space-y-6">
                 <h2 className="text-3xl font-bold text-yellow-400 font-heading">Bluff Savvy: Can You Spot the Winning Play?</h2>
                 <p className="text-green-200 text-lg">In "Bluff Savvy," you'll master the art and science of bluffing in poker. Learn to use simple math to determine when your bluff needs to succeed to be profitable, and crucially, identify the player types you should never bluff. Sharpen your skills to make calculated, profit-driven decisions at the poker table!</p>
                 <div className="bg-white/10 p-6 rounded-xl text-left">
                    <h3 className="text-2xl font-bold text-white mb-4">How to Play</h3>
                    <p className="text-green-200">You will be presented with various poker scenarios, each requiring you to make a strategic decision or calculation. For each scenario, you will either:<br/>
                    1. Calculate the break-even percentage for a potential bluff or hero call.<br/>
                    2. Determine the Expected Value (EV) of a semi-bluff.<br/>
                    3. Decide whether a bluff is advisable or if it's a no-bluff spot.</p>
                 </div>
                <Button onClick={() => setCurrentStage('stage1_intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                    Begin Demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </motion.div>
        </div>
    );

    const renderStageIntro = (title, content, nextStage) => (
         <div className="max-w-4xl mx-auto text-center">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">
                <h2 className="text-4xl font-bold text-yellow-400 font-heading mb-4">{title}</h2>
                <p className="text-green-200 text-lg mb-8">{content}</p>
                <Button onClick={() => { setCurrentStage(nextStage); resetForNextQuestion(); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                    Start <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </motion.div>
        </div>
    );

    const renderLiveDemo = () => {
        const demo = demoScenarios[currentDemo];
        const step = demo.steps[currentDemoStep];
        const players = step.opponentType ? [
            { position: "UTG", stack: 1000, bet: 0, cards: ["7♦", "2♣"], status: "(You)", isHero: true },
            { position: "BB", stack: 1000, bet: 0, cards: [], status: step.opponentType, isHero: false },
        ] : [
            { position: "UTG", stack: 1000, bet: 0, cards: ["7♦", "2♣"], status: "(You)", isHero: true },
            { position: "BB", stack: 1000, bet: 0, cards: [], status: "", isHero: false },
        ];

        return (
            <div className="max-w-6xl mx-auto text-center">
                 <motion.div
                    key={currentDemo + "-" + currentDemoStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">
                    <h2 className="text-3xl font-bold text-white mb-6">{demo.title}</h2>
                    <div className="w-full h-[350px] md:h-[450px] relative mb-20">
                         <PokerTable
                            players={players}
                            pot={step.pot}
                            communityCards={[]}
                            narration={step.narration}
                         />
                         {demo.title.includes("Break-even") && step.showFormula && (
                            <motion.div
                                className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-full text-center"
                                initial={{opacity: 0, scale: 0.8}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{delay: 0.5}}
                            >
                                <div className="bg-black/50 p-4 rounded-xl text-yellow-300 font-mono text-xl md:text-2xl">
                                    {step.formulaStep >= 1 && <p>Risk / (Risk + Reward)</p>}
                                    {step.formulaStep >= 2 && <p>= $50 / ($50 + $100)</p>}
                                    {step.formulaStep >= 3 && <p>= 33.3%</p>}
                                </div>
                            </motion.div>
                         )}
                         {demo.title.includes("No-Bluff") && step.showNoBluffSymbol && (
                             <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                initial={{opacity: 0, scale: 2}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{delay: 0.5, duration: 0.5}}
                            >
                                <div className="text-red-500 font-bold text-6xl md:text-8xl bg-black/50 rounded-full p-8 border-4 border-red-500">
                                    DO NOT BLUFF
                                </div>
                             </motion.div>
                         )}
                    </div>
                    <div className="flex justify-between items-center mt-8">
                         <Button onClick={() => handleDemoStep(-1)} disabled={currentDemo === 0 && currentDemoStep === 0} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600/20"><ArrowLeft className="mr-2 w-4 h-4" /> Previous</Button>
                         <Button onClick={() => handleDemoStep(1)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            {currentDemoStep === demo.steps.length - 1 && currentDemo === demoScenarios.length - 1 ? "Start Practice" : "Next"}
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderPracticeStage = (questions, stageTitle) => {
        const question = questions[questionIndex];
        const isFinalChallenge = stageTitle === 'Final Stage: The Bluff Challenge';

        let isCorrect = false;
        if (showExplanation) {
             if (question.type === 'mc') {
                isCorrect = userAnswer === question.correctAnswer;
            } else if (question.type === 'calculation') {
                isCorrect = Math.abs(parseFloat(userCalcAnswer) - question.correctAnswer) < 0.5;
            } else if (question.type === 'calculation_mc') {
                const calcCorrect = Math.abs(parseFloat(userCalcAnswer) - question.calcCorrect) < 0.5;
                const mcCorrect = userAnswer === question.mcCorrect;
                isCorrect = calcCorrect && mcCorrect;
            }
        }

        return (
            <div className="max-w-4xl mx-auto">
                <motion.div
                    key={currentStage + "-" + questionIndex} // Unique key for AnimatePresence to work
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">{stageTitle}</h2>
                    <p className="text-center text-green-300 mb-4">Question {questionIndex + 1} of {questions.length}</p>

                    {isFinalChallenge && (
                        <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
                            <Timer className="w-6 h-6"/>
                            <p className="text-2xl font-bold">{timer}s</p>
                        </div>
                    )}

                    <div className="bg-white/10 p-6 rounded-xl space-y-6">
                        <p className="text-lg text-white text-center">{question.scenario}</p>

                        {question.type === 'calculation' && (
                             <div className="flex flex-col items-center gap-4">
                                <Input
                                    type="number"
                                    value={userCalcAnswer}
                                    onChange={e => setUserCalcAnswer(e.target.value)}
                                    placeholder="Enter your answer (%)"
                                    className="w-48 text-center bg-gray-800 text-white border-gray-600"
                                    disabled={showExplanation}
                                />
                             </div>
                        )}

                        {question.type === 'mc' && (
                            <div className="flex flex-col md:flex-row justify-center gap-4">
                                {question.options.map((opt, idx) => (
                                    <Button
                                        key={idx}
                                        onClick={() => setUserAnswer(idx)}
                                        variant={userAnswer === idx ? 'default' : 'outline'}
                                        className={userAnswer === idx ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "border-green-600 text-green-300 hover:bg-green-600/20"}
                                        disabled={showExplanation}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {question.type === 'calculation_mc' && (
                             <div className="flex flex-col items-center gap-4">
                                <Input
                                    type="number"
                                    value={userCalcAnswer}
                                    onChange={e => setUserCalcAnswer(e.target.value)}
                                    placeholder="Enter breakeven %"
                                    className="w-48 text-center bg-gray-800 text-white border-gray-600"
                                    disabled={showExplanation}
                                />
                                <div className="flex justify-center gap-4">
                                    {question.mcOptions.map((opt, idx) => (
                                        <Button
                                            key={idx}
                                            onClick={() => setUserAnswer(idx)}
                                            variant={userAnswer === idx ? 'default' : 'outline'}
                                            className={userAnswer === idx ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "border-green-600 text-green-300 hover:bg-green-600/20"}
                                            disabled={showExplanation}
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>

                    {!showExplanation && showHint > 0 && (question.hint1 || question.hint2) && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-4 p-4 bg-blue-900/30 rounded-lg text-blue-200">
                           <p><strong>Hint:</strong> {showHint === 1 ? question.hint1 : question.hint2}</p>
                        </motion.div>
                    )}

                    {showExplanation && (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-900/30 text-green-200' : 'bg-red-900/30 text-red-200'}`}>
                           <p><strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {question.explanation}</p>
                        </motion.div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                        {!isFinalChallenge && !showExplanation && showHint < 2 && (question.hint1 || question.hint2) && (
                            <Button variant="link" onClick={() => setShowHint(h => h + 1)} className="text-yellow-400 hover:underline">Need a Hint? ({showHint + 1}/{(question.hint1 && question.hint2) ? 2 : 1})</Button>
                        )}
                        {(!isFinalChallenge && !showExplanation && (!question.hint1 && !question.hint2)) && <div />}

                        {!showExplanation ? (
                            <Button onClick={() => handleNextQuestion()}
                                className="bg-green-600 hover:bg-green-700 ml-auto"
                                disabled={
                                    (question.type === 'mc' && userAnswer === null) ||
                                    (question.type === 'calculation' && userCalcAnswer.trim() === '') ||
                                    (question.type === 'calculation_mc' && (userAnswer === null || userCalcAnswer.trim() === ''))
                                }
                            >Submit</Button>
                        ) : (
                            !isFinalChallenge && <Button onClick={advanceAfterExplanation} className="bg-yellow-500 hover:bg-yellow-600 text-black ml-auto">Next Question <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        )}
                    </div>
                </motion.div>
            </div>
        )
    };

    const renderCompletion = () => (
        <div className="max-w-4xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">

                {hasPassed ? (
                    <>
                        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                        <h2 className="text-4xl font-bold text-white mb-4">Congratulations!!!</h2>
                        <p className="text-green-200 text-lg mb-8">
                            You have successfully completed the Bluffs: Breakeven Situations & No-Bluff Situations mini-game. You now have the knowledge on how to accurately calculate the break-even percentage for a bluff or hero call, and Identify Optimal Bluff/No-Bluff Spots. This is a very Important ability that will help you to calculate and understand your real probability to win a hand at the end of the stretch situations, providing an important knowledge for your decision making. Keep practicing and applying what you have learned!
                        </p>
                        <Button onClick={completeGame} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                            Complete Game <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </>
                ) : (
                    <>
                        <ThumbsDown className="w-16 h-16 text-red-400 mx-auto mb-6" />
                        <h2 className="text-4xl font-bold text-white mb-4">Not quite...</h2>
                         <p className="text-red-200 text-lg mb-8">
                            You did not have enough correct answers. Remember, you need at least 4 out of 5 correct. Go and try again to complete this minigame. You Can Do It!
                        </p>
                        <Button onClick={() => {
                            setCurrentStage('final_challenge_intro');
                            setQuestionIndex(0);
                            setFinalChallengeAnswers([]);
                            resetForNextQuestion();
                        }} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 text-lg">
                            <RefreshCw className="mr-2 w-5 h-5" /> Try Again
                        </Button>
                    </>
                )}
            </motion.div>
        </div>
    );

    const renderContent = () => {
        switch (currentStage) {
            case 'intro': return renderIntro();
            case 'explanation': return renderExplanation();
            case 'game_intro': return renderGameIntro();
            case 'stage1_intro': return renderStageIntro("Stage 1: Live Demo", "The system will display two solved examples, demonstrating key concepts of bluffing.", 'live_demo');
            case 'live_demo': return renderLiveDemo();
            case 'stage2_intro': return renderStageIntro("Stage 2: Guided Practice", "A small set of questions designed to reinforce the concepts with active hints. There are 3 questions in this stage.", 'stage2_practice');
            case 'stage2_practice': return renderPracticeStage(stage2Questions, "Stage 2: Guided Practice");
            case 'stage3_intro': return renderStageIntro("Stage 3: Independent Practice", "A set of questions mixing calculations and spot identification, without hints. You'll get immediate feedback. There are 5 questions in this stage.", 'stage3_practice');
            case 'stage3_practice': return renderPracticeStage(stage3Questions, "Stage 3: Independent Practice");
            case 'final_challenge_intro': return renderStageIntro("Final Stage: The Bluff Challenge", "A timed series of 5 mixed poker scenarios. You have 30 seconds per question. You must correctly answer at least 4 out of 5 questions to pass.", 'final_challenge');
            case 'final_challenge': return renderPracticeStage(finalChallengeQuestions, "Final Stage: The Bluff Challenge");
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
