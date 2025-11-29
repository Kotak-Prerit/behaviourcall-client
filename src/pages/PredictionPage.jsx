import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';

function PredictionPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [predictionText, setPredictionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    setPlayerId(storedPlayerId);

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
    };
  }, [roundId, navigate]);

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
      
      const roomResponse = await axiosInstance.get(`/rooms/${round.roomId}`);
      socketService.submitPrediction(roomResponse.data.code, playerId);

      alert('Prediction submitted! Waiting for others...');
    } catch (error) {
      console.error('Error submitting prediction:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit prediction';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" 
            />
          </motion.div>

          {hasSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-4">
                <p className="text-xl font-semibold text-green-400">✓ Prediction Submitted!</p>
              </div>
              <p className="text-white/60 animate-pulse">Waiting for other players to submit their predictions...</p>
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
