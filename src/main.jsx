import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { useApi } from './hooks/useApi.js'
import { showSpinner, StoreProvider, useStore } from './store/index.js'
import { useAuthRedux } from './hooks/useAuthRedux.js'
import { useFoldersRedux } from './hooks/useFoldersRedux.js'
import GlobalSpinner from './components/GlobalSpinner.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import FoldersPage from './pages/FoldersPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import StatisticPage from './pages/StatisticPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import AccountDeactivatedPage from './pages/AccountDeactivatedPage.jsx'
import { TosModal } from './components/TosModal.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

// Styled Components
const Header = styled.header`
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
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
  font-size: clamp(14px, 2.4vw, 22px);
  margin: 0;
  font-weight: 700;
  line-height: 1.2;
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
    background: #f3f4f6;
  }
  
  &.active {
    background: #f3f4f6;
    
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

const StorageIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: ${props => props.$isOverLimit ? 'rgba(239,68,68,0.15)' : props.$isWarning ? 'rgba(245,158,11,0.15)' : 'rgba(37,99,235,0.1)'};
  border: 1px solid ${props => props.$isOverLimit ? 'rgba(239,68,68,0.3)' : props.$isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(37,99,235,0.2)'};
  color: ${props => props.$isOverLimit ? '#dc2626' : props.$isWarning ? '#d97706' : '#1e40af'};
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
`;

const StorageText = styled.span`
  white-space: nowrap;
`;

const StorageProgress = styled.div`
  width: 60px;
  height: 4px;
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const StorageProgressBar = styled.div`
  height: 100%;
  background: ${props => props.$isOverLimit ? '#dc2626' : props.$isWarning ? '#d97706' : '#1e40af'};
  width: ${props => Math.min(100, props.$percentage)}%;
  transition: width 0.3s ease;
