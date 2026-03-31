import api from '@/services/api';
import type { RegisterRequest, TokenResponse, User, ProfileUpdate } from '@/types/user';

export async function registerUser(data: RegisterRequest): Promise<User> {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  const res = await api.post('/auth/login', form);
  return res.data;
}

export async function refreshToken(token: string): Promise<TokenResponse> {
  const res = await api.post('/auth/refresh', { refresh_token: token });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function updateProfile(data: ProfileUpdate): Promise<User> {
  const res = await api.put('/auth/me', data);
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, new_password: newPassword });
}
