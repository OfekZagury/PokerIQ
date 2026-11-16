
import React, { useState, useEffect } from 'react';
import { UserService as User } from "@/services/user";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, Shield, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayingCard from '../components/shared/PlayingCard';
import PokerTable from '../components/game2/PokerTable';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: 'Implied Odds - Introduction',
        content: "During the early and middle betting rounds, calling future bets often reduces your actual or effective pot odds significantly. However, there are times when the reason for calling is the potential for future wins. Your immediate pot odds may not justify calling one more card, but one card could give you a monster hand that will allow you to win a lot of action. In these cases, you often don't need the initial pot odds to justify calling.",
        icon: CheckCircle
    },
    {
        title: 'What are Implied Odds?',
        content: "Implied odds are based on the possibility of winning additional money in later betting rounds, beyond what is already in the pot. More precisely, implied odds are the ratio of your expected total win to the total cost of your current call as your hand improves. Understanding them is essential for making informed decisions beyond the immediate pot odds.",
        icon: Target
    },
    {
        title: 'Calculating Implied Odds',
        content: " A good example of a hand play for implied odds occurs in Hold'em, when you have a small pair in the hole. If you are getting 8 to 1 odds against hitting a set on the flop, and the immediate pot odds are 5 to 1, in many cases a call is worth it. If there is $50 in the pot and $10 to bet, you are getting 150 to 10 or 15 to 1 odds. On average, you will win an extra $100 if you flop a set.",
        icon: Target
    },
    {
        title: 'Implied Odds vs. Pot Odds',
        content: "Implied odds are very different from regular pot odds. When you calculate pot odds, you are only focusing on the money that is already in the pot at the moment. Implied odds, on the other hand, take into account the additional money you expect to win in future betting rounds if your hand improves significantly. This is a long-term view of the profitability of the hand",
        icon: Shield
    },
    {
        title: 'Implied Odds in Pot-Limit and No-Limit Games',
        content: "In general, the greater the difference between your future bets and your call, the greater your implied odds. Implied odds become most significant in pot-limit and no-limit games, where a future bet can be as large as the amount of money a player has in front of him. In fact, in these games, it is almost always about how much money can be won in the future, not just what is currently in the pot",
        icon: Shield
    },
    {
        title: 'Classic Example: The 1980 World Championship',
        content: "A classic example of this occurred in the finals of the No-Limit Hold'em at Binions Horseshoe Casino, where Doyle Bronson held $232,500 against Stu Unger, who had $497,500. Unger held 4,5,7 and Bronson had A,2,7. Preflop, Bronson bet $30,000, and the community cards were 2,7,A. Unger checked, despite his relatively strong hand, but intended to lure Bronson into a trap.",
        icon: Trophy
    },
    {
        title: 'Ungers Analysis',
        content: "Unger admitted to Ketchup that calling in this case was a 'poor bet. But if Doyle has a hand, it's worth $17,000 because if I get a 3, then I'm going to cheat him. Unger's call was perfectly justified in terms of implied odds. Unger didn't have 3-to-1 odds, the amount of money he gave Bronson was $47,000 in the pot, and the odds were 14.5-to-1.",
        icon: Target
    },
    {
        title: 'Factors That Determine Implied Odds',
        content: "When you estimate your implied odds, you need to predict how much money you could win if you complete your hand. This prediction depends on three factors: \n 1. The size of the future bets. \n 2. How hidden your hand is. \n 3. The ability of your opponents. Understanding these factors will improve your ability to identify profitable situations.",
        icon: Users
    },
    {
        title: 'Factor 1: The Size of the Future Bets',
        content: "The larger the potential bet size, the greater your implied odds, and the main reason to call with a hand that is likely to improve. In addition to the possibility of future bets, you should consider the strength of your hand. An example of this is a situation where an opponent bets $10 into a $20 pot in a $10-$20 game with an open path to a straight. If you expect to win an additional $40 in future rounds, your implied odds are $70 to $10 or $7 to 1.",
        icon: Users
    },
    {
        title: 'Factor 2: Hiding Your Hand',
        content: "When your winning cards are hidden, you expect to win more money than your opponent. On the other hand, if your hand is clearly visible, your opponents may simply fold and not call you. Hiding your hand increases the chance that you will be able to pull more money from the pot after your hand improves, thereby maximizing your profits.",
        icon: Users
    },
    {
        title: 'Factor 3: Your Opponents Strength',
        content: "If you are playing against weaker opponents, they are more likely to call future bets even if your hand improves and threatens. Tougher players, on the other hand, will fold more easily when they see a threat. The ability to distinguish between weak and strong players directly affects the level of your implied odds, and therefore the worth of a call.",
        icon: Users
    },
    {
        title: 'Caution with Implied Odds',
        content: "Two important caveats about implied odds: First, implied odds do not apply when your opponent is already all-in or almost all-in. Second, implied odds have little meaning when there is only one more card to come, and your hand is still significantly behind.",
        icon: Users
    },
    {
        title: 'Example Scenarios',
        content: "The following scenarios will present situations that demonstrate the concept of implied odds and the importance of considering them in decision-making.",
        icon: ThumbsUp
    }
];

