import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

function RevealPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    fetchData();
  }, [roundId]);

  const fetchData = async () => {
    try {
      const roundResponse = await axiosInstance.get(`/rounds/${roundId}`);
      setRound(roundResponse.data);

      const predictionsResponse = await axiosInstance.get(`/predictions/round/${roundId}`);
      setPredictions(predictionsResponse.data);

      const roomResponse = await axiosInstance.get(`/rooms/${roundResponse.data.roomId}`);
      setRoom(roomResponse.data);
    } catch (error) {
      console.error('Error fetching reveal data:', error);
      alert('Failed to load results');
      navigate('/');
    }
  };

  const handlePlayAgain = () => {
    if (room) {
      navigate(`/room/${room.code}`);
    }
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  if (!round || !predictions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-white text-2xl animate-pulse">Loading results...</div>
      </div>
    );
  }

  // Calculate scores
  const scores = {};
  predictions.forEach(pred => {
    const predictorId = pred.predictorId._id;
    if (!scores[predictorId]) {
      scores[predictorId] = {
        name: pred.predictorId.name,
        points: 0
      };
    }
    scores[predictorId].points += pred.points;
  });

  const sortedScores = Object.values(scores).sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen p-4 relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto pt-10">
        <GlassCard>
          <div className="text-center mb-8">
            <BlurText text={`Round ${round.roundNumber} Results!`} className="text-4xl font-bold text-white mb-2" />
          </div>
          
          {/* Leaderboard */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white/90">Leaderboard</h2>
            <div className="space-y-2">
              {sortedScores.map((player, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={player.name}
                  className={cn(
                    "p-4 rounded-xl flex justify-between items-center backdrop-blur-sm border",
                    index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' :
                    index === 1 ? 'bg-gray-400/20 border-gray-400/50' :
                    index === 2 ? 'bg-orange-500/20 border-orange-500/50' :
                    'bg-white/5 border-white/10'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-2xl font-bold",
                      index === 0 ? "text-yellow-400" :
                      index === 1 ? "text-gray-300" :
                      index === 2 ? "text-orange-400" :
                      "text-white/50"
                    )}>#{index + 1}</span>
                    <span className="text-xl font-semibold text-white">{player.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-300">{player.points} pts</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* All Predictions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white/90">All Predictions</h2>
            <div className="space-y-3">
              {predictions.map((pred, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                  key={pred._id}
                  className={cn(
                    "p-4 rounded-xl border backdrop-blur-sm",
                    pred.happened 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white/90">
                        <span className="text-blue-300">{pred.predictorId.name}</span> → <span className="text-purple-300">{pred.targetId.name}</span>
                      </p>
                    </div>
                    {pred.happened && (
                      <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-sm font-semibold">
                        +{pred.points} pts
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 italic">"{pred.text}"</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <ShinyButton
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Play Another Round
            </ShinyButton>
            <ShinyButton
              onClick={handleBackToLobby}
              className="bg-gradient-to-r from-gray-600 to-gray-700"
            >
              Back to Lobby
            </ShinyButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default RevealPage;
