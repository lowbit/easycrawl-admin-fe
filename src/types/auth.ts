export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  username: string;
  email: string;
  token: string;
  authorities: string[];
}

export interface AuthContextType {
  user: UserResponse | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
} 