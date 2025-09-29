import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const t = localStorage.getItem("auth_token") || "";
      const e = localStorage.getItem("auth_email") || "";
      setToken(t);
      setEmail(e);
    } catch {}
  }, []);

  const login = async (emailArg, password) => {
    const res = await fetch("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailArg, password }) });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    localStorage.setItem("auth_token", data.token || "");
    localStorage.setItem("auth_email", emailArg);
    setToken(data.token || "");
    setEmail(emailArg);
  };

  const register = async (emailArg, password) => {
    const res = await fetch("/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailArg, password }) });
    if (!res.ok) throw new Error("Registration failed");
    await login(emailArg, password);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    setToken("");
    setEmail("");
  };

  const isTokenValid = () => {
    if (!token) return false;
    try {
      // Proveri da li je token validan (nije istekao)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  };

  const value = { 
    token, 
    email, 
    login, 
    register, 
    logout, 
    isAuthenticated: !!token && isTokenValid(),
    isTokenValid
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


