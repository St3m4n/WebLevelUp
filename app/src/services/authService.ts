import type { ProfileOverrides, UsuarioPerfil } from '@/types';
import { apiPost } from '@/services/apiClient';

export type LoginRequest = {
  correo: string;
  password: string;
};

export type RegisterRequest = {
  run: string;
  nombre: string;
  apellidos: string;
  correo: string;
  fechaNacimiento?: string | null;
  region: string;
  comuna: string;
  direccion: string;
  password: string;
  referralCode?: string;
};

export type AuthenticatedUser = {
  run: string;
  nombre: string;
  apellidos: string;
  correo: string;
  perfil: UsuarioPerfil;
  fechaNacimiento?: string | null;
  region?: string | null;
  comuna?: string | null;
  direccion?: string | null;
  descuentoVitalicio?: boolean;
  systemAccount?: boolean;
  referralCode?: string;
  overrides?: ProfileOverrides;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  user: AuthenticatedUser;
};

export const login = (payload: LoginRequest) =>
  apiPost<AuthResponse>('/auth/login', payload, { auth: false });

export const register = (payload: RegisterRequest) =>
  apiPost<AuthResponse>('/auth/register', payload, { auth: false });
