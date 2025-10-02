import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import GlobalSpinner from "./GlobalSpinner.jsx";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const Input = styled.input`
  width: 400px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #1e40af;

  &:hover { background: #eff6ff; }
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
  background: #1e40af;
  color: white;
  font-weight: 600;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Line = styled.div`
  font-family: 'Nunito Sans';
  font-size: 12px;
  color: #1e40af;
  margin-top: 6px;
`;

export default function AuthPanel() {
  const { isAuthenticated, email, login, register, logout } = useAuth();
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const doLogin = async () => {
    try {
      setBusy(true); setErr("");
      await login(em, pw);
      setEm(""); setPw("");
      navigate("/", { replace: true });
    } catch(e) { setErr("Login failed"); } finally { setBusy(false); }
  };
  const doRegister = async () => {
    try {
      setBusy(true); setErr("");
      await register(em, pw);
      setEm(""); setPw("");
      navigate("/", { replace: true });
    } catch(e) { setErr("Register failed"); } finally { setBusy(false); }
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
      <Input placeholder="Email" type="email" value={em} onChange={(e)=>setEm(e.target.value)} />
      <Input placeholder="Password" type="password" value={pw} onChange={(e)=>setPw(e.target.value)} />
      {err && <Line>{err}</Line>}
      <Row>
        <Button onClick={doLogin} disabled={busy || !em || !pw}>Login</Button>
        <Button onClick={doRegister} disabled={busy || !em || !pw}>Register</Button>
      </Row>
      <GlobalSpinner show={busy} text="Authenticating..." />
    </Wrapper>
  );
}


