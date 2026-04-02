import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthRedux } from '../hooks/useAuthRedux.js';
import { PRIVACY_CONTENT, PRIVACY_LAST_UPDATED } from '../config/privacyContent.js';

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #1e40af;
  font-weight: 700;
  font-size: 18px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
`;

const Logo = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 8px;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const NavLink = styled(Link)`
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  &:hover {
    color: #1e40af;
    background: #f3f4f6;
  }
`;

const Main = styled.main`
  flex: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 20px 48px;
  width: 100%;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  color: #0f172a;
  margin: 0 0 8px 0;
  font-weight: 800;
  font-family: 'Nunito Sans', system-ui, sans-serif;
`;

const Meta = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 24px 0;
  font-family: 'Nunito Sans', system-ui, sans-serif;
`;

const Body = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px 20px;
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

export default function PrivacyPage() {
  const { isAuthenticated } = useAuthRedux();

  return (
    <Shell>
      <TopBar>
        <Brand to="/">
          <Logo src="/logo-app.svg" alt="" />
          Jaba Keyword
        </Brand>
        <NavLinks>
          <NavLink to="/">Back to home</NavLink>
          <NavLink to="/terms">Terms of Service</NavLink>
          {isAuthenticated ? <NavLink to="/folders">App</NavLink> : <NavLink to="/login">Log in</NavLink>}
        </NavLinks>
      </TopBar>
      <Main>
        <PageTitle>Privacy Policy</PageTitle>
        <Meta>Last updated: {PRIVACY_LAST_UPDATED}</Meta>
        <Body>{PRIVACY_CONTENT}</Body>
      </Main>
    </Shell>
  );
}
