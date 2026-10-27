import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { apiRequest, type ApiUser } from "../api/client";
import { SessionController, type SessionStatus } from "./session-state";

interface Credentials { email: string; password: string }
interface Registration extends Credentials { name: string; confirmPassword: string; studentNumber?: string }
interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  status: SessionStatus;
  error: string | null;
  signIn: (credentials: Credentials) => Promise<ApiUser>;
  register: (details: Registration) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  changePassword: (details: { currentPassword: string; newPassword: string }) => Promise<ApiUser>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session] = useState(() => new SessionController<ApiUser>(apiRequest));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useEffect(() => {
    const disconnect = session.connect();
    void session.refresh().catch(() => {});
    return disconnect;
  }, [session]);

  return (
    <AuthContext.Provider value={{
      ...snapshot,
      loading: snapshot.status === "checking",
      signIn: (credentials) => session.authenticate("/api/auth/login", credentials),
      register: (details) => session.authenticate("/api/auth/register", details),
      signOut: session.signOut,
      changePassword: session.changePassword,
      refreshUser: session.refresh
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
