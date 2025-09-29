import React from 'react';
import styled, { keyframes } from 'styled-components';

// Toast animations
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div`
  background: ${props => {
    switch(props.type) {
      case 'success':
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'error':
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'info':
        return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      default:
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
  }};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: ${props => {
    switch(props.type) {
      case 'success':
        return '0 4px 12px rgba(16, 185, 129, 0.3)';
      case 'error':
        return '0 4px 12px rgba(239, 68, 68, 0.3)';
      case 'warning':
        return '0 4px 12px rgba(245, 158, 11, 0.3)';
      case 'info':
        return '0 4px 12px rgba(59, 130, 246, 0.3)';
      default:
        return '0 4px 12px rgba(16, 185, 129, 0.3)';
    }
  }};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  animation: ${slideIn} 0.3s ease-out;
  min-width: 200px;
  max-width: 400px;
  
  &.toast-exit {
    animation: ${slideOut} 0.3s ease-in forwards;
  }
`;

const ToastIcon = styled.div`
  font-size: 16px;
  flex-shrink: 0;
`;

const ToastMessage = styled.div`
  flex: 1;
  word-wrap: break-word;
`;

const ToastCloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ToastComponent = ({ toasts, onRemove }) => {
  return (
    <ToastContainer>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          type={toast.type || 'success'}
          className={toast.exiting ? 'toast-exit' : ''}
        >
          <ToastIcon>
            {toast.icon || getDefaultIcon(toast.type)}
          </ToastIcon>
          <ToastMessage>{toast.message}</ToastMessage>
          {toast.closable !== false && (
            <ToastCloseButton onClick={() => onRemove(toast.id)}>
              ×
            </ToastCloseButton>
          )}
        </Toast>
      ))}
    </ToastContainer>
  );
};

const getDefaultIcon = (type) => {
  switch(type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '✅';
  }
};

export default ToastComponent;
