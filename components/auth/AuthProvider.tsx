import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  neonAuthUrl,
  requireNeonAuth,
  requireGetJWTToken,
} from "@/lib/neonAuth";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/lib/secureStore";

type DarlingUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

type AuthState = {
  isLoading: boolean;
  user: DarlingUser | null;
  jwt: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshJwt: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

const jwtKey = "darling.neon.jwt";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DarlingUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);

  const refreshJwt = useCallback(async () => {
    let tokenFn;
    try {
      tokenFn = requireGetJWTToken();
    } catch {
      tokenFn = null;
    }
    const fallbackAnonymous = async () => {
      if (!neonAuthUrl) return null;
      try {
        const res = await fetch(
          `${neonAuthUrl.replace(/\/$/, "")}/token/anonymous`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          },
        );
        if (!res.ok) return null;
        const json = (await res.json()) as { token?: string };
        return typeof json.token === "string" ? json.token : null;
      } catch {
        return null;
      }
    };

    if (!tokenFn) {
      const anon = await fallbackAnonymous();
      if (anon) {
        await setSecureItem(jwtKey, anon);
        setJwt(anon);
        return anon;
      }
      return null;
    }
    let token: string | null = null;
    try {
      token = await tokenFn();
    } catch {
      const anon = await fallbackAnonymous();
      if (anon) {
        await setSecureItem(jwtKey, anon);
        setJwt(anon);
        return anon;
      }
      return null;
    }
    if (typeof token === "string" && token.length > 0) {
      await setSecureItem(jwtKey, token);
      setJwt(token);
      return token;
    }
    const anon = await fallbackAnonymous();
    if (anon) {
      await setSecureItem(jwtKey, anon);
      setJwt(anon);
      return anon;
    }
    return null;
  }, []);

  const hydrate = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedJwt = await getSecureItem(jwtKey);
      setJwt(storedJwt);

      let auth: any;
      try {
        auth = requireNeonAuth();
      } catch {
        setUser(null);
        return;
      }
      const sessionResult = await auth.getSession();
      const sessionUser = sessionResult?.data?.user ?? null;
      if (sessionUser) {
        setUser(sessionUser as DarlingUser);
      } else {
        setUser(null);
      }
      await refreshJwt();
    } finally {
      setIsLoading(false);
    }
  }, [refreshJwt]);

  useEffect(() => {
    void hydrate().catch(() => {});
  }, [hydrate]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = requireNeonAuth();
      const result = await auth.signIn.email({ email, password });
      if (result?.error) {
        throw new Error(result.error.message ?? "Sign in failed");
      }
      await hydrate();
    },
    [hydrate],
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = requireNeonAuth();
      const result = await auth.signUp.email({ name, email, password });
      if (result?.error) {
        throw new Error(result.error.message ?? "Sign up failed");
      }
      await hydrate();
    },
    [hydrate],
  );

  const signOut = useCallback(async () => {
    try {
      const auth = requireNeonAuth();
      await auth.signOut();
    } catch {}
    await deleteSecureItem(jwtKey);
    setJwt(null);
    setUser(null);
    await refreshJwt();
  }, [refreshJwt]);

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      user,
      jwt,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshJwt,
    }),
    [
      isLoading,
      jwt,
      refreshJwt,
      signInWithEmail,
      signOut,
      signUpWithEmail,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthProvider is missing");
  }
  return ctx;
}
