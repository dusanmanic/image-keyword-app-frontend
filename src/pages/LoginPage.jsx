import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthPanel from '../components/AuthPanel.jsx';

function LoginPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: 24,
        width: '100%',
        maxWidth: 420
      }}>
        <h1 style={{
          color: '#1e40af',
          fontSize: 20,
          marginBottom: 16,
          textAlign: 'center',
          fontFamily: 'Nunito Sans'
        }}>
          Login / Register
        </h1>
        <AuthPanel />
      </div>
    </div>
  );
}

export default LoginPage;
