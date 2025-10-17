import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, useNavigate, useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'
import { useApi } from './hooks/useApi.js'
import { showSpinner, StoreProvider, useStore } from './store/index.js'
import { useAuthRedux } from './hooks/useAuthRedux.js'
import { useFoldersRedux } from './hooks/useFoldersRedux.js'
import GlobalSpinner from './components/GlobalSpinner.jsx'
import LoginPage from './pages/LoginPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import FoldersPage from './pages/FoldersPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import StatisticPage from './pages/StatisticPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import AccountDeactivatedPage from './pages/AccountDeactivatedPage.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

// Styled Components
const Header = styled.header`
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 40;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AppIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 10px;
`;

const AppTitle = styled.h1`
  color: #1e40af;
  font-size: 22px;
  margin: 0;
  font-weight: 700;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavLink = styled(Link)`
  color: #1e40af;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  position: relative;
  
  &:hover {
    background: #eff6ff;
  }
  
  &.active {
    background: #eff6ff;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 3px;
      background: #1e40af;
      border-radius: 2px;
    }
  }
`;

const LogoutButton = styled.button`
  background: #1e40af;
  color: white;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(30,64,175,0.2);
  
  &:hover {
    background: #1d4ed8;
  }
`;

const ToastBox = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${({ $type }) => $type === 'success' ? 'rgba(16,185,129,0.95)' : $type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(37,99,235,0.95)'};
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToastClose = styled.button`
  background: transparent;
  color: #e5e7eb;
  border: none;
  cursor: pointer;
  font-weight: 700;
`;

function AuthenticatedApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const { logout, email, isActive } = useAuthRedux();
  const { uiLoading, toast, clearToast } = useStore();

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      try { clearToast(); } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);
  
  const isActiveRoute = (path) => {
    if (path === '/folders') {
      return location.pathname === '/' || location.pathname === '/folders';
    }
    if (path === '/home') {
      return location.pathname === '/home';
    }
    if (path === '/statistics') {
      return location.pathname === '/statistics';
    }
    if (path === '/payment') {
      return location.pathname === '/payment';
    }
    return location.pathname.startsWith(path);
  };
  
  // Render the current page based on route
  const renderCurrent = () => {
    switch (location.pathname) {
      case '/home':
        return <WelcomePage />;
      case '/folders':
        return <FoldersPage />;
      case '/statistics':
        return <StatisticPage />;
      case '/payment':
        return <PaymentPage />;
      default:
        if (location.pathname.startsWith('/import/')) {
          return <ImportPage />;
        }
        // Default na folders
        return <FoldersPage />;
    }
  };
  
  return (
    <div>
      <Header>
        <HeaderLeft>
          <AppIcon src="/logo-app.svg" alt="Photo Keyword Generator" />
          <AppTitle>Pixel Keywords</AppTitle>
        </HeaderLeft>
        <Nav>
          <NavLink to="/home" className={isActiveRoute('/home') ? 'active' : ''}>Home</NavLink>
          <NavLink to="/folders" className={isActiveRoute('/folders') ? 'active' : ''}>Folders</NavLink>
          <NavLink to="/statistics" className={isActiveRoute('/statistics') ? 'active' : ''}>Statistics</NavLink>
          <NavLink to="/payment" className={isActiveRoute('/payment') ? 'active' : ''}>Buy Credits</NavLink>
          <LogoutButton 
            onClick={()=>{ logout(); navigate('/login',{replace:true}); }} 
            title={`Logout${email?` (${email})`:''}`} 
            aria-label="Logout"
          >
            Logout
          </LogoutButton>
        </Nav>
      </Header>
      {isActive === false && location.pathname !== '/payment' ? <AccountDeactivatedPage /> : renderCurrent()}
      <GlobalSpinner show={!!uiLoading} text={typeof uiLoading === 'string' ? uiLoading : 'Loading...'} />
      {toast ? (
        <ToastBox role="status" aria-live="polite" $type={toast.type}>
          <span>{toast.message || String(toast)}</span>
          <ToastClose onClick={clearToast} aria-label="Close toast">×</ToastClose>
        </ToastBox>
      ) : null}
    </div>
  )
}

function MainApp() {
  const { isAuthenticated, isTokenValid, initializeAuth } = useAuthRedux();
  const { loadFolders, loading: foldersLoading } = useFoldersRedux();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Initialize auth from localStorage on mount
  useEffect(() => {
    const init = async () => {
      setIsRefreshing(true);
      await initializeAuth();
      setIsInitializing(false);
      setIsRefreshing(false);
    };
    init();
  }, []); 
  // Load folders only when authenticated
  useEffect(() => {
    if (isAuthenticated && isTokenValid()) {
      loadFolders();
    }
  }, [isAuthenticated]);
  
  // Show loading while initializing or refreshing
  if (isInitializing || isRefreshing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #1e40af', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            {isInitializing ? 'Initializing...' : 'Refreshing...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Ako nema tokena ili je token nevalidan, prikaži login screen
  if (!isAuthenticated || !isTokenValid()) {
    return <LoginPage />;
  }

  // Ako je autentifikovan, prikaži glavnu aplikaciju
  return <AuthenticatedApp />;
}

const router = createBrowserRouter([
  { path: '*', element: <MainApp /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <StoreProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StoreProvider>
)

// removed duplicate bootstrapping
