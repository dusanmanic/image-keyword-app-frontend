import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthRedux } from '../hooks/useAuthRedux.js';
import { useApi } from '../hooks/useApi.js';

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
  color: var(--accent);
  font-weight: 700;
  font-size: 18px;
  font-family: 'Inter', system-ui, sans-serif;
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
  font-family: 'Inter', system-ui, sans-serif;
  &:hover {
    color: var(--accent);
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
  font-family: 'Inter', system-ui, sans-serif;
`;

const Meta = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 0 0 24px 0;
  font-family: 'Inter', system-ui, sans-serif;
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
  font-family: 'Inter', system-ui, sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', system-ui, sans-serif;
`;

export default function TermsPage() {
  const { isAuthenticated } = useAuthRedux();
  const { getPublicTos, isLoading, error: loadError } = useApi();
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    setTimedOut(false);
    getPublicTos({ signal: controller.signal })
      .then((data) => {
        if (!cancelled) {
          setContent(data.content || '');
          setVersion(data.version || '');
        }
      })
      .catch((e) => {
        if (!cancelled && e?.name === 'AbortError') {
          setTimedOut(true);
        }
      })
      .finally(() => {
        clearTimeout(t);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [getPublicTos]);

  const displayError = timedOut
    ? 'Request timed out. Check that the API is running and try again.'
    : loadError;

  return (
    <Shell>
      <TopBar>
        <Brand to="/">
          <Logo src="/logo-app.svg" alt="" />
          Jaba Keyword
        </Brand>
        <NavLinks>
          <NavLink to="/">Back to home</NavLink>
          <NavLink to="/privacy">Privacy Policy</NavLink>
          {isAuthenticated ? <NavLink to="/folders">App</NavLink> : <NavLink to="/login">Log in</NavLink>}
        </NavLinks>
      </TopBar>
      <Main>
        <PageTitle>Terms of Service</PageTitle>
        {version ? <Meta>Version {version}</Meta> : null}
        {isLoading && <Body>Loading…</Body>}
        {!isLoading && displayError && <ErrorBox>{displayError}</ErrorBox>}
        {!isLoading && !displayError && <Body>{content || 'No content available.'}</Body>}
      </Main>
    </Shell>
  );
}
