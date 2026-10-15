export interface User {
  id: string;
  username: string;
  email?: string | null;
  isGuest: boolean;
  createdAt: string;
}

export interface PlayerStats {
  userId: string;
  wins: number;
  losses: number;
  draws: number;
  eloRating: number;
  totalGames: number;
  winRate: number;
}

export interface Session {
  tokenHash: string;
  userId: string;
  isGuest: boolean;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  stats?: PlayerStats;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  password?: string;
  email?: string;
}
