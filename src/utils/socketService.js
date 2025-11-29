import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://behaviourcall.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emit events
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Lobby events
  joinLobby(playerId) {
    this.emit('join-lobby', playerId);
  }

  // Room events
  joinRoom(playerId, roomCode) {
    this.emit('join-room', { playerId, roomCode });
  }

  leaveRoom(playerId, roomCode) {
    this.emit('leave-room', { playerId, roomCode });
  }

  updateReady(roomCode, playerId, isReady) {
    this.emit('update-ready', { roomCode, playerId, isReady });
  }

  // Game events
  startRound(roomCode, roundId) {
    this.emit('start-round', { roomCode, roundId });
  }

  changePhase(roomCode, phase, roundId) {
    this.emit('phase-change', { roomCode, phase, roundId });
  }

  submitPrediction(roomCode, playerId) {
    this.emit('prediction-submitted', { roomCode, playerId });
  }

  markPredictionHappened(roomCode, predictionId) {
    this.emit('prediction-happened', { roomCode, predictionId });
  }
}

export default new SocketService();
