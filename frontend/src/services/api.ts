import axios, { AxiosInstance, AxiosError } from 'axios';
import { Token, LoginRequest, RegisterRequest, User } from '@/types';

const configuredApi = import.meta.env.VITE_API_URL as string | undefined;
const normalizedConfiguredApi = configuredApi
  ? (configuredApi.endsWith('/api/v1') ? configuredApi : `${configuredApi.replace(/\/$/, '')}/api/v1`)
  : undefined;
const DEFAULT_API = normalizedConfiguredApi || 'http://localhost:8001/api/v1';
const API_BASE_URL = (typeof window !== 'undefined' && localStorage.getItem('api_base_url')) || DEFAULT_API;

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken && !originalRequest.url?.includes('/auth/refresh')) {
            try {
              if (!this.refreshPromise) {
                this.refreshPromise = this.refreshAccessToken(refreshToken);
              }

              const newToken = await this.refreshPromise;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              this.logout();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              this.refreshPromise = null;
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await axios.post<Token>(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return access_token;
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<Token> {
    const response = await this.client.post<Token>('/auth/login', credentials);
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Generic request methods
  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
