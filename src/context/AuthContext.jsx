import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "../hooks/useApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const { login: apiLogin, register: apiRegister, logout: apiLogout } = useApi();

  useEffect(() => {
    try {
      const t = localStorage.getItem("auth_token") || "";
      const e = localStorage.getItem("auth_email") || "";
      setToken(t);
      setEmail(e);
    } catch {}
  }, []);

  const login = async (emailArg, password) => {
    try {
      const data = await apiLogin(emailArg, password);
      localStorage.setItem("auth_token", data.token || "");
      localStorage.setItem("auth_email", emailArg);
      setToken(data.token || "");
      setEmail(emailArg);
    } catch (error) {
      // Re-throw with more specific error message
      throw new Error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const register = async (emailArg, password) => {
    try {
      // Register user first
      await apiRegister(emailArg, password);
      // Then login automatically
      await login(emailArg, password);
    } catch (error) {
      // Re-throw with more specific error message
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.log('Logout error (ignored):', error);
    }
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


