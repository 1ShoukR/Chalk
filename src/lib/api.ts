import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const publicPathPrefixes = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];

type AuthHandlers = {
  onAuthFailure: () => Promise<void> | void;
  onRefreshToken: () => Promise<string | null>;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let accessToken: string | null = null;
let authHandlers: Partial<AuthHandlers> = {};
let refreshInFlight: Promise<string | null> | null = null;

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
});

function isPublicPath(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return publicPathPrefixes.some((path) => url.includes(path));
}

api.interceptors.request.use((config) => {
  if (!accessToken || isPublicPath(config.url)) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${accessToken}`;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const requestConfig = error.config as RetryConfig | undefined;

    if (
      status !== 401 ||
      !requestConfig ||
      requestConfig._retry ||
      isPublicPath(requestConfig.url) ||
      !authHandlers.onRefreshToken
    ) {
      return Promise.reject(error);
    }

    requestConfig._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = authHandlers.onRefreshToken().finally(() => {
          refreshInFlight = null;
        });
      }

      const nextAccessToken = await refreshInFlight;

      if (!nextAccessToken) {
        await authHandlers.onAuthFailure?.();
        return Promise.reject(error);
      }

      requestConfig.headers = requestConfig.headers ?? {};
      requestConfig.headers.Authorization = `Bearer ${nextAccessToken}`;

      return api(requestConfig);
    } catch (refreshError) {
      await authHandlers.onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  },
);

function setAccessToken(token: string | null): void {
  accessToken = token;
}

function setAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

function clearAuthHandlers(): void {
  authHandlers = {};
  refreshInFlight = null;
}

export { api, clearAuthHandlers, setAccessToken, setAuthHandlers };
