
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem("aumDacroUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user session", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const isPublicPath = pathname === "/login" || pathname === "/register";
      if (!user && !isPublicPath && pathname.startsWith("/dashboard")) {
        router.push("/login");
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("aumDacroUser", JSON.stringify(userData));
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aumDacroUser");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
