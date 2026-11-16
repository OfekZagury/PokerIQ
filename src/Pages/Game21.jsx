
import React, { useState, useEffect } from 'react';
import { UserService as User } from "@/services/user";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ArrowRight, Trophy, CheckCircle, Target, Users, Shield, ThumbsUp, ThumbsDown, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayingCard from '../components/shared/PlayingCard';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from "@/lib/analytics";
import useActiveStopwatch from "@/hooks/useActiveStopwatch";

const explanationSlides = [
    {
        title: "Introduction to Check-Raising",
        content: "Check-raising is a strategic maneuver in poker where you choose to check your hand with the specific intention of raising after an opponent places a bet in the same betting round. It is considered a powerful and legitimate tool used by professional poker players, distinguishing itself from other plays like slowplaying or bluffing. While some amateur players might perceive check-raising as deceitful, the sources clarify that it is a standard and acceptable part of poker strategy.",
        icon: Trophy
    },
    {
        title: "Part A: Necessary Conditions for Check-Raising condition 1",
        content: "For a check-raise to be an effective and correct play, two essential conditions must typically be present:1.	You Expect to Be Called by a Worse Hand: The primary goal of a check-raise is to extract more money from the pot. Therefore, you should execute this play when you believe you hold the best hand, but it is not so overwhelmingly strong that a slowplay (playing your hand weakly over multiple rounds) would be more profitable. The idea is to entice an opponent with a hand weaker than yours to call your subsequent raise, thereby increasing the pot.",
        icon: Target
    },
    {
        title: "Expect to Be Called by a Worse Hand - Example",
        content: "Imagine playing seven-card stud. You are holding a King-Queen (K-Q) showing, and your opponent bets with a Queen-Ten (Q-10) showing. You decide to check, anticipating that if your opponent bets, they will likely call your subsequent raise with their weaker hand, allowing you to win a larger pot.",
        icon: ThumbsUp
    },
    {
        title: "Part A: Necessary Conditions for Check-Raising condition 2",
        content: "An Opponent Behind You Will Bet: This condition is crucial for the execution of the check-raise. After you check, there must be at least one opponent behind you who is expected to place a bet, providing you with the opportunity to then raise. Without a bet to raise against, the check-raise simply cannot occur.",
        icon: Target
    },
    {
        title: "An Opponent Behind You Will Bet - Example",
        content: "You are in an early position at the table with a strong hand. You check, knowing that the player directly to your right is known to bet frequently. When that player bets, you seize the opportunity to check-raise them.",
        icon: ThumbsUp
    },
    {
        title: "Part B: Check-Raising and Position",
        content: "Your position at the table plays a significant role in determining the effectiveness and target of your check-raise. Bettor to Your Right: When the opponent you anticipate betting is to your right, this is often the most advantageous position for a check-raise. This setup allows you to maximize the money drawn into the pot. For example, if you hold kings, you might induce calls from players to your right who have a pair of queens or jacks, forcing them to make a difficult decision against your raise.",
        icon: ThumbsUp
    },
    {
        title: "Part B: Check-Raising and Position",
        content: "Bettor to Your Left: While less ideal for maximizing calls from specific weak hands, check-raising against a player to your left can still be effective, especially with very strong hands or come hands (drawing hands with strong potential). In these cases, you might be aiming to encourage them to call or even re-raise, further building the pot.",
        icon: ArrowLeft
    },
    {
        title: "Part B: Check-Raising and Position - Example",
        content: "You hold a strong hand and are in a position where the player to your right is a frequent bettor. You check, and when they bet, your check-raise puts significant pressure on them, ideally making them fold or commit more chips.",
        icon: ArrowRight
    },
    {
        title: "Part C: Advantages (Pros) of Check-Raising",
        content: "Check-raising offers several strategic benefits that can significantly impact your winnings:The first one is Trapping Opponents and Maximizing Winnings: One of the primary advantages is to play your strong hand in a way that appears weaker than it is, thereby trapping opponents into contributing more money to the pot. This can lead to winning a larger pot than if you had simply bet your hand directly. It can even result in winning the pot immediately.",
        icon: ThumbsUp
    },
    {
        title: "Part C: Advantages (Pros) of Check-Raising",
        content: "In addition, its a Powerful Weapon and Deceptive Tool: Check-raising is recognized as a powerful weapon in a poker player's arsenal. It utilizes deception to influence opponents, encouraging them to stay in the game longer and make moves in later betting rounds that benefit you.",
        icon: ThumbsUp
    },
    {
        title: "Part C: Advantages (Pros) of Check-Raising",
        content: "Driving Out Opponents / Preventing Free Cards: Unlike slowplaying, which might allow opponents to see the next card for free or at a very low cost, a check-raise immediately applies pressure. This action can drive out opponents with weaker hands or drawing hands, especially when you hold a second-best hand that benefits from reducing the number of players to improve its odds.",
        icon: ThumbsUp
    },
    {
        title: "Part D: Considerations (Implicit Cons/Risks) of Check-Raising",
        content: "While a powerful strategy, check-raising carries certain risks and is not always the optimal play: Risk of No Bet Behind: A significant drawback is that if no opponent places a bet after you check, you lose the opportunity to execute the check-raise. In such a scenario, your strong hand might win a smaller pot than it could have if you had chosen to bet directly.",
        icon: ThumbsDown
    },
    {
        title: "Part D: Considerations (Implicit Cons/Risks) of Check-Raising",
        content: "Not Always Suitable for the Strongest Hands: If your hand is exceptionally strong, so strong that a slowplay would be more appropriate to maximize value over multiple betting rounds, a check-raise might not be the optimal strategy. In such cases, a check-raise could potentially scare off opponents too early, preventing you from extracting the maximum possible value from your powerful hand.",
        icon: ThumbsDown
    },

];

