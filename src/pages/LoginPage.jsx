import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthRedux } from '../hooks/useAuthRedux.js';
import { getPostLoginPath } from '../utils/postLoginRedirect.js';
import AuthPanel from '../components/AuthPanel.jsx';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  padding: 20px;
`;

const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 24px;
  width: 100%;
  max-width: 420px;
`;

const Title = styled.h1`
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0 0 16px 0;
  text-align: center;
`;

const MaskedEmail = styled.div`
  color: #1f2937;
  text-align: center;
  margin-bottom: 16px;
  font-family: 'Inter';
`;

const ButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  background: var(--accent);
  color: var(--paper);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 10px;
  font-weight: 500;
  &:hover { background: var(--accent-deep); }
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-sm);
  padding: 10px;
  font-weight: 500;
  &:hover { background: var(--surface-2); }
  cursor: pointer;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: var(--ink);
  margin-bottom: 8px;
  &:hover { background: var(--accent-wash); }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: #e5e7eb;
    outline: none;
  }
`;

const ErrorLine = styled.div`
  font-family: 'Inter';
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 8px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

const LoginFooter = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.6;
`;

const FooterLink = styled(Link)`
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
            <PrimaryButton onClick={() => navigate('/folders', { replace: true })}>
              Continue
            </PrimaryButton>
            <SecondaryButton onClick={async () => { await logout(); }}>
              Use another account
            </SecondaryButton>
          </ButtonsGrid>
          <LoginFooter>
            <FooterLink to="/">Back to home</FooterLink>
            {' · '}
            <FooterLink to="/terms">Terms of Service</FooterLink>
            {' · '}
            <FooterLink to="/privacy">Privacy</FooterLink>
          </LoginFooter>
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
                  const result = await login(savedEmail, pw);
                  if (result?.inactive) return;
                  navigate(getPostLoginPath(location), { replace: true });
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
          <LoginFooter>
            <FooterLink to="/">Back to home</FooterLink>
            {' · '}
            <FooterLink to="/terms">Terms of Service</FooterLink>
            {' · '}
            <FooterLink to="/privacy">Privacy</FooterLink>
          </LoginFooter>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card style={{ padding: 28, maxWidth: 460 }}>
        <Title>Login / Register</Title>
        <AuthPanel initialTab="login" initialEmail={savedEmail} />
        <LoginFooter>
          <FooterLink to="/">Back to home</FooterLink>
          {' · '}
          <FooterLink to="/terms">Terms of Service</FooterLink>
          {' · '}
          <FooterLink to="/privacy">Privacy</FooterLink>
        </LoginFooter>
      </Card>
    </PageContainer>
  );
}

export default LoginPage;
