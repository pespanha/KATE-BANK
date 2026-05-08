import { useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { AuthContext, User, AuthState } from "./AuthContext";
import { fetchCurrentUser, clearUserCache } from "@/react-app/hooks/useApi";

// Timeout para evitar loading infinito
const AUTH_CHECK_TIMEOUT = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const fetchUser = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setAuthState("loading");
    }
    setAuthError(null);
    
    // Timeout para não ficar em loading infinito
    const timeoutPromise = new Promise<{ user: null; error: { isAuthError: true } }>((resolve) => {
      setTimeout(() => {
        console.warn("[Auth] Timeout - treating as unauthenticated");
        resolve({ user: null, error: { isAuthError: true } as any });
      }, AUTH_CHECK_TIMEOUT);
    });
    
    try {
      const result = await Promise.race([fetchCurrentUser(), timeoutPromise]);
      
      if (result.user) {
        setUser(result.user);
        setAuthState("authenticated");
      } else if (result.error?.isAuthError) {
        setUser(null);
        setAuthState("unauthenticated");
      } else if (result.error) {
        // Erros não-auth → tratar como não autenticado para evitar loop
        console.warn("[Auth] Non-auth error, treating as unauthenticated");
        setUser(null);
        setAuthState("unauthenticated");
      } else {
        setUser(null);
        setAuthState("unauthenticated");
      }
    } catch (err) {
      console.error("[Auth] Exception:", err);
      setUser(null);
      setAuthState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // Prevenir double init no React strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    fetchUser(true);
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Ignore errors
    }
    clearUserCache();
    setUser(null);
    setAuthState("unauthenticated");
    window.location.href = "/";
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    clearUserCache();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Erro ao fazer login");
    }

    setUser(data.user);
    setAuthState("authenticated");
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    clearUserCache();
    await fetchUser(false);
  }, [fetchUser]);

  const redirectToLogin = useCallback((_?: unknown) => {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }, []);

  const isPending = authState === "loading";

  return (
    <AuthContext.Provider value={{ 
      user, 
      isPending, 
      authState, 
      authError,
      login,
      logout, 
      refreshUser, 
      redirectToLogin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