const practiceQuestions = [
    {
        scenario: "You are in the Big Blind. An aggressive player on the button raises. You call.",
        board: ["K♠", "9♦", "4♣"],
        hand: ["K♥", "9♣"],
        question: "You've flopped two pair. Is this a good spot for a check-raise?",
        options: ["Yes, great for value", "No, just call", "No, bet out"],
        correct: 0,
        explanation: "Yes. You are out of position against an aggressive player who is likely to continue with a bet. Check-raising here builds a massive pot with your very strong hand."
    },
    {
        scenario: "You are under the gun. A passive player in middle position limps into the pot. You check your big blind.",
        board: ["Q♥", "J♥", "3♠"],
        hand: ["A♥", "10♥"],
        question: "You have a flush draw and a gutshot straight draw. Should you try to check-raise?",
        options: ["Yes, it's a perfect semi-bluff", "No, the opponent is too passive"],
        correct: 1,
        explanation: "No. A check-raise relies on your opponent betting when you check. A passive player is likely to check behind, meaning your trap will fail and you won't build the pot or get to apply pressure."
    },
    {
        scenario: "An aggressive player raises from middle position. You call on the button.",
        board: ["A♣", "8♦", "2♥"],
        hand: ["K♠", "Q♠"],
        question: "Can you check-raise in this situation?",
        options: ["Yes", "No, you are in position"],
        correct: 1,
        explanation: "No. You are 'in position,' meaning you act after your opponent. A check-raise can only be executed when you are out of position (acting before the target player)."
    },
    {
    scenario: "You're in the big blind. There's an aggressive player on the button. You call.",
    board: ["K♠", "9♦", "4♣"],
    hand: ["K♥", "9♣"],
    question: "You've hit the flop with two pair. Is this a good place to check-raise?",
    options: ["Yes, great for value", "No, just call", "No, make an opening bet"],
    correct: 0,
    explanation: "Yes. You're out of position against an aggressive player who is likely to continue betting. Check-raising here builds a massive pot with your very strong hand."
    },
    {
    scenario: "You're 'under the gun'. A passive player in middle position limps into the pot. You check in the big blind.",
    board: ["Q♥", "J♥", "3♠"],
    hand: ["A♥", "10♥"],
    question: "You have a flush draw and a gutshot straight draw. Should you try a check-raise?",
    options: ["Yes, this is a perfect semi-bluff", "No, your opponent is too passive"],
    correct: 1,
    explanation: "No. A check-raise relies on your opponent making a bet after you check. A passive player is likely to check from behind, which means your trap will fail and you won't build the pot or apply pressure."
    },
    {
    scenario: "Aggressive player raises from middle position. You call on the button.",
    board: ["A♣", "8♦", "2♥"],
    hand: ["K♠", "Q♠"],
    question: "Can you check-raise in this situation?",
    options: ["Yes", "No, you are in position"],
    correct: 1,
    explanation: "No. You are 'in position', meaning you are acting after your opponent. Check-raising can only be done when you are out of position (acting before the targeted player)."
    },
    {
    scenario: "You are in the small blind (SB) after an 'under the gun' player raised and you called. The only opponent left behind you is the big blind (BB) who is a very tight player.",
    board: ["7♠", "7♥", "2♣"],
    hand: ["A♣", "A♦"],
    question: "Is this a good situation to check-raise to maximize value?",
    options: ["Yes, it's better to check-raise with a strong hand", "No, there's a risk that of no bet from behind", "No, hand is too strong and better to slow-play"],
    correct: 1,
    explanation: "No. One of the essential requirements for check-raising is that a player behind you will bet. If the remaining opponent is a very tight player who is expected to check from behind, you risk your strong hand winning a smaller pot than if you had bet directly."
    },
    {
    scenario: "You are in the big blind (BB). A player opens from early position (UTG) and another player calls on the button. You call.",
    board: ["Q♠", "J♠", "T♠"],
    hand: ["A♠", "K♠"],
    question: "You have a royal flush (the ultimate hand). Should you check-raise?",
    options: ["Yes, it maximizes the pot", "No, the hand is too strong to check-raise", "Yes, it prevents free cards"],
    correct: 1,
    explanation: "No. When your hand is *exceptionally* strong (like a royal flush), check-raising may scare opponents away too early. Instead, slow-playing (playing weaker over several rounds) may be a more profitable strategy to maximize value throughout the hand."
    },
    {
    scenario: "You are in the small blind (SB). The opponent in the big blind (BB) is known to be a frequent and aggressive bettor. You check.",
    board: ["9♦", "7♦", "2♥"],
    hand: ["9♣", "T♣"],
    question: "You've hit the flop with top pair. Is this an ideal position to check-raise?",
    options: ["Yes, this is ideal position to check-raise", "No, top pair is not strong enough", "No, you should be in the big blind"],
    correct: 0,
    explanation: "Yes. When the opponent who is expected to bet is to your right (as is the case when you are in the SB and he is in the BB), this is the most advantageous position to check-raise, as it allows you to maximize the money that goes into the pot. Additionally, with a strong hand (like top pair), you expect an aggressive opponent to call your raise with a worse hand."
    },
    {
    scenario: "You are out of position. Your opponent is known to be a loose-passive player (calls a lot, doesn't raise a lot). He bets a small bet on the flop.",
    board: ["J♥", "8♥", "4♠"],
    hand: ["K♥", "Q♥"],
    question: "You have overcards and a flush draw. Should I check-raise (semi-bluff)?",
    options: ["Yes, this is great use of a potential hand", "No, raising may make the passive opponent fold", "No, it's better to straight bet"],
    correct: 0,
    explanation: "Yes. Check-raising is also effective with 'potential hands' (come hands), such as a strong draw. In addition, check-raising allows you to apply immediate pressure and prevent your opponent from seeing the next card for free or at a low cost, even if he is a passive player."
    },
    {
    scenario: "An early player raises. You call in BB. On the flop you check and he bets. You check-raise.",
    board: ["K♦", "8♦", "3♣"],
    hand: ["K♣", "3♠"],
    question: "You have two pair (K and 3). What is the main advantage of a check-raise in this situation, compared to a straight bet?",
    options: ["It is a powerful and deceptive tool that makes your opponent stay", "It allows you to see the next card cheaply", "It allows you to get into better position"],
    correct: 0,
    explanation: "A check-raise is a powerful tool that exploits deception to play your strong hand in a way that makes it look weaker. The goal is to trap your opponent and make them put more money in the pot by calling your raise with a worse hand, thereby maximizing your winnings."
    },
    {
    scenario: "You are UTG with a strong hand. You check. The SB bets. You check-raise.",
    board: ["A♥", "T♣", "5♦"],
    hand: ["A♣", "K♠"],
    question: "The SB is on your left. Is a check-raise effective regardless of the opponent's position?",
    options: ["Yes, it is always effective against a bettor", "No, only if the opponent is on your right", "Yes, but less ideal for maximizing calls"],
    correct: 2,
    explanation: "Yes. Although the ideal position is when the bettor is on your right, a check-raise against a player on your left can still be effective, especially with very strong hands. The goal is to encourage him to call or even re-raise, thus building the pot."
    }
];

