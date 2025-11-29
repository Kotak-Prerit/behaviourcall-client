import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import BlurText from '../components/ui/BlurText';
import ShinyButton from '../components/ui/ShinyButton';
import { motion } from 'framer-motion';

function LobbyPage() {
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect socket
    socketService.connect();

    // Listen for lobby updates
    socketService.on('lobby-players-updated', (players) => {
      setOnlinePlayers(players);
    });

    return () => {
      socketService.off('lobby-players-updated');
    };
  }, []);

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    try {
      const response = await axiosInstance.post('/players', { name: playerName });
      const player = response.data;
      
      setPlayerId(player._id);
      localStorage.setItem('playerId', player._id);
      localStorage.setItem('playerName', player.name);

      // Join lobby via socket
      socketService.joinLobby(player._id);

      // Fetch online players
      const playersResponse = await axiosInstance.get('/players/online');
      setOnlinePlayers(playersResponse.data);
    } catch (error) {
      console.error('Error joining lobby:', error);
      alert('Failed to join lobby');
    }
  };

  const handleCreateRoom = async () => {
    if (!playerId) return;

    setIsCreatingRoom(true);
    try {
      const response = await axiosInstance.post('/rooms', { hostId: playerId });
      const room = response.data;
      
      navigate(`/room/${room.code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerId) return;

    try {
      await axiosInstance.post(`/rooms/${roomCode}/join`, { playerId });
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert(error.response?.data?.message || 'Failed to join room');
    }
  };

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        <GlassCard className="max-w-md w-full">
          <BlurText 
            text="Behaviour Call" 
            className="text-4xl font-bold text-center mb-8 text-white" 
          />
          <form onSubmit={handleJoinLobby} className="space-y-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              maxLength={20}
            />
            <ShinyButton type="submit" className="w-full">
              Join Lobby
            </ShinyButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto pt-10">
        <GlassCard className="mb-6">
          <div className="text-center mb-8">
            <BlurText 
              text={`Welcome, ${playerName}!`} 
              className="text-3xl font-bold text-white mb-2" 
            />
            <p className="text-white/70">Global Lobby</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ShinyButton
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              className="w-full bg-gradient-to-br from-emerald-500 to-teal-600"
            >
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </ShinyButton>

            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={6}
              />
              <ShinyButton type="submit" className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6">
                Join
              </ShinyButton>
            </form>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            Online Players ({onlinePlayers.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {onlinePlayers.map((player, idx) => (
              <motion.div
                key={player._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-xl border backdrop-blur-sm transition-all ${
                  player._id === playerId 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <p className="font-medium text-white">{player.name}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default LobbyPage;
