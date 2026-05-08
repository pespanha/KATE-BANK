import { createContext } from "react";

interface GoogleUserData {
  name?: string;
  given_name?: string;
  picture?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  isAdmin?: boolean;
  google_user_data?: GoogleUserData;
}

export type AuthState = "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthContextType {
  user: User | null;
  isPending: boolean;
  authState: AuthState;
  authError: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  redirectToLogin: (_?: unknown) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
