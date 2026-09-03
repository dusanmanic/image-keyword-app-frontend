import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useApi } from '../hooks/useApi.js';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Modal = styled.div`
  max-width: 640px;
  max-height: 85vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
`;

const FullPageLink = styled(Link)`
  display: inline-block;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  font-family: inherit;
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  user-select: none;
`;

const Checkbox = styled.input`
  margin-top: 3px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

const AcceptButton = styled.button`
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #dc2626;
`;

export function TosModal({ tosContent, onAccept, isLoading, error }) {
  const { getPublicTos } = useApi();
  const [checked, setChecked] = useState(false);
  const [bodyText, setBodyText] = useState(() => (tosContent && tosContent.trim() ? tosContent : ''));
  const [loadingBody, setLoadingBody] = useState(() => !tosContent?.trim());

  useEffect(() => {
    if (tosContent?.trim()) {
      setBodyText(tosContent);
      setLoadingBody(false);
      return;
    }
    let cancelled = false;
    setLoadingBody(true);
    getPublicTos()
      .then((d) => {
        if (!cancelled) setBodyText(d.content || '');
      })
      .catch(() => {
        if (!cancelled) setBodyText('');
      })
      .finally(() => {
        if (!cancelled) setLoadingBody(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tosContent, getPublicTos]);

  const handleAccept = () => {
    if (!checked || isLoading || !bodyText?.trim()) return;
    onAccept(bodyText);
  };

  const displayText = loadingBody ? 'Loading…' : bodyText || 'Could not load terms. Use “Read on a full page” or try again later.';

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="tos-title">
      <Modal>
        <Header>
          <Title id="tos-title">Terms of Service</Title>
          <Subtitle>
            You must read and accept the Terms of Service to use this application.
          </Subtitle>
          <FullPageLink to="/terms">Read on a full page</FullPageLink>
        </Header>
        <ScrollArea>{displayText}</ScrollArea>
        <Footer>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>I have read and accept the Terms of Service</span>
          </CheckboxLabel>
          {error && <ErrorText>{error}</ErrorText>}
          <AcceptButton
            onClick={handleAccept}
            disabled={!checked || isLoading || !bodyText?.trim()}
            aria-label="Accept Terms of Service"
          >
            {isLoading ? 'Accepting…' : 'Accept'}
          </AcceptButton>
        </Footer>
      </Modal>
    </Overlay>
  );
}
