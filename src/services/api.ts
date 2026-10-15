import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

const API_BASE = '/api';

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
