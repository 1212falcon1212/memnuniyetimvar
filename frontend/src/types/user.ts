export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: "user" | "mod";
  reviewCount: number;
  helpfulCount: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
