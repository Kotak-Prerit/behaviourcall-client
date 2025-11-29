import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function PredictionPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [predictionText, setPredictionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [hasHappened, setHasHappened] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    setPlayerId(storedPlayerId);

    // Connect socket
    socketService.connect();

    if (storedPlayerId) {
      fetchRound(storedPlayerId);
    }

    socketService.on('phase-updated', ({ phase, roundId: updatedRoundId }) => {
      if (updatedRoundId === roundId && phase === 'observation') {
        navigate(`/observation/${roundId}`);
      }
    });

    socketService.on('player-prediction-submitted', () => {
      // Could show who has submitted
    });

    return () => {
      socketService.off('phase-updated');
      socketService.off('player-prediction-submitted');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roundId, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (hasSubmitted && !hasHappened) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [hasSubmitted, hasHappened]);

  const fetchRound = async (storedPlayerId) => {
    try {
      const response = await axiosInstance.get(`/rounds/${roundId}`);
      const roundData = response.data;
      setRound(roundData);

      const assignment = roundData.assignments.find(
        a => a.playerId._id === storedPlayerId
      );
      
      if (assignment) {
        setTargetPlayer(assignment.targetId);
      }

      try {
        await axiosInstance.get(`/predictions/round/${roundId}/player/${storedPlayerId}`);
        setHasSubmitted(true);
      } catch (error) {
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error('Error fetching round:', error);
      alert('Round not found');
      navigate('/');
    }
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    if (!predictionText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/predictions', {
        roundId,
        predictorId: playerId,
        targetId: targetPlayer._id,
        text: predictionText
      });

      console.log('Prediction response:', response.data);
      setHasSubmitted(true);
      setTimeRemaining(600); // Reset timer to 10 minutes
      
      const roomResponse = await axiosInstance.get(`/rooms/${round.roomId}`);
      socketService.submitPrediction(roomResponse.data.code, playerId);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit prediction';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItHappened = () => {
    if (hasHappened || timeRemaining <= 0) return;

    setHasHappened(true);
    setScore(10);
    
    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#59BE4C', '#ffffff', '#000000']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#59BE4C', '#ffffff', '#000000']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!round || !targetPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative">
      <AnimatedBackground />
      <div className="max-w-2xl mx-auto pt-10">
        <GlassCard>
          <div className="text-center mb-8">
            <BlurText text="Prediction Phase" className="text-3xl font-bold text-white mb-2" />
            <p className="text-white/70">Round {round.roundNumber}</p>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8 backdrop-blur-sm"
          >
            <h2 className="text-xl font-bold text-center mb-2 text-white/80">Your Target:</h2>
            <BlurText 
              text={targetPlayer.name} 
              className="text-4xl font-bold text-white text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
            />
          </motion.div>

          {hasSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-8">
                <p className="text-xl font-semibold text-green-400">✓ Prediction Submitted!</p>
              </div>

              {/* Timer Button */}
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  onClick={handleItHappened}
                  disabled={timeRemaining <= 0 || hasHappened}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: hasHappened ? 1 : 1.05 }}
                  whileTap={{ scale: hasHappened ? 1 : 0.95 }}
                  className={`relative w-64 h-64 rounded-full font-bold text-2xl transition-all duration-500 shadow-2xl ${
                    hasHappened
                      ? 'bg-green-500 text-white cursor-default'
                      : timeRemaining > 0
                      ? 'bg-red-500 text-white hover:shadow-red-500/50 cursor-pointer'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: hasHappened
                      ? '0 0 60px rgba(89, 190, 76, 0.8)'
                      : '0 0 60px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {hasHappened ? (
                      <>
                        <span className="text-4xl mb-2">✓</span>
                        <span className="text-3xl">It Happened!</span>
                        <span className="text-6xl font-bold mt-2">+{score}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold mb-2">{formatTime(timeRemaining)}</span>
                        <span className="text-xl">It Happened</span>
                      </>
                    )}
                  </div>
                </motion.button>

                {!hasHappened && timeRemaining > 0 && (
                  <p className="text-white/60 text-sm">
                    Click the button when your prediction happens!
                  </p>
                )}

                {timeRemaining <= 0 && !hasHappened && (
                  <p className="text-red-400 font-semibold">Time's up! Your prediction didn't happen.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitPrediction}>
              <label className="block mb-2 font-semibold text-white">
                Write your prediction about {targetPlayer.name}:
              </label>
              <textarea
                value={predictionText}
                onChange={(e) => setPredictionText(e.target.value)}
                placeholder={`Example: ${targetPlayer.name} will laugh within the next 5 minutes`}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none mb-2"
                maxLength={200}
              />
              <p className="text-sm text-white/50 mb-6 text-right">
                {predictionText.length}/200 characters
              </p>
              <ShinyButton
                type="submit"
                disabled={isSubmitting || !predictionText.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Prediction'}
              </ShinyButton>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default PredictionPage;
