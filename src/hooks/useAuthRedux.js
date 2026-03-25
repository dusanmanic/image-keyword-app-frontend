import { useStore } from '../store/index.js';
import { useApi } from './useApi.js';
import { fetchCurrentUser } from '../services/authService.js';
import { fetchPublicTos } from '../services/tosPublicService.js';
import { useNavigate } from 'react-router-dom';

export function useAuthRedux() {
  const { 
    token, 
    email, 
    isAuthenticated, 
    setToken, 
    setEmail, 
    setAuthenticated, 
    clearAuth,
    isActive,
    setIsActive,
    setTosFromMe
  } = useStore();
  
  const { login: apiLogin, register: apiRegister, logout: apiLogout } = useApi();
  const navigate = useNavigate();

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
      
      // Set isActive status from login response
      if (typeof data.user?.isActive === 'boolean') {
        setIsActive(data.user.isActive);
      } else if (typeof data.user?.isActive === 'number') {
        setIsActive(data.user.isActive === 1);
      }

      // Identify user in widget (only on login)
      if (typeof window !== 'undefined' && window.SupportChatWidget?.identify) {
        window.SupportChatWidget.identify({
          email: data.email || emailArg || undefined,
          name: data.username || data.user?.name || undefined,
          // additionalData: {}
        });
      }
      
      const inactive =
        data.user?.isActive === false || data.user?.isActive === 0;
      if (inactive) {
        navigate('/home');
      }

      // Update localStorage
      localStorage.setItem("auth_token", data.token || "");
      localStorage.setItem("auth_email", emailArg);
      try { localStorage.setItem("remembered_email", emailArg); } catch {}

      // Fetch /me for ToS status (login response doesn't include it)
      try {
        const me = await fetchCurrentUser();
        setTosFromMe(me.tosAccepted ?? false, me.tosContent ?? null, me.tosVersion ?? null);
      } catch {
        setTosFromMe(false, null, null);
      }
      
      return { inactive: !!inactive };
    } catch (error) {
      throw new Error(error.message || "Login failed. Please check your credentials.");
    }
  };

  // Register function
  const register = async (emailArg, password) => {
    try {
      await apiRegister(emailArg, password);
      return await login(emailArg, password);
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
    
    // Notify widget about logout
    if (typeof window !== 'undefined' && window.SupportChatWidget?.logout) {
      window.SupportChatWidget.logout({ resetCustomerId: false });
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
            // Set isActive status
            if (typeof me?.user?.isActive === 'boolean') {
              setIsActive(me.user.isActive);
            } else if (typeof me?.user?.isActive === 'number') {
              setIsActive(me.user.isActive === 1);
            }
            // ToS from /me (single API call)
            setTosFromMe(me.tosAccepted ?? false, me.tosContent ?? null, me.tosVersion ?? null);
          } catch (e) {
            const msg = e?.message || '';
            if (msg.includes('User not found')) {
              clearAuth();
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_email");
            } else if (msg === 'UNAUTHORIZED') {
              clearAuth();
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_email");
            } else {
              try {
                const d = await fetchPublicTos();
                setTosFromMe(false, d.content ?? null, d.version ?? null);
              } catch {
                setTosFromMe(false, null, null);
              }
            }
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
    isActive,
    isAuthenticated: isAuthenticated && isTokenValid(),
    isTokenValid,
    setIsActive,
    login,
    register,
    logout,
    initializeAuth
  };
}
