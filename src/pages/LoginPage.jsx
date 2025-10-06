import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthRedux } from '../hooks/useAuthRedux.js';
import AuthPanel from '../components/AuthPanel.jsx';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 20px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 24px;
  width: 100%;
  max-width: 420px;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 20px;
  margin: 0 0 16px 0;
  text-align: center;
  font-family: 'Nunito Sans';
`;

const MaskedEmail = styled.div`
  color: #1f2937;
  text-align: center;
  margin-bottom: 16px;
  font-family: 'Nunito Sans';
`;

const ButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  background: #1e40af;
  color: #fff;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px;
  font-weight: 700;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #1e40af;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
  font-weight: 700;
  cursor: pointer;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #1e40af;
  margin-bottom: 8px;
  &:hover { background: #eff6ff; }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: #e5e7eb;
    outline: none;
  }
`;

const ErrorLine = styled.div`
  font-family: 'Nunito Sans';
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 8px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, email, logout, login } = useAuthRedux();
  const [showAuth, setShowAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  let savedEmail = '';
  try { savedEmail = localStorage.getItem('remembered_email') || ''; } catch {}
  if (isAuthenticated) {
    const masked = (email || '').split('@')[0];
    return (
      <PageContainer>
        <Card>
          <Title>You’re signed in</Title>
          <MaskedEmail>{masked}</MaskedEmail>
          <ButtonsGrid>
            <PrimaryButton onClick={() => navigate('/', { replace: true })}>
              Continue
            </PrimaryButton>
            <SecondaryButton onClick={async () => { await logout(); }}>
              Use another account
            </SecondaryButton>
          </ButtonsGrid>
        </Card>
      </PageContainer>
    );
  }
  
  if (!showAuth && savedEmail) {
    const masked = (savedEmail || '').split('@')[0];
    return (
      <PageContainer>
        <Card>
          <Title>Welcome back</Title>
          <MaskedEmail>{masked}</MaskedEmail>
          {err && <ErrorLine>{err}</ErrorLine>}
          <PasswordInput
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e)=>{ setPw(e.target.value); if (err) setErr(""); }}
            autoFocus
          />
          <ButtonsGrid>
            <PrimaryButton
              onClick={async () => {
                if (!pw) { setErr('Please enter your password'); return; }
                try {
                  setBusy(true); setErr("");
                  await login(savedEmail, pw);
                  navigate('/', { replace: true });
                } catch(e) {
                  setErr(e.message || 'Login failed. Please check your credentials.');
                } finally { setBusy(false); }
              }}
              disabled={busy || !pw}
            >
              Login
            </PrimaryButton>
            <SecondaryButton onClick={() => { setShowAuth(true); }}>
              Use another account
            </SecondaryButton>
          </ButtonsGrid>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card style={{ padding: 28, maxWidth: 460 }}>
        <Title>Login / Register</Title>
        <AuthPanel initialTab="login" initialEmail={savedEmail} />
      </Card>
    </PageContainer>
  );
}

export default LoginPage;
