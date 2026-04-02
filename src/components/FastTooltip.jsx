import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

/** Above page overlays; rendered in document.body so parent overflow cannot clip. */
const TOOLTIP_Z = 100000;
const VIEW_MARGIN = 8;
const GAP = 8;

const Wrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;

  /* Disabled buttons don’t receive pointer events; parent gets hover so the tooltip still opens. */
  button:disabled {
    pointer-events: none;
  }
  &:has(button:disabled) {
    cursor: not-allowed;
  }
`;

const bubbleBaseStyle = {
  position: "fixed",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#f8fafc",
  background: "#0f172a",
  borderRadius: "8px",
  maxWidth: "min(300px, calc(100vw - 16px))",
  whiteSpace: "normal",
  textAlign: "center",
  lineHeight: 1.35,
  zIndex: TOOLTIP_Z,
  pointerEvents: "none",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.25)",
  boxSizing: "border-box",
};

/**
 * Measure bubble size off-screen, then choose top/bottom placement and clamp X into the viewport.
 */
function computeTooltipLayout(wrapEl, tipEl) {
  if (!wrapEl || !tipEl) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const anchor = wrapEl.getBoundingClientRect();

  const prevVisibility = tipEl.style.visibility;
  const prevLeft = tipEl.style.left;
  const prevTop = tipEl.style.top;
  const prevTransform = tipEl.style.transform;

  tipEl.style.visibility = "hidden";
  tipEl.style.left = "-9999px";
  tipEl.style.top = "0";
  tipEl.style.transform = "none";
  tipEl.style.maxWidth = bubbleBaseStyle.maxWidth;

  const { width: tipW, height: tipH } = tipEl.getBoundingClientRect();

  tipEl.style.visibility = prevVisibility;
  tipEl.style.left = prevLeft;
  tipEl.style.top = prevTop;
  tipEl.style.transform = prevTransform;

  const spaceAbove = anchor.top - VIEW_MARGIN;
  const spaceBelow = vh - anchor.bottom - VIEW_MARGIN;
  const needAbove = tipH + GAP;
  const needBelow = tipH + GAP;

  let placeBelow = false;
  if (spaceAbove >= needAbove && spaceBelow >= needBelow) {
    placeBelow = false;
  } else if (spaceAbove < needAbove && spaceBelow >= needBelow) {
    placeBelow = true;
  } else if (spaceBelow < needBelow && spaceAbove >= needAbove) {
    placeBelow = false;
  } else {
    placeBelow = spaceBelow > spaceAbove;
  }

  const top = placeBelow ? anchor.bottom : anchor.top;
  const transform = placeBelow
    ? `translate(-50%, ${GAP}px)`
    : `translate(-50%, calc(-100% - ${GAP}px))`;

  let left = anchor.left + anchor.width / 2;
  const half = tipW / 2;
  const minCenterX = VIEW_MARGIN + half;
  const maxCenterX = vw - VIEW_MARGIN - half;
  if (minCenterX <= maxCenterX) {
    left = Math.min(maxCenterX, Math.max(minCenterX, left));
  } else {
    left = vw / 2;
  }

  return { left, top, transform, visibility: "visible" };
}

/**
 * Hover hint anchored to the trigger (not the cursor). Portal + viewport-aware flip/clamp.
 */
export default function FastTooltip({ label, children, delay = 160 }) {
  const [open, setOpen] = useState(false);
  const [toolLayout, setToolLayout] = useState(null);
  const timer = useRef(null);
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const relayout = useCallback(() => {
    const layout = computeTooltipLayout(wrapRef.current, tooltipRef.current);
    if (layout) setToolLayout(layout);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setToolLayout(null);
      return undefined;
    }
    relayout();
    const onScrollOrResize = () => relayout();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, label, relayout]);

  if (!label) return children;

  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  const portal =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <span
        ref={tooltipRef}
        role="tooltip"
        style={{
          ...bubbleBaseStyle,
          ...(toolLayout || {
            left: -9999,
            top: 0,
            transform: "none",
            visibility: "hidden",
          }),
        }}
      >
        {label}
      </span>,
      document.body
    );

  return (
    <Wrap
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {portal}
    </Wrap>
  );
}
