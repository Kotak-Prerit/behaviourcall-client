import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';

function ObservationPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasMarkedHappened, setHasMarkedHappened] = useState(false);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    setPlayerId(storedPlayerId);

    if (storedPlayerId) {
      fetchRoundAndPrediction(storedPlayerId);
    }

    socketService.on('phase-updated', ({ phase, roundId: updatedRoundId }) => {
      if (updatedRoundId === roundId && phase === 'reveal') {
        navigate(`/reveal/${roundId}`);
      }
    });

    return () => {
      socketService.off('phase-updated');
    };
  }, [roundId, navigate]);

  useEffect(() => {
    if (!round || !round.observationStartTime) return;

    const interval = setInterval(() => {
      const startTime = new Date(round.observationStartTime);
      const endTime = new Date(startTime.getTime() + round.observationDuration);
      const now = new Date();
      const remaining = Math.max(0, endTime - now);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [round]);

  const fetchRoundAndPrediction = async (storedPlayerId) => {
    try {
      const roundResponse = await axiosInstance.get(`/rounds/${roundId}`);
      setRound(roundResponse.data);

      const predictionResponse = await axiosInstance.get(
        `/predictions/round/${roundId}/player/${storedPlayerId}`
      );
      setPrediction(predictionResponse.data);
      setHasMarkedHappened(predictionResponse.data.happened);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load observation data');
      navigate('/');
    }
  };

  const handleMarkHappened = async () => {
    if (!prediction || hasMarkedHappened) return;

    try {
      await axiosInstance.put(`/predictions/${prediction._id}/happened`);
      setHasMarkedHappened(true);

      const roomResponse = await axiosInstance.get(`/rooms/${round.roomId}`);
      socketService.markPredictionHappened(roomResponse.data.code, prediction._id);

      alert('Marked as happened! +10 points');
    } catch (error) {
      console.error('Error marking prediction:', error);
      alert('Failed to mark prediction');
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!round || !prediction) {
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
            <BlurText text="Observation Phase" className="text-3xl font-bold text-white mb-2" />
            <p className="text-white/70">Round {round.roundNumber}</p>
          </div>

          <motion.div 
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8 text-center backdrop-blur-sm"
          >
            <p className="text-sm text-white/60 mb-2 uppercase tracking-widest">Time Remaining</p>
            <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-mono">
              {formatTime(timeRemaining)}
            </p>
          </motion.div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-2 text-white/80">Your Prediction:</h2>
            <p className="text-xl text-white mb-4 italic">"{prediction.text}"</p>
            <p className="text-sm text-white/60">
              Target: <span className="font-semibold text-purple-300">{prediction.targetId.name}</span>
            </p>
          </div>

          {hasMarkedHappened ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center"
            >
              <p className="text-2xl font-bold text-green-400">✓ Marked as Happened!</p>
              <p className="text-white/80 mt-2">+10 points</p>
            </motion.div>
          ) : (
            <ShinyButton
              onClick={handleMarkHappened}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-4 text-xl"
            >
              It Happened! 🎉
            </ShinyButton>
          )}

          <p className="text-center text-white/40 text-sm mt-6">
            Watch your target and click the button if your prediction comes true!
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

export default ObservationPage;
