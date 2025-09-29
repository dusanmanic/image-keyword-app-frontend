import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useAuthCheck() {
  const { isAuthenticated, isTokenValid } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Proveri da li je korisnik autentifikovan i da li je token validan
    if (!isAuthenticated || !isTokenValid()) {
      // Ako nije autentifikovan ili je token nevalidan, preusmeri na login
      navigate('/login');
    }
  }, [isAuthenticated, isTokenValid, navigate]);

  return { isAuthenticated, isTokenValid };
}
