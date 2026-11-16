
import React, { useState, useEffect, useCallback } from "react";
import { UserService as User } from "@/services/user";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, TrendingUp, Shield, ThumbsDown, Lightbulb, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayingCard from "../components/shared/PlayingCard";
import PokerTable from "../components/game2/PokerTable";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Understanding Slow-Playing",
        content: "Slow playing is a key skill in poker, allowing you to maximize your winnings with very strong hands by playing them deceptively weakly at first. Instead of betting or raising immediately, you choose to check or call, aiming to induce more action and build a larger pot in later betting rounds.",
        icon: Eye
    },
    {
        title: "Part A: The Essence of Slowplaying",
        content: "Slowplaying involves playing a strong hand in a way that understates its true value, often by checking or just calling instead of raising. The primary goal is to 'suck people in' by giving opponents the impression that your hand is not as strong as it is, encouraging them to put more money into the pot in subsequent betting rounds. This differs from a check-raise, which is typically playing weakly to raise in the same round. ",
        icon: Eye
    },
    {
        title: "Part A: The Essence of Slowplaying",
        content: "With slowplaying, the weakness extends to calling or checking when you could otherwise bet or raise. The effectiveness of slowplaying comes from disguising your hand's strength, preventing opponents from folding immediately and allowing you to win a significantly larger pot.",
        icon: Eye
    },
    {
        title: "Part A: The Essence of Slowplaying - Example",
        content: "You have three-of-a-kind on the flop. Instead of betting or raising strongly, you check or make a small call, hoping an opponent with a draw or weaker pair will also call, believing their hand is sufficient or that they can improve cheaply.",
        icon: Eye
    },
    {
        title: "Part B: Key Requirements for a Correct Slowplay",
        content: "For slowplaying to be a profitable strategy, specific conditions must be met. First, you must have a very strong hand, such as three-of-a-kind on the flop, a full house, or a four-flush with a straight draw. It's crucial that you are highly confident your hand is the best and will likely remain so.",
        icon: Eye
    },
    {
        title: "Part B: Key Requirements for a Correct Slowplay",
        content: "Second, the free card or cheap card you allow other players to receive must have good possibilities of making them a second-best hand. This means their hand improves to something decent, but still inferior to yours, making them willing to pay off future bets. ",
        icon: Eye
    },
    {
        title: "Part B: Key Requirements for a Correct Slowplay",
        content: "Third, this same free card must have little chance of making someone a better hand than yours or even giving them a draw to a hand that will have sufficient odds to beat you. You should avoid slowplaying if there's a significant risk that an opponent could easily outdraw you to a superior hand, like if you have a four-flush and there's a good chance an opponent could make a full house on the next card.",
        icon: Eye
    },
    {
        title: "Part C: Pot Dynamics and Driving Opponents Out",
        content: "Beyond hand strength, the success of slowplaying depends on managing the pot and opponent reactions. You must be confident that you will eventually drive other players out by showing aggression later in the hand, but also that you have a good chance of winning a big pot if you don't. This means you aren't reliant solely on the slowplay working perfectly; you can still bet for value later. ",
        icon: Eye
    },
    {
        title: "Part C: Pot Dynamics and Driving Opponents Out",
        content: "Another important case is that pot must not yet be very large. If the pot is already substantial, you are often better off betting immediately to claim it. A large pot offers too good of odds to drawing hands, making it a 'mistake' to give them a free or cheap card. Betting out helps reduce opponents' odds and prevents them from drawing cheaply.",
        icon: Eye
    },
    {
        title: "Part C: Pot Dynamics and Driving Opponents Out - Example",
        content: "If the pot is currently $20, and you have a monster hand, slowplaying might be effective to entice more money. If the pot is already $100, slowplaying is generally a bad idea because you're giving too favorable odds to opponents.",
        icon: Eye
    },
    {
        title: "Part D: Risks and Dangers of Slowplaying",
        content: "The primary danger of slowplaying is that you might give your opponents too favorable odds to draw to a hand that beats yours, especially when the pot is already large. By checking or calling, you concede a 'free card' or a 'cheap card'. If this card allows an opponent to improve to a hand that is stronger than yours (not just second-best), or to a draw that then has correct odds to continue, your slowplay becomes a significant error. ",
        icon: Eye
    },
    {
        title: "Part D: Risks and Dangers of Slowplaying",
        content: "This is particularly risky when your hand is vulnerable to being outdrawn, or when your strength is already obvious to savvy opponents. Ultimately, the goal is to win the largest possible pot; if slowplaying risks losing the pot or winning a smaller one, it's incorrect.",
        icon: Eye
    },
    {
        title: "Part D: Risks and Dangers of Slowplaying - Example",
        content: "Example: You slowplay a strong flush but the board pairs on a later street, allowing an opponent to hit a full house that beats your flush. Your initial 'smart' slowplay led to losing a much larger pot.",
        icon: Eye
    }
];