const finalChallengeQuestions = [
    {
        position: "Big Blind",
        opponent: "Aggressive",
        hand: ["5♠", "5♦"],
        board: ["K♣", "5♥", "2♦"],
        question: "You flop a set. Good spot to check-raise?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. This is a classic value check-raise. You are out of position with a monster hand against an aggressive player who is likely to bet."
    },
    {
        position: "Under the Gun",
        opponent: "Passive",
        hand: ["A♠", "K♠"],
        board: ["Q♠", "8♦", "2♠"],
        question: "You flop the nut flush draw. Check-raise as a semi-bluff?",
        options: ["Yes", "No"],
        correct: 1,
        feedback: "No. Your opponent is passive and unlikely to bet if you check. Your check-raise attempt will likely fail. It's better to just bet out (a 'lead bet')."
    },
    {
        position: "Button",
        opponent: "Aggressive",
        hand: ["7♣", "8♣"],
        board: ["6♦", "9♥", "K♠"],
        question: "You have an open-ended straight draw. Can you check-raise here?",
        options: ["Yes", "No"],
        correct: 1,
        feedback: "No. You cannot check-raise from the button in this spot because you are in position (acting after your opponent). You must be out of position to execute a check-raise."
    },
    {
        position: "Small Blind",
        opponent: "Aggressive",
        hand: ["A♦", "A♥"],
        board: ["A♣", "K♦", "10♣"],
        question: "You flop top set on a draw-heavy board. Check-raise?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. This is a perfect spot. You get value from an aggressive player's bluffs and make their drawing hands (like flush or straight draws) pay the maximum price to continue."
    },
    {
        position: "Big Blind",
        opponent: "Aggressive",
        hand: ["K♠", "J♠"],
        board: ["A♥", "Q♦", "10♣"],
        question: "You flop the nut straight. Check-raise?",
        options: ["Yes", "No"],
        correct: 0,
        feedback: "Yes. You have the stone-cold nuts and are out of position against an aggressive player. This is a mandatory check-raise to build a huge pot."
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
        <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
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

export default function Game21() {
    const [currentStage, setCurrentStage] = useState('intro');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [user, setUser] = useState(null);
    const gameId = 21;
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
            await User.completeGame(21);
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
            setShowExplanation(true);
        } else {
            setShowExplanation(true);
        }
    };

    const renderIntro = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-green-600/30">
                <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4">Game 21: Check-Raise Strategy</h1>
                <h2 className="text-2xl font-semibold text-green-300 mb-6">Required Conditions & Pros/Cons</h2>
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
                        <Button onClick={() => setCurrentStage('practice_intro')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Start Practice <ArrowRight className="ml-2 w-4 h-4" /></Button>
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
                        {question.hand &&
                            <div className="flex justify-center items-center gap-4">
                                <p className="text-white font-bold">Your Hand:</p>
                                <div className="flex gap-2">
                                    {question.hand.map(card => <PlayingCard key={card} card={card} />)}
                                </div>
                            </div>
                        }
                        <h4 className="text-xl font-bold text-white text-center mt-6">{question.question}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {question.options.map((option, index) => (
                            <Button
                                key={index}
                                variant={selectedAnswer === index ? (isCorrect ? "default" : "destructive") : "secondary"}
                                className={`h-16 text-lg bg-white/10 hover:bg-white/20 ${question.options.length > 2 ? '' : 'sm:col-span-1 lg:col-span-1'}`}
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
            setFinalScore(0);
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setShowExplanation(false);
            setCurrentStage('final_challenge');
        };

        return (
            <div className="max-w-4xl mx-auto text-center">
                <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-8 border ${passed ? 'border-green-600/30' : 'border-red-600/30'}`}>
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-white mb-4">Challenge Complete!</h2>
                    <div className="bg-white/10 rounded-xl p-6 mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">Your Score: {finalScore} / {finalChallengeQuestions.length}</h3>
                        <p className={`font-bold text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
                            {passed ? "Excellent! You've mastered the check-raise." : "Good effort. Review the conditions and try again!"}
                        </p>
                    </div>

                    {passed ? (
                        <>
                            <p className="text-green-200 text-lg mb-8">
                                Congratulations! You can now identify the perfect spots to execute a check-raise for both value and as a semi-bluff. This advanced technique will give you a significant edge in post-flop play.
                            </p>
                            <Button onClick={() => completeGame(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg">
                                Complete & Return to Home <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-red-200 text-lg mb-8">
                                Mastering the check-raise requires understanding the key conditions. Review the concepts and try the challenge again.
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
            case 'practice_intro':
                return (
                    <StageDivider
                        title="Practice Round"
                        description="Let's start with some guided practice questions to help you understand the check-raise strategy in different situations."
                        onContinue={() => setCurrentStage('practice')}
                    />
                );
            case 'practice': return renderQuestion(true);
            case 'final_challenge_intro':
                return (
                    <StageDivider
                        title="Final Challenge"
                        description="Now it's time to put your knowledge to the test! Apply everything you've learned about check-raise conditions and timing."
                        onContinue={() => setCurrentStage('final_challenge')}
                        showPassingCriteria={true}
                    />
                );
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
                    key={currentStage + '-' + currentQuestion + '-' + currentSlide}
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
