import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLogOut, FiUsers, FiArrowRight, FiPlus, FiLogIn } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import authService from '../utils/authService';
import axiosInstance from '../utils/axiosInstance';

function LobbyPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchAllPlayers();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const user = await authService.autoLogin();
    setCurrentUser(user);
    setIsLoading(false);
  };

  const fetchAllPlayers = async () => {
    try {
      const response = await axiosInstance.get('/players');
      setAllPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const player = await authService.authenticateUser(name.trim());
      setCurrentUser({ id: player._id, name: player.name });
      setName('');
      fetchAllPlayers();
    } catch (error) {
      alert('Failed to login');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleCreateRoom = async () => {
    if (!currentUser) {
      alert('Please login first');
      return;
    }

    try {
      const response = await axiosInstance.post('/rooms', {
        hostId: currentUser.id
      });
      navigate(`/room/${response.data.code}`);
    } catch (error) {
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    if (!currentUser) {
      alert('Please login first');
      return;
    }

    try {
      await axiosInstance.get(`/rooms/code/${roomCode}`);
      navigate(`/room/${roomCode}`);
    } catch (error) {
      alert('Room not found');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Grid Background */}
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
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tighter"
              >
                Behaviour<span className="text-white/40">Call</span>
              </motion.h1>
              
              {currentUser && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4"
                >
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-white/60 hover:text-white hover:bg-white/5"
                  >
                    <FiLogOut className="mr-2" />
                    Logout
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            {/* Left Section - Auth & Room Actions */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {!currentUser ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-2xl">Welcome</CardTitle>
                        <CardDescription className="text-white/60">
                          Enter your name to start playing
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleLogin} className="flex gap-3">
                          <Input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                          />
                          <Button type="submit" className="bg-white text-black hover:bg-white/90">
                            <FiLogIn className="mr-2" />
                            Enter
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Profile Card */}
                    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
                      <CardContent className="relative pt-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-white/20">
                            <AvatarFallback className="bg-white/10 text-white text-xl">
                              {currentUser.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                            <p className="text-white/60 text-sm">Ready to play</p>
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                            <FiUser className="mr-1" />
                            Player
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Room Actions */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                          onClick={handleCreateRoom}
                          className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 cursor-pointer transition-all group"
                        >
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <FiPlus className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Create Room</h3>
                                <p className="text-sm text-white/60">Start a new game</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                          <CardContent className="pt-6">
                            <form onSubmit={handleJoinRoom} className="space-y-3">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                  <FiArrowRight className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold">Join Room</h3>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  placeholder="Enter code"
                                  value={roomCode}
                                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20 text-center"
                                  maxLength={6}
                                />
                                <Button type="submit" size="icon" className="bg-white text-black hover:bg-white/90">
                                  <FiArrowRight />
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Section - Players List */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiUsers />
                    All Players
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {allPlayers.length} {allPlayers.length === 1 ? 'player' : 'players'} on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allPlayers.length === 0 ? (
                      <p className="text-white/40 text-center py-8 text-sm">No players yet</p>
                    ) : (
                      allPlayers.map((player, index) => (
                        <motion.div
                          key={player._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                            <Avatar className="h-10 w-10 border border-white/10">
                              <AvatarFallback className="bg-white/10 text-white">
                                {player.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{player.name}</p>
                              {currentUser?.id === player._id && (
                                <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                          {index < allPlayers.length - 1 && <Separator className="bg-white/5" />}
                        </motion.div>
                      ))
                    )}
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

export default LobbyPage;
