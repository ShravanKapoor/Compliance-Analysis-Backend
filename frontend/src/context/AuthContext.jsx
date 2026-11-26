import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking, null = signed out
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    setUnauthorizedHandler(() => setUser(null)); // session expired mid-use
  }, [refresh]);

  const signIn = useCallback(
    async (email, password) => {
      await api.signIn(email, password);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading: user === undefined, isAdmin: user?.role === "admin", signIn, signOut, refresh }),
    [user, signIn, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
