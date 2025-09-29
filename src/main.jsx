import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import FoldersPage from './pages/FoldersPage.jsx'
import StatisticPage from './pages/StatisticPage.jsx'
import './index.css'

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

const AppIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #1e40af;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
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


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children;
}

function RootLayout() {
  const { logout, email } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/folders') {
      return location.pathname === '/' || location.pathname === '/folders';
    }
    if (path === '/home') {
      return location.pathname === '/home';
    }
    if (path === '/statistics') {
      return location.pathname === '/statistics';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div>
      <Header>
        <HeaderLeft>
          <AppIcon>📸</AppIcon>
          <AppTitle>Photo Keyword Generator</AppTitle>
        </HeaderLeft>
        <Nav>
          <NavLink to="/home" className={isActive('/home') ? 'active' : ''}>Home</NavLink>
          <NavLink to="/folders" className={isActive('/folders') ? 'active' : ''}>Folders</NavLink>
          <NavLink to="/statistics" className={isActive('/statistics') ? 'active' : ''}>Statistics</NavLink>
          <LogoutButton 
            onClick={()=>{ logout(); navigate('/login',{replace:true}); }} 
            title={`Logout${email?` (${email})`:''}`} 
            aria-label="Logout"
          >
            Logout
          </LogoutButton>
        </Nav>
      </Header>
      <Outlet />
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <FoldersPage /> },
      { path: 'home', element: <App /> },
      { path: 'folders', element: <FoldersPage /> },
      { path: 'import/:folderId', element: <ImportPage /> },
      { path: 'statistics', element: <StatisticPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)

// removed duplicate bootstrapping
