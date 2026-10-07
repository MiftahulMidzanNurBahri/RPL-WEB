import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest, hasSessionHint, type ApiData, type ApiUser } from "../api/client";

interface Credentials {
  email: string;
  password: string;
}

interface Registration extends Credentials {
  name: string;
  confirmPassword: string;
  studentNumber?: string;
}

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  signIn: (credentials: Credentials) => Promise<ApiUser>;
  register: (details: Registration) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!hasSessionHint()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await apiRequest<ApiData<ApiUser>>("/api/auth/me");
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const signIn = async (credentials: Credentials) => {
    const response = await apiRequest<ApiData<ApiUser>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    setUser(response.data);
    return response.data;
  };

  const register = async (details: Registration) => {
    const response = await apiRequest<ApiData<ApiUser>>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(details)
    });
    setUser(response.data);
    return response.data;
  };

  const signOut = async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}