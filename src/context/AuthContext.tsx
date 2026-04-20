import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "@/types";
import { authService } from "@/services/authService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // only for initial session check
  const [isLoading, setIsLoading] = useState(false); // for login/register button spinners

  // On mount: check for existing session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authService
        .getProfile()
        .then((user) => setUser(user))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.success && res.user && res.token) {
        localStorage.setItem("token", res.token);
        setUser(res.user);
        return null;
      }
      return res.error || "Login failed";
    } catch {
      return "Unable to connect to server. Is the backend running?";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.register(username, email, password);
      if (res.success && res.user && res.token) {
        localStorage.setItem("token", res.token);
        setUser(res.user);
        return null;
      }
      return res.error || "Registration failed";
    } catch {
      return "Unable to connect to server. Is the backend running?";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // Show loading spinner ONLY during initial session restore (not during login/register)
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
