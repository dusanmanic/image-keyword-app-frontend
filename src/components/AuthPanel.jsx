import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuthRedux } from "../hooks/useAuthRedux.js";
import { getPostLoginPath } from "../utils/postLoginRedirect.js";
import GlobalSpinner from "./GlobalSpinner.jsx";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: var(--paper);
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 12px;
`;

const TabButton = styled.button`
  background: ${props => props.$active ? 'var(--accent)' : 'transparent'};
  color: ${props => props.$active ? '#fff' : 'var(--accent)'};
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 700;
  padding: 10px;
  cursor: pointer;

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const Input = styled.input`
  width: 438px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: var(--accent);

  &:hover { background: var(--accent-wash); }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: #e5e7eb;
    outline: none;  
  }
`;

const Button = styled.button`
  width: 100%;
  background: var(--accent);
  color: white;
  font-weight: 600;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Line = styled.div`
  font-family: 'Inter';
  font-size: 12px;
  color: var(--accent);
  margin-top: 6px;
`;

const ErrorLine = styled.div`
  font-family: 'Inter';
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

const Title = styled.div`
  font-family: 'Inter';
  font-weight: 700;
  color: var(--accent);
  font-size: 18px;
  margin-bottom: 2px;
`;

const Sub = styled.div`
  font-family: 'Inter';
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

export default function AuthPanel({ initialTab = 'login', initialEmail = '' }) {
  const { isAuthenticated, email, login, register, logout } = useAuthRedux();
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState(initialEmail);
  const [registerPassword, setRegisterPassword] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [busy, setBusy] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [registerErr, setRegisterErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const validate = (emailValue, passwordValue, setError) => {
    if (!emailValue || !passwordValue) {
      setError("Please fill in all fields");
      return false;
    }
    if (!emailValue.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (passwordValue.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const doLogin = async () => {
    if (!validate(loginEmail, loginPassword, setLoginErr)) return;
    try {
      setBusy(true); setLoginErr("");
      const result = await login(loginEmail, loginPassword);
      setLoginEmail(""); setLoginPassword("");
      if (result?.inactive) return;
      navigate(getPostLoginPath(location), { replace: true });
    } catch (e) {
      setLoginErr(e.message || "Login failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    if (!validate(registerEmail, registerPassword, setRegisterErr)) return;
    try {
      setBusy(true); setRegisterErr("");
      const result = await register(registerEmail, registerPassword);
      setRegisterEmail(""); setRegisterPassword("");
      if (result?.inactive) return;
      navigate(getPostLoginPath(location), { replace: true });
    } catch (e) {
      setRegisterErr(e.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Wrapper>
        <Line>Logged in as {email}</Line>
        <Button onClick={logout}>Logout</Button>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Tabs>
        <TabButton $active={activeTab === 'login'} onClick={() => setActiveTab('login')}>Login</TabButton>
        <TabButton $active={activeTab === 'register'} onClick={() => setActiveTab('register')}>Register</TabButton>
      </Tabs>

      {activeTab === 'login' ? (
        <>
          <Title>Sign in</Title>
          <Sub>If you already have an account, please sign in.</Sub>
          <Input
            placeholder="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => { setLoginEmail(e.target.value); if (loginErr) setLoginErr(""); }}
          />
          <Input
            placeholder="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => { setLoginPassword(e.target.value); if (loginErr) setLoginErr(""); }}
          />
          {loginErr && <ErrorLine>{loginErr}</ErrorLine>}
        </>
      ) : (
        <>
          <Title>Create account</Title>
          <Sub>If you don’t have an account yet, register here.</Sub>
          <Input
            placeholder="Email"
            type="email"
            value={registerEmail}
            onChange={(e) => { setRegisterEmail(e.target.value); if (registerErr) setRegisterErr(""); }}
          />
          <Input
            placeholder="Password"
            type="password"
            value={registerPassword}
            onChange={(e) => { setRegisterPassword(e.target.value); if (registerErr) setRegisterErr(""); }}
          />
          {registerErr && <ErrorLine>{registerErr}</ErrorLine>}
        </>
      )}

      {(() => {
        const label = activeTab === 'login' ? 'Login' : 'Register';
        const onClick = activeTab === 'login' ? doLogin : doRegister;
        const disabled = busy || (activeTab === 'login' ? (!loginEmail || !loginPassword) : (!registerEmail || !registerPassword));
        return (
          <Button onClick={onClick} disabled={disabled}>{label}</Button>
        );
      })()}

      <GlobalSpinner show={busy} text="Authenticating..." />
    </Wrapper>
  );
}


