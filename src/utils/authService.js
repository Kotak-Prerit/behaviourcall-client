import { jwtDecode } from 'jwt-decode';
import axiosInstance from './axiosInstance';

const TOKEN_KEY = 'auth_token';
const PLAYER_KEY = 'playerId';

class AuthService {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Save token to localStorage
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLAYER_KEY);
  }

  // Check if token is valid
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get current user from token
  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.playerId,
        name: decoded.name,
        exp: decoded.exp
      };
    } catch (error) {
      return null;
    }
  }

  // Login/Register user
  async authenticateUser(name) {
    try {
      const response = await axiosInstance.post('/auth/login', { name });
      const { token, player } = response.data;
      
      this.setToken(token);
      localStorage.setItem(PLAYER_KEY, player._id);
      
      return player;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    this.removeToken();
  }

  // Auto-login if token is valid
  async autoLogin() {
    if (this.isTokenValid()) {
      const user = this.getCurrentUser();
      if (user) {
        localStorage.setItem(PLAYER_KEY, user.id);
        return user;
      }
    }
    return null;
  }
}

export default new AuthService();
