import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";

export default function App() {
  const location = useLocation();
  const { isAuthenticated, isTokenValid } = useAuth();

  // Ako nema tokena ili je token nevalidan, prikaži login screen
  if (!isAuthenticated || !isTokenValid()) {
    return <LoginPage />;
  }

  // Ako je na home ruti, prikaži welcome stranicu
  if (location.pathname === '/home') {
    return <WelcomePage />;
  }

  // Za sve ostale rute, renderuj Outlet
  return <Outlet />;
}