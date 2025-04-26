import axios from 'axios';
import { LoginRequest, UserResponse } from '@/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

export const authService = {
  async login(credentials: LoginRequest): Promise<UserResponse> {
    const response = await axios.post<UserResponse>(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  setAuthToken(token: string | null) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  getStoredUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.setAuthToken(user.token);
      return user;
    }
    return null;
  },

  storeUser(user: UserResponse) {
    localStorage.setItem('user', JSON.stringify(user));
    this.setAuthToken(user.token);
  },

  removeUser() {
    localStorage.removeItem('user');
    this.setAuthToken(null);
  }
}; 