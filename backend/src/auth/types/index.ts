export interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface AuthUser extends Omit<User, 'password'> {
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}