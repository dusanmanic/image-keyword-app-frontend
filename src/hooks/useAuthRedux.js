import { useStore } from '../store/index.js';
import { useApi } from './useApi.js';
import { fetchCurrentUser } from '../services/authService.js';

export function useAuthRedux() {
  const { 
    token, 
    email, 
    isAuthenticated, 
    setToken, 
    setEmail, 
    setAuthenticated, 
    clearAuth,
    openAiApiKey,
    setOpenAiApiKey,
    isActive,
    setIsActive
  } = useStore();
  
  const { login: apiLogin, register: apiRegister, logout: apiLogout } = useApi();

  // Helper function to check if token is valid
  const isTokenValid = () => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  };

  // Login function
  const login = async (emailArg, password) => {
    try {
      const data = await apiLogin(emailArg, password);
      
      // Update Redux state
      setToken(data.token || "");
      setEmail(emailArg);
      setAuthenticated(true);
      try {
        const apiKey = (data?.user?.openAiApiKey || '').trim();
        if (apiKey) setOpenAiApiKey(apiKey);
      } catch {}
      
      // Update localStorage
      localStorage.setItem("auth_token", data.token || "");
      localStorage.setItem("auth_email", emailArg);
      try { localStorage.setItem("remembered_email", emailArg); } catch {}
      
    } catch (error) {
      throw new Error(error.message || "Login failed. Please check your credentials.");
    }
  };

  // Register function
  const register = async (emailArg, password) => {
    try {
      // Register user first
      await apiRegister(emailArg, password);
      // Then login automatically
      await login(emailArg, password);
    } catch (error) {
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.log('Logout error (ignored):', error);
    }
    
    // Clear Redux state
    clearAuth();
    
    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
  };

  // Initialize auth from localStorage
  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const email = localStorage.getItem("auth_email") || "";
      
      if (token && email) {
        // Check token validity before setting state
        const isValid = (() => {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
          } catch {
            return false;
          }
        })();
        
        setToken(token);
        setEmail(email);
        setAuthenticated(isValid);
        if (isValid) {
          try {
            const me = await fetchCurrentUser();
            const apiKey = (me?.user?.openAiApiKey || '').trim();
            if (apiKey) setOpenAiApiKey(apiKey);
            
            // Set isActive status
            if (typeof me?.user?.isActive === 'boolean') {
              setIsActive(me.user.isActive);
            } else if (typeof me?.user?.isActive === 'number') {
              setIsActive(me.user.isActive === 1);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  return {
    token,
    email,
    openAiApiKey,
    isActive,
    isAuthenticated: isAuthenticated && isTokenValid(),
    isTokenValid,
    login,
    register,
    logout,
    initializeAuth
  };
}