const demoScenarios = [
    {
        title: "Demo 1 - Correct Slowplay",
        steps: [
            {
                step: 1,
                title: "Pre-Flop Setup",
                explanation: "You are Under the Gun with pocket Aces. The pot is small with just the blinds. Two opponents call behind you.",
                players: [
                    { position: "UTG", stack: 1000, bet: 0, cards: ["A♠", "A♣"], status: "(You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 980, bet: 20, cards: [], status: "Calls", isCurrent: false, isHero: false },
                    { position: "CO", stack: 980, bet: 20, cards: [], status: "Calls", isCurrent: false, isHero: false },
                    { position: "SB", stack: 990, bet: 10, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 980, bet: 20, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: [],
                pot: 70
            },
            {
                step: 2,
                title: "The Flop - Perfect Slowplay Spot",
                explanation: "The flop comes A-7-2 rainbow. You have set of Aces on a very dry board. No flush or straight draws possible. This is an ideal slowplay situation.",
                players: [
                    { position: "UTG", stack: 1000, bet: 0, cards: ["A♠", "A♣"], status: "Checks (You)", isCurrent: true, isHero: true },
                    { position: "MP", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "CO", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "SB", stack: 990, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: ["A♥", "7♦", "2♠"],
                pot: 70
            },
            {
                step: 3,
                title: "Opponent Takes the Bait",
                explanation: "You check, and the Middle Position player bets $40. By showing weakness, you've induced action from a weaker hand. You just call to keep them in.",
                players: [
                    { position: "UTG", stack: 960, bet: 40, cards: ["A♠", "A♣"], status: "Calls (You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 940, bet: 40, cards: [], status: "Bets $40", isCurrent: false, isHero: false },
                    { position: "CO", stack: 980, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false },
                    { position: "SB", stack: 990, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false },
                    { position: "BB", stack: 980, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false }
                ],
                communityCards: ["A♥", "7♦", "2♠"],
                pot: 150
            },
            {
                step: 4,
                title: "The Result",
                explanation: "Perfect! Your slowplay worked. The dry board meant no dangerous cards could come, and you successfully built a larger pot by disguising your monster hand. You can now bet for value on later streets.",
                players: [
                    { position: "UTG", stack: 960, bet: 0, cards: ["A♠", "A♣"], status: "(You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 940, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "CO", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "SB", stack: 990, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: ["A♥", "7♦", "2♠"],
                pot: 150
            }
        ]
    },
    {
        title: "Demo 2 - Incorrect Slowplay",
        steps: [
            {
                step: 1,
                title: "Pre-Flop - Large Pot Already",
                explanation: "You have pocket 7s. After raises and re-raises pre-flop, the pot is already very large at $300. This changes the slowplay dynamics significantly.",
                players: [
                    { position: "UTG", stack: 850, bet: 150, cards: ["7♠", "7♦"], status: "(You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 850, bet: 150, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "CO", stack: 1000, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false },
                    { position: "SB", stack: 1000, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false },
                    { position: "BB", stack: 1000, bet: 0, cards: [], status: "Folds", isCurrent: false, isHero: false }
                ],
                communityCards: [],
                pot: 300
            },
            {
                step: 2,
                title: "The Flop - Dangerous Board",
                explanation: "Flop: K♥Q♥7♣. You have a set, but this is a very wet board with flush and straight draws. The large pot gives drawing hands good odds. You should bet, but let's see what happens if you slowplay...",
                players: [
                    { position: "UTG", stack: 850, bet: 0, cards: ["7♠", "7♦"], status: "Checks (You)", isCurrent: true, isHero: true },
                    { position: "MP", stack: 850, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "CO", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "SB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: ["K♥", "Q♥", "7♣"],
                pot: 300
            },
            {
                step: 3,
                title: "Opponent Bets - You Call (Mistake)",
                explanation: "Your opponent bets $100 (likely with a flush draw). You just call instead of raising. This gives them favorable odds to continue with their draw. The large pot makes this call very attractive for them.",
                players: [
                    { position: "UTG", stack: 750, bet: 100, cards: ["7♠", "7♦"], status: "Calls (You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 750, bet: 100, cards: [], status: "Bets $100", isCurrent: false, isHero: false },
                    { position: "CO", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "SB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: ["K♥", "Q♥", "7♣"],
                pot: 500
            },
            {
                step: 4,
                title: "The Turn - Disaster Strikes",
                explanation: "Turn: J♥. Your opponent just made their flush! Your slowplay backfired. By not betting on the flop, you gave them favorable odds to draw out on your set. This is why slowplaying on wet boards with large pots is dangerous.",
                players: [
                    { position: "UTG", stack: 750, bet: 0, cards: ["7♠", "7♦"], status: "(You)", isCurrent: false, isHero: true },
                    { position: "MP", stack: 750, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "CO", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "SB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
                    { position: "BB", stack: 1000, bet: 0, cards: [], status: "", isCurrent: false, isHero: false }
                ],
                communityCards: ["K♥", "Q♥", "7♣", "J♥"],
                pot: 500
            }
        ]
    }
];

const stage2Questions = [
    {
        board: ["K♠", "8♦", "8♣"],
        hand: ["8♥", "8♠"],
        scenario: "You have four-of-a-kind on a paired board. An aggressive opponent is in the hand with you.",
        question: "Is this a good situation to slow-play by checking?",
        options: ["Yes, great spot to slow-play", "No, should bet for value"],
        correct: 0,
        explanation: "Yes. You have the nuts, making it impossible to be outdrawn. Against an aggressive opponent, checking can induce a bluff, allowing you to trap them and win a bigger pot.",
        hint: "Consider the strength of your hand and your opponent's likely actions if you show weakness."
    },
    {
        board: ["A♥", "K♦", "7♠"],
        hand: ["A♣", "Q♣"],
        scenario: "You have top pair, good kicker. You are against two passive opponents.",
        question: "Is this a good situation to slow-play?",
        options: ["Yes, disguise your hand", "No, bet for value and protection"],
        correct: 1,
        explanation: "No. Your hand is strong but vulnerable. Slow-playing against passive opponents means the pot won't get built, and you give them a chance to draw to a better hand for free. You must bet for value.",
        hint: "Is your hand a 'monster'? Will your opponents bet if you check?"
    },
    {
        board: ["9♥", "10♥", "J♥"],
        hand: ["Q♥", "K♥"],
        scenario: "You flop a straight flush on a very coordinated (wet) board.",
        question: "What is the primary risk of slow-playing here?",
        options: ["Not building a big enough pot", "Letting an opponent draw to a better hand", "There is no risk"],
        correct: 0,
        explanation: "While it's impossible to be outdrawn, the biggest risk is that the scary board might prevent you from getting paid on later streets. By not betting, you miss the opportunity to build the pot while opponents might still have hands they are willing to continue with (like a lower flush).",
        hint: "Think about how the board texture affects your opponents' willingness to put money in the pot on later streets."
    }
];

const finalChallengeQuestions = [
    {
        hand: ["7♠", "7♦"],
        board: ["7♥", "K♣", "2♦"],
        opponent: "Aggressive",
        question: "You flop a set. Good spot to slow-play?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. With a monster hand against an aggressive player, checking can induce a bluff and let you build a bigger pot."
    },
    {
        hand: ["A♠", "J♠"],
        board: ["A♥", "10♦", "2♣"],
        opponent: "Passive",
        question: "Top pair, top kicker vs. a passive player. Slow-play?",
        options: ["Yes", "No"],
        correct: 1,
        feedback: "No. Your hand is not strong enough to be considered a 'monster', and a passive opponent is unlikely to bet for you. You must bet for value."
    },
    {
        hand: ["K♠", "Q♠"],
        board: ["9♠", "10♠", "J♠"],
        opponent: "Unknown",
        question: "You flop a straight flush. Slow-play?",
        options: ["Yes", "No, bet now"],
        correct: 1,
        feedback: "No, bet now. While you can't be outdrawn, the scary board means you might not get paid on later streets. It's often better to bet and build the pot while opponents might still have hands they're willing to play."
    },
    {
        hand: ["5♣", "5♦"],
        board: ["A♠", "A♥", "5♠"],
        opponent: "Aggressive",
        question: "You flop a full house. Slow-play?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. This is a classic slow-play situation. Your hand is incredibly strong and well-disguised. Checking to an aggressive player is the perfect trap."
    },
    {
        hand: ["A♠", "K♠"],
        board: ["Q♦", "J♣", "10♥"],
        opponent: "Passive",
        question: "You flop the nut straight. Slow-play?",
        options: ["Yes", "No"],
        correct: 1,
        feedback: "No. Against a passive opponent, you must take the initiative to build the pot. They are unlikely to bet for you, so checking misses out on value."
    }
];

const StageDivider = ({ title, description, onContinue, showPassingCriteria = false }) => (
    <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-700/50 shadow-2xl"
      >
        <Eye className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-heading">{title}</h2>
        {description && <p className="text-green-200 text-lg mb-6">{description}</p>}
        {showPassingCriteria && (
          <div className="bg-yellow-400/10 rounded-xl p-4 mb-6 border border-yellow-400/30">
            <p className="text-yellow-200 font-semibold">
              <strong>Passing Criteria:</strong> You need to answer at least 4 out of 5 questions correctly to pass this challenge.
            </p>
          </div>
        )}
        <Button onClick={onContinue} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
          Continue <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </div>
);

export default function Game22() {
    const [currentStage, setCurrentStage] = useState('intro');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentDemo, setCurrentDemo] = useState(0);
    const [currentDemoStep, setCurrentDemoStep] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [user, setUser] = useState(null);
    const gameId = 22;
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
            await User.completeGame(22);
        }
        navigate(createPageUrl("Home"));
    };

    const handleNextQuestion = () => {
        setShowExplanation(false);
        setSelectedAnswer(null);
        if (currentQuestion < stage2Questions.length - 1) {
            setCurrentQuestion(q => q + 1);
        } else {
            setCurrentStage('final_challenge_intro'); // Transition to final challenge intro
            setCurrentQuestion(0); // Reset for final challenge
            setFinalScore(0); // Reset score for final challenge
        }
    };

    const handleFinalChallengeAnswer = () => {
        if (showExplanation) {
            // Move to next question or completion
            if (currentQuestion < finalChallengeQuestions.length - 1) {
                setCurrentQuestion(q => q + 1);
                setShowExplanation(false);
                setSelectedAnswer(null);
            } else {
                setCurrentStage('completion');
            }
        } else {
            // Check answer
            if (selectedAnswer === finalChallengeQuestions[currentQuestion].correct) {
                setFinalScore(s => s + 1);
            }
            setShowExplanation(true);
        }
    };

    const retryFinalChallenge = () => {
        setCurrentStage('final_challenge');
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setFinalScore(0);
    };

    const renderIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <Eye className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Game 22: Slow-Play Strategy</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Requirements & Risks</h2>
                <p className="text-green-200 text-lg mb-8">
                    Master the art of deceptive play with strong hands while understanding when slow-playing becomes dangerous.
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
                        <Button onClick={() => { setCurrentStage('stage1'); setCurrentDemo(0); setCurrentDemoStep(0); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Watch Live Demos <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    )}
                </div>
            </div>
        );
    };

    const renderStage1 = () => {
        const demo = demoScenarios[currentDemo];
        const step = demo.steps[currentDemoStep];

        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-600/30">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">{demo.title}</h2>
                    <p className="text-center text-yellow-300 mb-6">Step {currentDemoStep + 1} of {demo.steps.length}</p>
                    <h3 className="text-xl font-bold text-white text-center mb-4">{step.title}</h3>

                    <br /> <br /> <br /> <br />
                        <div className="w-full h-[500px] relative mb-4">
                            <PokerTable
                                players={step.players}
                                communityCards={step.communityCards}
                                dealerPosition="BTN"
                                pot={step.pot}
                            />
                        </div>
                        <div className="bg-green-950/30 rounded-lg p-4">
                            <p className="text-green-200 text-lg text-center">{step.explanation}</p>
                        </div>


                    <div className="flex justify-between items-center">
                        <Button
                            onClick={() => {
                                if (currentDemoStep > 0) {
                                    setCurrentDemoStep(s => s - 1);
                                } else if (currentDemo > 0) {
                                    setCurrentDemo(d => d - 1);
                                    setCurrentDemoStep(demoScenarios[currentDemo - 1].steps.length - 1);
                                }
                            }}
                            disabled={currentDemo === 0 && currentDemoStep === 0}
                            variant="outline"
                            className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/20"
                        >
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Previous
                        </Button>

                        <div className="text-center">
                            <p className="text-yellow-300">Demo {currentDemo + 1} of {demoScenarios.length}</p>
                        </div>

                        {currentDemo < demoScenarios.length - 1 || currentDemoStep < demo.steps.length - 1 ? (
                            <Button
                                onClick={() => {
                                    if (currentDemoStep < demo.steps.length - 1) {
                                        setCurrentDemoStep(s => s + 1);
                                    } else {
                                        setCurrentDemo(d => d + 1);
                                        setCurrentDemoStep(0);
                                    }
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                            >
                                Next
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    setCurrentStage('practice_intro'); // Transition to practice intro
                                    setCurrentQuestion(0);
                                    setSelectedAnswer(null);
                                    setShowExplanation(false);
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                            >
                                Start Practice
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPractice = () => {
        const question = stage2Questions[currentQuestion];
        const isCorrect = selectedAnswer === question.correct;
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Practice Round</h2>
                    <p className="text-center text-green-300 mb-6">Question {currentQuestion + 1} of {stage2Questions.length}</p>

                    <div className="bg-white/5 rounded-xl p-6 mb-6">
                        <p className="text-green-200 text-lg text-center mb-4">{question.scenario}</p>
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
                            <p className="text-green-200">{question.explanation}</p>
                        </div>
                    )}

                    {!showExplanation && selectedAnswer !== null && (
                         <div className="text-center">
                            <Button onClick={() => { if(selectedAnswer === question.correct) { handleNextQuestion() } else { setShowExplanation(true) } } } className="bg-green-600 hover:bg-green-700 text-white">
                                Submit
                            </Button>
                        </div>
                    )}

                    {showExplanation && (
                         <div className="text-center">
                         <Button onClick={handleNextQuestion} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                             Next
                         </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFinalChallenge = () => {
        const question = finalChallengeQuestions[currentQuestion];
        const isCorrect = selectedAnswer === question.correct;
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-red-600/30">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Final Challenge</h2>
                    <p className="text-center text-red-300 mb-6">Question {currentQuestion + 1} of {finalChallengeQuestions.length}</p>

                    <div className="bg-white/5 rounded-xl p-6 mb-6">
                         <div className="flex justify-center items-center gap-4 mb-4">
                            <p className="text-white font-bold">Board:</p>
                            <div className="flex gap-2">
                                {question.board.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <p className="text-white font-bold">Your Hand:</p>
                            <div className="flex gap-2">
                                {question.hand.map(card => <PlayingCard key={card} card={card} />)}
                            </div>
                        </div>
                         <p className="text-green-200 text-lg text-center mt-4">Opponent is <span className="font-bold text-yellow-400">{question.opponent}</span>.</p>
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
                            onClick={handleFinalChallengeAnswer}
                            disabled={selectedAnswer === null && !showExplanation}
                            className={`px-8 py-3 text-lg ${showExplanation ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-red-600 hover:bg-red-700 text-white"}`}
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
        return (
            <div className="max-w-4xl mx-auto text-center">
                <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${passed ? 'border-green-600/30' : 'border-red-600/30'}`}>
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-4">Challenge Complete!</h2>
                    <div className="bg-white/10 rounded-xl p-6 mb-8">
                        <h3 className="2xl font-bold text-white mb-2">Your Score: {finalScore} / {finalChallengeQuestions.length}</h3>
                        <p className={`font-bold text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
                            {passed ? "Excellent! You've mastered the art of the slow-play." : "Good try. Review the concepts to perfect your deception skills."}
                        </p>
                    </div>
                    {passed ? (
                        <>
                            <p className="text-green-200 text-lg mb-8">
                                Congratulations! You can now identify the precise conditions required for a profitable slow-play and understand the associated risks.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-red-200 text-lg mb-8">
                                Understanding slow-play timing is crucial for poker success. Review the key concepts and try again.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={retryFinalChallenge} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 text-lg">
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
            case 'stage1': return renderStage1();
            case 'practice_intro': return <StageDivider
                title="Practice Round"
                description="Test your understanding of slow-play concepts with guided feedback."
                onContinue={() => setCurrentStage('practice')}
            />;
            case 'practice': return renderPractice();
            case 'final_challenge_intro': return <StageDivider
                title="Final Challenge"
                description="Demonstrate your mastery of slow-play strategy in real scenarios."
                onContinue={() => setCurrentStage('final_challenge')}
                showPassingCriteria={true}
            />;
            case 'final_challenge': return renderFinalChallenge();
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
                    key={currentStage + currentQuestion + currentSlide + currentDemo + currentDemoStep}
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
