import { isAxiosError } from 'axios';

import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type AuthResult = components['schemas']['AuthResult'];
type AccountCapabilitiesResponse = components['schemas']['AccountCapabilitiesResponse'];
type CoachProfile = components['schemas']['CoachProfile'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type LoginInput = components['schemas']['LoginInput'];
type LogoutInput = components['schemas']['LogoutInput'];
type MessageResponse = components['schemas']['MessageResponse'];
type RefreshInput = components['schemas']['RefreshInput'];
type RegisterInput = components['schemas']['RegisterInput'];
type User = components['schemas']['User'];

async function login(input: LoginInput): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/api/v1/auth/login', input);
  return data;
}

async function register(input: RegisterInput): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/api/v1/auth/register', input);
  return data;
}

async function refresh(input: RefreshInput): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/api/v1/auth/refresh', input);
  return data;
}

async function logout(input?: LogoutInput): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/api/v1/auth/logout', input ?? {});
  return data;
}

async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/v1/users/me');
  return data;
}

async function getMyCoachProfile(): Promise<CoachProfile> {
  const { data } = await api.get<CoachProfile>('/api/v1/coaches/me');
  return data;
}

async function getMyCapabilities(): Promise<AccountCapabilitiesResponse> {
  const { data } = await api.get<AccountCapabilitiesResponse>('/api/v1/users/capabilities');
  return data;
}

function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ErrorResponse>(error)) {
    return fallback;
  }

  const responseError = error.response?.data?.error;

  if (typeof responseError === 'string' && responseError.length > 0) {
    return responseError;
  }

  if (typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

export {
  getApiErrorMessage,
  getMyCapabilities,
  getMe,
  getMyCoachProfile,
  isNotFoundError,
  login,
  logout,
  refresh,
  register,
};
export type { LoginInput, RegisterInput };
