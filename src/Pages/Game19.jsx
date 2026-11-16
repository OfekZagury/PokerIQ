
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
        title: 'Reverse Implied Odds - Introduction',
        content: "Understanding Reverse Implied Odds is crucial for professional poker players, as it highlights situations where what appears to be a good call based on immediate pot odds can actually lead to greater losses over time. ",
        icon: CheckCircle
    },
    {
        title: 'Reverse Implied Odds - Introduction',
        content: "Unlike Implied Odds, which account for additional money you expect to win in future betting rounds if your hand improves, Reverse Implied Odds describe situations where you are likely to lose more money in later betting rounds, even if your hand does improve.",
        icon: Target
    },
    {
        title: 'Reverse Implied Odds - Introduction',
        content: "This concept is especially important for marginal or drawing hands, where improving your hand might still result in losing a larger pot.",
        icon: Shield
    },
    {
        title: 'Part A: The Core Concept',
        content: "Reverse Implied Odds occur when your odds of winning are actually worse than they initially appear, particularly concerning future bets. The underlying idea is that even if your hand improves, your opponent's hand might improve to a better hand, or they may simply have a strong hand that will extract more money from you. This is a critical distinction from standard pot odds or implied odds, as it focuses on the potential for negative expectation in subsequent betting rounds. ",
        icon: Shield
    },
    {
        title: 'Part A: The Core Concept',
        content: "When faced with a bet, if your hand is mediocre and has only a small chance of improving, and you suspect your opponent will continue to bet aggressively, you are likely facing reverse implied odds. The true odds you are getting are effectively much lower than the visible pot odds, often making what seems like a profitable call into a losing proposition.",
        icon: Trophy
    },
    {
        title: 'Part B: Identifying Situations and Calculating the Risk',
        content: "You are typically in a Reverse Implied Odds situation when:\n" +
            "1.\tYou are uncertain about your hand's strength relative to your opponent's.\n" +
            "2.\tYour hand has only a small likelihood of improving sufficiently to beat your opponent's hand or their potential hand.\n" +
            "3.\tCalling the current bet commits you to calling future bets throughout the remainder of the hand.\n" +
            "4.\tYour opponent has the flexibility to fold if their hand does not improve or if you show unexpected strength.\n",
        icon: Target
    },
    {
        title: 'Part B: Identifying Situations and Calculating the Risk - Example',
        content: "Consider an example: Suppose there's $50 in the pot, and your opponent bets $20. You have a drawing hand, and you think you might be ahead, but you're not confident, and you have a small chance of improving. If you call, you are getting immediate pot odds of $70 to $20 (or 3.5-to-1). However, if your hand doesn't improve, or if your opponent's hand is indeed better and they continue to bet, you might be forced to call additional bets later. ",
        icon: Users
    },
    {
        title: 'Part B: Identifying Situations and Calculating the Risk – Example (cont)',
        content: "Let's say your opponent bets another $40 on the next round. If you call both bets and lose, you've lost $60 (the initial $20 plus the subsequent $40). But if you win, your opponent might fold to your bet, meaning you only win the current $70 in the pot. Therefore, your effective odds are not $70 to $20, but rather $70 to $60 (risking $60 to win $70), which is much worse. This demonstrates that the money you stand to lose when your hand doesn't pan out or your opponent's hand improves can significantly outweigh the potential winnings, making the play unprofitable.",
        icon: Users
    },
    {
        title: 'Part C: Strategic Implications',
        content: "When Reverse Implied Odds are at play, relying solely on immediate pot odds can lead to significant financial losses. The correct strategy is often to fold your hand immediately rather than becoming further invested in a pot where your future losses are likely to be disproportionately large compared to your potential gains. It's crucial not to be tempted by seemingly favorable initial pot odds when the subsequent betting rounds are expected to be negative for your hand. ",
        icon: Users
    },
    {
        title: 'Part C: Strategic Implications - Example',
        content: "For example, if you hold two black aces and the board shows three hearts, and your opponent bets aggressively, despite having a strong pair, you're facing Reverse Implied Odds if you believe your opponent is on a flush draw. Even if you have the best hand now, the implied cost of facing future bets if your opponent completes their flush makes continuing a poor decision. Recognizing these situations allows a player to minimize losses and avoid committing chips to hands that have a negative expectation in the long run.",
        icon: Users
    },
    {
        title: 'The Hidden Cost: Avoid the Reverse Implied Trap',
        content: "Poker isn't just about winning big pots; it's also about minimizing losses. Sometimes, a seemingly good call can lead you into a trap, costing you more than you stand to win. This mini-game will teach you to spot these deceptive situations, known as Reverse Implied Odds, and make smarter folding decisions.",
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
    title: 'Scenario 1: Strong Aces vs. a Flush Threat (Reverse Implied Odds)',
    players: [
    { position: "Hero (BB)", stack: 1000, bet: 0, cards: ["A♠", "A♣"], status: "(You)", isCurrent: true, isHero: true },
    { position: "Opponent (SB)", stack: 1000, bet: 20, cards: [], status: "Bet $20", isCurrent: false, isHero: false }
    ],
    communityCards: ['K♥', '8♥', '3♥'],
    pot: 50,
    situation: "You have a strong Aces (A♠ A♣), which is probably the best hand right now. However, the board (K♥ 8♥ 3♥) presents clear flush potential for your opponent. Your opponent's aggressive betting action suggests that he is chasing the flush, making Your strong hand is vulnerable to future losses if the flush does come.",
    questions: [
    "Will your hand still be the best even if it improves? What if your opponent already has a stronger hand or improves to a better hand?",
    "Consider the future bets. If you call now, are you willing to call again if your hand doesn't improve, or if your opponent's hand gets even stronger, which could cost you more money than you could win?"
    ],
    summary: "The right action here is **Fold**. Despite the strength of your initial hand, calling exposes you to the risk of significant losses in future betting rounds (Reverse Implied Odds) if your opponent completes the flush. In such a situation, you may find yourself calling larger bets with a second hand at best, making the investment unprofitable in the long run. Folding is the optimal action to minimize potential losses."
    },
    {
    title: 'Scenario 2: Draw to a Straight with Limited Outs',
    players: [
    { position: "Hero (BB)", stack: 1000, bet: 0, cards: ["Q♠", "2♦"], status: "(You)", isCurrent: true, isHero: true },
    { position: "Opponent (SB)", stack: 1000, bet: 50, cards: [], status: "Bet $50", isCurrent: false, isHero: false }
    ],
    communityCards: ['9♦', 'T♥', 'J♣'],
    pot: 100,
    situation: "You have a draw to a straight (Q♠ 2♦), but with only limited outs to a winning straight (only 4 kings complete a higher straight), and you are not sure if your opponent has a set or a stronger draw.",
    questions: [
    "Would your hand be the best even if it improved? What if Does your opponent already have a stronger hand or will he improve to a better hand?",
    "Consider the future bets. If you call now, are you willing to call again if your hand doesn't improve, or if your opponent's hand gets even stronger, which could cost you more money than you could win?"
    ],
    summary: "The right action here is **Fold**. There is a high risk that you will lose more money on future bets, even if your hand improves, because your opponent's hand may be stronger or improve as well. The uncertainty about the strength of your opponent's hand and the limited number of outs in your hand increase the risk that you will build a large pot on a hand that will not ultimately win. Calling can lead to additional commitments in future betting rounds, making the investment unprofitable in the long run."
    },
    {
    title: 'Scenario 3: A mediocre flush draw against a full house threat',
    players: [
    { position: "Hero (BB)", stack: 1000, bet: 0, cards: ["J♠", "5♠"], status: "(You)", isCurrent: true, isHero: true },
    { position: "Opponent (SB)", stack: 1000, bet: 30, cards: [], status: "Bet $30", isCurrent: false, isHero: false }
    ],
    communityCards: ['K♠', 'K♥', '7♠', '2♦'],
    pot: 60,
    situation: "You have a mediocre flush draw (J♠ 5♠ - a four-card flush hand other than the nuts) on a double board (K♠ K♥ 7♠ 2♦), and there is a concern that certain improving cards could give your opponent a full house. Your opponent is showing very strong action, suggesting that he has a full house. Or a set.",
    questions: [
    "Will your flush hand be the best hand even if it improves? What if your opponent already has a full house or your hand improves to a better hand, especially on a double board?",
    "Consider future bets. If you call now, are you willing to call more bets if your flush hand doesn't improve, or if your opponent's hand gets even stronger, costing you more money than you could win, especially if he has a full house?"
    ],
    summary: "The correct action here is **Fold**. Even if your mediocre flush draw improves, your opponent's strong betting actions and the double board (K♠ K♥ 7♠ 2♦) indicate that he probably has a full house or a set. Completing the flush may not make it the best hand, leading to significant losses in future bets. Calling in this situation requires you to commit to larger bets for a hand with negative long-term expectation, so folding is the correct move to minimize losses."
    }
];

export default function Game19() {
  const [currentStage, setCurrentStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [interactiveStep, setInteractiveStep] = useState(0); // 0: situation, 1: question 1, 2: question 2, 3: summary
  const [user, setUser] = useState(null);
  const gameId = 19;
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
    await User.completeGame(19);
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
            <h1 className="text-4xl font-bold text-white mb-4">Game 9: Learning Reverse Implied Odds</h1>
            <h2 className="text-2xl font-semibold text-green-300 mb-6">Recognizing Hidden Dangers</h2>
            <p className="text-green-200 text-lg mb-8">
                Recognize when seemingly good calls can lead to greater future losses
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