`;

function AuthenticatedApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const { logout, email, isActive } = useAuthRedux();
  const { uiLoading, toast, clearToast } = useStore();
  const [storageInfo, setStorageInfo] = useState(null);
  const [spendingInfo, setSpendingInfo] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingSpending, setLoadingSpending] = useState(false);

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      try { clearToast(); } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  // Load storage info
  useEffect(() => {
    const loadStorage = async () => {
      try {
        setLoadingStorage(true);
        const token = localStorage.getItem('auth_token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/user/storage-info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStorageInfo(data.storage);
          }
        }
      } catch (error) {
        console.error('Error loading storage info:', error);
      } finally {
        setLoadingStorage(false);
      }
    };
    loadStorage();
    const interval = setInterval(loadStorage, 30000);
    const onRefreshUser = () => loadStorage();
    window.addEventListener('refresh-user', onRefreshUser);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-user', onRefreshUser);
    };
  }, []);

  // Load spending/analysis info (tokens = analyses)
  useEffect(() => {
    const loadSpending = async () => {
      try {
        setLoadingSpending(true);
        const token = localStorage.getItem('auth_token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/user/spending-info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.spending) {
            setSpendingInfo(data.spending);
          }
        }
      } catch (error) {
        console.error('Error loading spending info:', error);
      } finally {
        setLoadingSpending(false);
      }
    };
    loadSpending();
    const interval = setInterval(loadSpending, 30000);
    const onRefreshUser = () => {
      loadSpending();
    };
    window.addEventListener('refresh-user', onRefreshUser);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-user', onRefreshUser);
    };
  }, []);
  
  const isActiveRoute = (path) => {
    if (path === '/folders') {
      return location.pathname === '/folders';
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
          <AppIcon src="/logo-app.svg" alt="Jaba Keyword" />
          <AppTitle>Jaba Keyword</AppTitle>
        </HeaderLeft>
        <Nav>
          {spendingInfo && !loadingSpending && (
            spendingInfo.remaining <= 0 ? (
              <Link to="/payment" style={{ textDecoration: 'none' }}>
                <StorageIndicator 
                  $isOverLimit 
                  $isWarning={false}
                  title="No analyses left. Click to buy more."
                  style={{ cursor: 'pointer' }}
                >
                  <StorageText>
                    🎯 0 left · Buy more
                  </StorageText>
                </StorageIndicator>
              </Link>
            ) : (
              <StorageIndicator 
                $isOverLimit={false} 
                $isWarning={spendingInfo.percentage >= 80}
                title={`Analyses: ${spendingInfo.current} / ${spendingInfo.limit} (${spendingInfo.remaining} remaining)`}
              >
                <StorageText>
                  🎯 {spendingInfo.current} / {spendingInfo.limit}
                </StorageText>
                <StorageProgress>
                  <StorageProgressBar 
                    $percentage={Math.min(100, spendingInfo.percentage)}
                    $isOverLimit={false}
                    $isWarning={spendingInfo.percentage >= 80}
                  />
                </StorageProgress>
              </StorageIndicator>
            )
          )}
          {storageInfo && !loadingStorage && (
            <StorageIndicator 
              $isOverLimit={storageInfo.isOverLimit} 
              $isWarning={storageInfo.percentage >= 80}
              title={`Storage: ${storageInfo.total.formatted} / ${storageInfo.limit.formatted} (${storageInfo.remaining.formatted} remaining)`}
            >
              <StorageText>
                📦 {storageInfo.total.formatted} / {storageInfo.limit.formatted}
              </StorageText>
              <StorageProgress>
                <StorageProgressBar 
                  $percentage={Math.min(100, storageInfo.percentage)}
                  $isOverLimit={storageInfo.isOverLimit}
                  $isWarning={storageInfo.percentage >= 80}
                />
              </StorageProgress>
            </StorageIndicator>
          )}
          <NavLink to="/home" className={isActiveRoute('/home') ? 'active' : ''}>Home</NavLink>
          <NavLink to="/folders" className={isActiveRoute('/folders') ? 'active' : ''}>Folders</NavLink>
          {/* <NavLink to="/statistics" className={isActiveRoute('/statistics') ? 'active' : ''}>Statistics</NavLink> */}
          <NavLink to="/payment" className={isActiveRoute('/payment') ? 'active' : ''}>Buy Analyses</NavLink>
          <LogoutButton 
            onClick={()=>{ logout(); navigate('/login',{replace:true}); }} 
            title={`Logout${email?` (${email})`:''}`} 
            aria-label="Logout"
          >
            Logout
          </LogoutButton>
        </Nav>
      </Header>
      {isActive === false && location.pathname !== '/payment' && location.pathname !== '/home' ? <AccountDeactivatedPage /> : renderCurrent()}
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

const LoadingScreen = () => (
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
      }} />
      <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
    </div>
  </div>
);

function MainApp() {
  const location = useLocation();
  const pathname = location.pathname;
  const { isAuthenticated, isTokenValid, initializeAuth } = useAuthRedux();
  const { tosAccepted, tosContent, setTosFromMe } = useStore();
  const { loadFolders } = useFoldersRedux();
  const { acceptTos } = useApi();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tosError, setTosError] = useState(null);
  const [tosSubmitting, setTosSubmitting] = useState(false);

  // Initialize auth from localStorage on mount (fetches /me with ToS – single API call)
  useEffect(() => {
    const init = async () => {
      setIsRefreshing(true);
      await initializeAuth();
      setIsInitializing(false);
      setIsRefreshing(false);
    };
    init();
  }, []);

  // Load folders only when authenticated AND ToS accepted
  useEffect(() => {
    if (isAuthenticated && isTokenValid() && tosAccepted === true) {
      loadFolders();
    }
  }, [isAuthenticated, tosAccepted]);

  const handleTosAccept = async (content) => {
    if (!content || tosSubmitting) return;
    setTosSubmitting(true);
    setTosError(null);
    try {
      await acceptTos(content);
      setTosFromMe(true, null, null);
    } catch (e) {
      setTosError(e.message || 'Failed to accept Terms of Service');
    } finally {
      setTosSubmitting(false);
    }
  };

  if (isInitializing || isRefreshing) {
    return <LoadingScreen />;
  }

  const authed = isAuthenticated && isTokenValid();

  if (!authed) {
    if (pathname === '/') return <LandingPage />;
    if (pathname === '/login') return <LoginPage />;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Waiting for /me response (ToS status) – show loading, don't flash modal
  if (tosAccepted === null) {
    return <LoadingScreen />;
  }

  // ToS required: show full-screen modal until acceptance
  if (tosAccepted === false) {
    return (
      <TosModal
        tosContent={tosContent || ''}
        onAccept={handleTosAccept}
        isLoading={tosSubmitting}
        error={tosError}
      />
    );
  }

  if (pathname === '/login') {
    return <Navigate to="/folders" replace />;
  }

  if (pathname === '/') {
    return <LandingPage />;
  }

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
