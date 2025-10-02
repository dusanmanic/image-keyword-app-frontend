import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuthRedux } from "../hooks/useAuthRedux.js";
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

const ErrorLine = styled.div`
  font-family: 'Nunito Sans';
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

export default function AuthPanel() {
  const { isAuthenticated, email, login, register, logout } = useAuthRedux();
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const validateInputs = () => {
    if (!em || !pw) {
      setErr("Please fill in all fields");
      return false;
    }
    if (!em.includes("@")) {
      setErr("Please enter a valid email address");
      return false;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const doLogin = async () => {
    if (!validateInputs()) return;
    
    try {
      setBusy(true); setErr("");
      await login(em, pw);
      setEm(""); setPw("");
      navigate("/", { replace: true });
    } catch(e) { 
      setErr(e.message || "Login failed. Please check your credentials.");
    } finally { 
      setBusy(false); 
    }
  };
  
  const doRegister = async () => {
    if (!validateInputs()) return;
    
    try {
      setBusy(true); setErr("");
      await register(em, pw);
      setEm(""); setPw("");
      navigate("/", { replace: true });
    } catch(e) { 
      setErr(e.message || "Registration failed. Please try again.");
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
      <Input placeholder="Email" type="email" value={em} onChange={(e)=>{setEm(e.target.value); if(err) setErr("");}} />
      <Input placeholder="Password" type="password" value={pw} onChange={(e)=>{setPw(e.target.value); if(err) setErr("");}} />
      {err && <ErrorLine>{err}</ErrorLine>}
      <Row>
        <Button onClick={doLogin} disabled={busy || !em || !pw}>Login</Button>
        <Button onClick={doRegister} disabled={busy || !em || !pw}>Register</Button>
      </Row>
      <GlobalSpinner show={busy} text="Authenticating..." />
    </Wrapper>
  );
}


