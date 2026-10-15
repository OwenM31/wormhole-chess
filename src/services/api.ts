import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

const API_BASE = '/api';

export interface MatchRecord {
  id: string;
  variant: string;
  whiteUserId?: string | null;
  whiteUsername?: string | null;
  blackUserId?: string | null;
  blackUsername?: string | null;
  winnerId?: string | null;
  result?: string | null;
  moves?: any[];
  startedAt: string;
  endedAt?: string | null;
}

export interface CustomDeckRecord {
  id: string;
  deckName: string;
  cardIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordMatchPayload {
  variant: string;
  opponentName?: string;
  result?: string;
  winner: 'white' | 'black' | 'draw' | null;
  moves: any[];
  startedAt: number;
  endedAt: number;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    const errorMsg =
      (data as { error?: string }).error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return fetchJson<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return fetchJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async loginAsGuest(): Promise<AuthResponse> {
    return fetchJson<AuthResponse>('/auth/guest', {
      method: 'POST',
    });
  },

  async logout(): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<AuthResponse> {
    return fetchJson<AuthResponse>('/auth/me', {
      method: 'GET',
    });
  },
};

export const matchApi = {
  async getMatchHistory(params?: {
    limit?: number;
    offset?: number;
    variant?: string;
  }): Promise<{ success: boolean; matches: MatchRecord[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params?.variant) searchParams.set('variant', params.variant);

    const qs = searchParams.toString();
    const endpoint = `/matches${qs ? `?${qs}` : ''}`;
    return fetchJson<{ success: boolean; matches: MatchRecord[]; total: number }>(endpoint, {
      method: 'GET',
    });
  },

  async recordMatch(payload: RecordMatchPayload): Promise<{ success: boolean; matchId: string }> {
    return fetchJson<{ success: boolean; matchId: string }>('/matches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const deckApi = {
  async getCustomDecks(): Promise<{ success: boolean; decks: CustomDeckRecord[] }> {
    return fetchJson<{ success: boolean; decks: CustomDeckRecord[] }>('/decks', {
      method: 'GET',
    });
  },

  async saveCustomDeck(payload: {
    id?: string;
    deckName: string;
    cardIds: string[];
    isActive?: boolean;
  }): Promise<{ success: boolean; deck: CustomDeckRecord }> {
    return fetchJson<{ success: boolean; deck: CustomDeckRecord }>('/decks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const api = {
  ...authApi,
  ...matchApi,
  ...deckApi,
};