const interactiveScenarios = [
    {
        title: 'Scenario 1: Small Pair with a Potential Set',
        players: [
            { position: "UTG", stack: 1000, bet: 0, cards: ["3♠", "3♥"], status: "(You)", isCurrent: true, isHero: true },
            { position: "CO", stack: 995, bet: 5, cards: ["A♦", "K♥"], status: "Bets $5", isCurrent: false, isHero: false },
            { position: "SB", stack: 990, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
            { position: "BB", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
        ],
        communityCards: ['Q♦', '7♣', '2♥'],
        pot: 25, // Initial $20 pot + $5 bet
        situation: "You have a small pair. The immediate pot odds are 5 to 1, but the odds against hitting your set are ~8 to 1. Is this call profitable long-term?",
        questions: [
            "Do you expect your opponent to continue betting if you complete your set, increasing the pot size?",
            "Will your hand (a set) be well-disguised, allowing you to win a larger pot from weaker hands?"
        ],
        summary: "Correct. Although immediate pot odds aren't great, high implied odds make this call profitable. If you hit your hidden set, you're likely to win a much larger pot from your opponent."
    },
    {
        title: 'Scenario 2: Open Straight with Potential for Future Bets',
        players: [
            { position: "UTG", stack: 1000, bet: 0, cards: ["Q♠", "8♦"], status: "(You)", isCurrent: true, isHero: true },
            { position: "MP", stack: 990, bet: 10, cards: ["J♦", "A♠"], status: "Bets $10", isCurrent: false, isHero: false },
            { position: "SB", stack: 990, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
            { position: "BB", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
        ],
        communityCards: ['9♦', '10♥', 'J♣'],
        pot: 30, // Initial $20 pot + $10 bet
        situation: "You have an open-ended straight draw (8 outs). The pot odds are 3 to 1. Should you call based on future potential profit?",
        questions: [
            "Assuming you complete your straight, is your opponent likely to call future bets?",
            "Will your straight be obvious, or could it remain hidden enough to extract more value?"
        ],
        summary: "Correct. The immediate pot odds are borderline, but the call is justified by significant implied odds. If you hit your straight, you'll likely have the best hand and can win a much larger pot, making the initial call profitable."
    },
    {
        title: 'Scenario 3: Flush Draw in a Multi-Handed Pot',
        players: [
            { position: "UTG", stack: 1000, bet: 0, cards: ["J♠", "5♠"], status: "(You)", isCurrent: true, isHero: true },
            { position: "MP", stack: 985, bet: 15, cards: ["K♣", "Q♣"], status: "Bets $15", isCurrent: false, isHero: false },
            { position: "CO", stack: 985, bet: 15, cards: ["A♥", "8♥"], status: "Calls $15", isCurrent: false, isHero: false },
            { position: "SB", stack: 990, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
            { position: "BB", stack: 980, bet: 0, cards: [], status: "", isCurrent: false, isHero: false },
        ],
        communityCards: ['K♠', '8♠', '3♥'],
        pot: 90, // Initial $60 + $15 bet + $15 call
        situation: "You have a flush draw in a multi-way pot. Pot odds are 6 to 1. With multiple opponents invested, are the implied odds high enough to call?",
        questions: [
            "How likely are Opponents A and B to continue betting if you complete your flush?",
            "Will your flush be hidden enough to maximize profit from opponents holding strong (but second-best) hands?"
        ],
        summary: "Correct. With multiple opponents building the pot, your implied odds are huge. Even if immediate pot odds are just okay, the potential to win a massive pot if you hit your flush makes this a clear and profitable call."
    }
];

export default function Game18() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [interactiveStep, setInteractiveStep] = useState(0); // 0: situation, 1: question 1, 2: question 2, 3: summary
  const [user, setUser] = useState(null);
  const gameId = 18;
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

  const handleSlideChange = (newSlide) => {
    setSlideDirection(newSlide > currentSlide ? 1 : -1);
    setCurrentSlide(newSlide);
  };

  const completeGame = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    completedRef.current = true;
    const spentSec = timer.readSeconds();
    track("Game Completed", { gameId, spentSec });
    await User.completeGame(18);
    navigate(createPageUrl("Home"));
  };

  const handleNextInteractiveStep = () => {
    if (interactiveStep < 3) {
        setInteractiveStep(s => s + 1);
    } else {
        // Move to next scenario or go to conclusion
        if (activeScenarioIndex < interactiveScenarios.length - 1) {
            setActiveScenarioIndex(s => s + 1);
            setInteractiveStep(0);
        } else {
            setCurrentStage('conclusion');
        }
    }
  };

  const renderIntro = () => (
    <div className="max-w-4xl mx-auto text-center">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
            <ThumbsUp className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Game 18: Learning Implied Odds</h1>
            <h2 className="text-2xl font-semibold text-green-300 mb-6">Recognizing Hidden Dangers</h2>
            <p className="text-green-200 text-lg mb-8">
                Learn to spot situations where hitting your draw could cost you your entire stack.
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
                            <p className="text-green-200 text-lg leading-relaxed whitespace-pre-line">{slide.content}</p>
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
                    <Button onClick={() => setCurrentStage('interactive')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">See Examples <ArrowRight className="ml-2 w-4 h-4" /></Button>
                )}
            </div>
        </div>
    );
  };

  const renderInteractive = () => {
    const scenario = interactiveScenarios[activeScenarioIndex];
    let content;

    switch (interactiveStep) {
        case 0:
            content = <p className="text-green-200 text-center">{scenario.situation}</p>;
            break;
        case 1:
            content = <p className="text-yellow-300 font-semibold text-center">"{scenario.questions[0]}"</p>;
            break;
        case 2:
            content = <p className="text-yellow-300 font-semibold text-center">"{scenario.questions[1]}"</p>;
            break;
        case 3:
            content = <p className="text-green-200 font-bold text-center">{scenario.summary}</p>;
            break;
        default:
            content = null;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-6">{scenario.title}</h2>
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <div className="w-full h-[350px] md:h-[450px] relative mb-4">
                    <PokerTable
                        players={scenario.players}
                        communityCards={scenario.communityCards}
                        pot={scenario.pot}
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={interactiveStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/10 rounded-xl p-6 min-h-[120px] flex items-center justify-center"
                    >
                        {content}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex justify-center items-center mt-6">
                <Button onClick={handleNextInteractiveStep} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    {interactiveStep < 3 ? 'Continue' : (activeScenarioIndex < interactiveScenarios.length - 1 ? 'Next Scenario' : 'Complete Game')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );
  };

  const renderConclusion = () => (
    <div className="max-w-4xl mx-auto text-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30"
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
            >
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-4xl font-bold text-white mb-4">Implied Odds Learned!</h1>

            <motion.div
                className="bg-green-950/30 rounded-xl p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <p className="text-green-200 text-lg leading-relaxed">
                    You have now learned the concept of implied odds, which is a very important tool in postflop analysis.
                    Understanding this will help you identify situations where calling may seem unprofitable in the immediate term,
                    but holds significant potential for profit in future betting rounds if your hand improves. This is a critical
                    element of strategic thinking in poker.
                </p>
            </motion.div>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={completeGame}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
                >
                    Complete Game
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (currentStage) {
        case 'intro': return renderIntro();
        case 'explanation': return renderExplanation();
        case 'interactive': return renderInteractive();
        case 'conclusion': return renderConclusion();
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
                key={currentStage + activeScenarioIndex}
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
