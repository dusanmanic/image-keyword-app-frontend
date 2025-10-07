import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 800;
  backdrop-filter: blur(2px);
`;

const SpinnerContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SpinnerText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
`;

export default function GlobalSpinner({ show, text = 'Loading...' }) {
  if (!show) return null;

  return (
    <Overlay>
      <SpinnerContent>
        <Spinner />
        <SpinnerText>{text}</SpinnerText>
      </SpinnerContent>
    </Overlay>
  );
}
