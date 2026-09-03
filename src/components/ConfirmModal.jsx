import React from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.$zIndex || 60};
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90vw;
  max-width: ${props => props.$maxWidth || "520px"};
  padding: 16px;
`;

const Title = styled.h2`
  color: ${props => props.$danger ? "#b91c1c" : "var(--accent)"};
  font-size: 18px;
  margin: 0 0 12px;
`;

const Body = styled.div`
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  background: ${props => (props.$variant === "danger" ? "#ef4444" : props.$variant === "ghost" ? "white" : "var(--accent)")};
  color: ${props => (props.$variant === "ghost" ? "var(--accent)" : "white")};
  font-weight: 600;
  padding: 10px 12px;
  border: 1px solid ${props => (props.$variant === "ghost" ? "#e5e7eb" : "transparent")};
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: ${props =>
      props.$variant === "danger" ? "#c83e3e" : props.$variant === "ghost" ? "#f9fafb" : "var(--accent-hover)"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

export default function ConfirmModal({
  open,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  busy = false,
  maxWidth,
  zIndex,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const handleCancel = () => {
    if (busy) return;
    try { onCancel?.(); } catch (_) {}
  };

  const handleConfirm = () => {
    if (busy) return;
    try { onConfirm?.(); } catch (_) {}
  };

  return (
    <Overlay $zIndex={zIndex} onClick={handleCancel}>
      <Card $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
        {title ? <Title $danger={danger}>{title}</Title> : null}
        <Body>{children}</Body>
        <Actions>
          <Button $variant="ghost" onClick={handleCancel} disabled={busy}>
            {cancelText}
          </Button>
          <Button $variant={danger ? "danger" : "primary"} onClick={handleConfirm} disabled={busy}>
            {busy ? "Working..." : confirmText}
          </Button>
        </Actions>
      </Card>
    </Overlay>
  );
}

