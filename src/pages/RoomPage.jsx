import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';

function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    setPlayerId(storedPlayerId);

    if (storedPlayerId) {
      fetchRoom();
      socketService.joinRoom(storedPlayerId, code);
    }

    socketService.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
      const currentPlayer = updatedRoom.players.find(p => p.playerId._id === storedPlayerId);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    });

    socketService.on('all-players-ready', () => {
      console.log('All players are ready!');
    });

    socketService.on('round-started', ({ roundId }) => {
      navigate(`/prediction/${roundId}`);
    });

    socketService.on('room-error', (error) => {
      alert(error.message);
    });

    return () => {
      socketService.off('room-updated');
      socketService.off('all-players-ready');
      socketService.off('round-started');
      socketService.off('room-error');
    };
  }, [code, navigate]);

  const fetchRoom = async () => {
    try {
      const response = await axiosInstance.get(`/rooms/${code}`);
      setRoom(response.data);
      
      const storedPlayerId = localStorage.getItem('playerId');
      const currentPlayer = response.data.players.find(p => p.playerId._id === storedPlayerId);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      alert('Room not found');
      navigate('/');
    }
  };

  const handleToggleReady = async () => {
    try {
      const newReadyStatus = !isReady;
      await axiosInstance.put(`/rooms/${code}/ready`, {
        playerId,
        isReady: newReadyStatus
      });
      socketService.updateReady(code, playerId, newReadyStatus);
      setIsReady(newReadyStatus);
    } catch (error) {
      console.error('Error updating ready status:', error);
    }
  };

  const handleStartGame = async () => {
    if (!room || room.players.length < 2) {
      alert('Need at least 2 players to start');
      return;
    }

    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      alert('All players must be ready');
      return;
    }

    setIsStarting(true);
    try {
      const response = await axiosInstance.post('/rounds', { roomId: room._id });
      const round = response.data;
      
      socketService.startRound(code, round._id);
      navigate(`/prediction/${round._id}`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await axiosInstance.post(`/rooms/${code}/leave`, { playerId });
      socketService.leaveRoom(playerId, code);
      navigate('/');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-white text-2xl animate-pulse">Loading room...</div>
      </div>
    );
  }

  const isHost = room.hostId._id === playerId;
  const allReady = room.players.every(p => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 2;

  return (
    <div className="min-h-screen p-4 relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto pt-10">
        <GlassCard>
          <div className="flex justify-between items-center mb-8">
            <div>
              <BlurText text={`Room: ${room.code}`} className="text-3xl font-bold text-white" />
              <p className="text-white/70 mt-1">Host: {room.hostId.name}</p>
            </div>
            <ShinyButton
              onClick={handleLeaveRoom}
              className="bg-red-500/80 hover:bg-red-600/80"
            >
              Leave Room
            </ShinyButton>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Players ({room.players.length})</h2>
            <div className="grid gap-3">
              {room.players.map((player, idx) => (
                <motion.div
                  key={player.playerId._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl flex justify-between items-center backdrop-blur-sm border transition-all ${
                    player.playerId._id === playerId
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{player.playerId.name}</span>
                    {room.hostId._id === player.playerId._id && (
                      <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">HOST</span>
                    )}
                  </div>
                  <div>
                    {player.isReady ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                        Ready
                      </span>
                    ) : (
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Not Ready
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ShinyButton
              onClick={handleToggleReady}
              className={`w-full ${
                isReady
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600'
              }`}
            >
              {isReady ? "I'm Not Ready" : "I'm Ready"}
            </ShinyButton>

            {isHost && (
              <ShinyButton
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isStarting ? 'Starting...' : 'Start Game'}
              </ShinyButton>
            )}

            {!allReady && room.players.length >= 2 && (
              <p className="text-center text-white/60 text-sm animate-pulse">
                Waiting for all players to be ready...
              </p>
            )}
            {room.players.length < 2 && (
              <p className="text-center text-white/60 text-sm">
                Need at least 2 players to start
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default RoomPage;
