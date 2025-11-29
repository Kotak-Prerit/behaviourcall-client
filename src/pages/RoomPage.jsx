import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FiCopy, FiCheck, FiLogOut, FiPlay, FiUsers, FiUser } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '../utils/axiosInstance';
import socketService from '../utils/socketService';

function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    setPlayerId(storedPlayerId);

    if (storedPlayerId) {
      joinAndFetchRoom(storedPlayerId);
    }

    socketService.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
      const currentPlayer = updatedRoom.players.find(p => p.playerId._id === storedPlayerId);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    });

    socketService.on('all-players-ready', () => {
      toast.success('All players are ready!');
    });

    socketService.on('round-started', ({ roundId }) => {
      navigate(`/prediction/${roundId}`);
    });

    socketService.on('room-error', (error) => {
      toast.error(error.message);
    });

    return () => {
      socketService.off('room-updated');
      socketService.off('all-players-ready');
      socketService.off('round-started');
      socketService.off('room-error');
    };
  }, [code, navigate]);

  const joinAndFetchRoom = async (storedPlayerId) => {
    try {
      // First try to join the room
      try {
        const joinResponse = await axiosInstance.post(`/rooms/${code}/join`, {
          playerId: storedPlayerId
        });
        setRoom(joinResponse.data);
        
        const currentPlayer = joinResponse.data.players.find(p => p.playerId._id === storedPlayerId);
        if (currentPlayer) {
          setIsReady(currentPlayer.isReady);
        }
        
        // Join socket room
        socketService.joinRoom(storedPlayerId, code);
        toast.success('Joined room!');
      } catch (joinError) {
        // If already in room (400), just fetch the room data
        if (joinError.response?.status === 400) {
          const response = await axiosInstance.get(`/rooms/${code}`);
          setRoom(response.data);
          
          const currentPlayer = response.data.players.find(p => p.playerId._id === storedPlayerId);
          if (currentPlayer) {
            setIsReady(currentPlayer.isReady);
          }
          
          // Join socket room
          socketService.joinRoom(storedPlayerId, code);
        } else {
          throw joinError;
        }
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
      navigate('/');
    }
  };

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
      toast.error('Room not found');
      navigate('/');
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
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
      toast.success(newReadyStatus ? 'You are ready!' : 'Marked as not ready');
    } catch (error) {
      console.error('Error updating ready status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleStartGame = async () => {
    if (!room || room.players.length < 2) {
      toast.error('Need at least 2 players to start');
      return;
    }

    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      toast.error('All players must be ready');
      return;
    }

    setIsStarting(true);
    try {
      const response = await axiosInstance.post('/rounds', { roomId: room._id });
      const round = response.data;
      
      socketService.startRound(code, round._id);
      toast.success('Game starting!');
      navigate(`/prediction/${round._id}`);
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await axiosInstance.post(`/rooms/${code}/leave`, { playerId });
      socketService.leaveRoom(playerId, code);
      toast.success('Left room');
      navigate('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl"
        >
          Loading room...
        </motion.div>
      </div>
    );
  }

  const isHost = room.hostId._id === playerId;
  const allReady = room.players.every(p => p.isReady);
  const canStart = isHost && allReady && room.players.length >= 2;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="border-b border-white/10 backdrop-blur-xl bg-black/50"
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-white/60 hover:text-white hover:bg-white/5"
                >
                  ← Back
                </Button>
                <Separator orientation="vertical" className="h-6 bg-white/10" />
                <div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyCode}
                      className="hover:bg-white/5 bg-white/10 p-2 rounded-md"
                    >
                      {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                    </Button>
                  </div>
                  <p className="text-white/60 text-sm">Host: {room.hostId.name}</p>
                </div>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleLeaveRoom}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                <FiLogOut className="mr-2" />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Players List */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiUsers />
                    Players ({room.players.length})
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {allReady ? 'Everyone is ready! 🎉' : 'Waiting for players to get ready...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {room.players.map((player, index) => (
                      <motion.div
                        key={player.playerId._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          player.playerId._id === playerId
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}>
                          <Avatar className="h-12 w-12 border border-white/20">
                            <AvatarFallback className="bg-white/10 text-white text-lg">
                              {player.playerId.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{player.playerId.name}</p>
                              {room.hostId._id === player.playerId._id && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  HOST
                                </Badge>
                              )}
                              {player.playerId._id === playerId && (
                                <Badge variant="outline" className="border-white/20 text-white/60">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            {player.isReady ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Ready ✓
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-white/20 text-white/60">
                                Not Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                        {index < room.players.length - 1 && <Separator className="bg-white/5" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions Panel */}
            <div className="space-y-4">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Ready Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleToggleReady}
                    className={`w-full ${
                      isReady
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        : 'bg-primary text-black hover:bg-primary/90'
                    }`}
                  >
                    <FiUser className="mr-2" />
                    {isReady ? "Mark Not Ready" : "I'm Ready"}
                  </Button>
                </CardContent>
              </Card>

              {isHost && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Host Controls</CardTitle>
                    <CardDescription className="text-white/60">
                      Start the game when everyone is ready
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStart || isStarting}
                      className="w-full bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
                    >
                      <FiPlay className="mr-2" />
                      {isStarting ? 'Starting...' : 'Start Game'}
                    </Button>
                    
                    {!canStart && (
                      <p className="text-sm text-white/60 text-center">
                        {room.players.length < 2 
                          ? 'Need at least 2 players' 
                          : 'All players must be ready'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Game Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Players:</span>
                    <span className="font-semibold">{room.players.length}</span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between">
                    <span className="text-white/60">Ready:</span>
                    <span className="font-semibold text-green-400">
                      {room.players.filter(p => p.isReady).length}/{room.players.length}
                    </span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className="font-semibold">{room.status}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
