import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { DataGrid } from "react-data-grid";
import 'react-data-grid/lib/styles.css';
// import ToastComponent from "../components/Toast";
// import { useToast } from "../hooks/useToast";
import { useLocation } from "react-router-dom";
import { useEmbedToFolder } from "../components/AppHandlers.jsx";
import { analyzeImage } from "../services/analyzeService.js";
import { useFoldersRedux } from "../hooks/useFoldersRedux.js";
import RadioGroup from '../components/RadioGroup';
import { useApi } from "../hooks/useApi.js";
import GlobalSpinner from "../components/GlobalSpinner.jsx";
import { useStore } from "../store/index.js";
import ImportIntroModal from "../components/ImportIntroModal.jsx";
import KeywordWizardIntroModal from "../components/KeywordWizardIntroModal.jsx";
import IstockGettyExportModal from "../components/IstockGettyExportModal.jsx";
import GettyMappingModal from "../components/GettyMappingModal.jsx";
import FastTooltip from "../components/FastTooltip.jsx";
import piexif from "piexifjs";

// Extract image creation date from EXIF (DateTimeOriginal)
async function extractImageCreatedAt(file) {
  if (!file || !file.type?.startsWith("image/")) return null;
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    if (!dataUrl || typeof dataUrl !== "string") return null;
    const exif = piexif.load(dataUrl);
    const exifIfd = exif?.Exif;
    if (!exifIfd) return null;
    const raw = exifIfd[piexif.ExifIFD.DateTimeOriginal];
    if (!raw || typeof raw !== "string") return null;
    // Format: "2010:10:10 10:10:10" -> ISO
    const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? null : iso;
  } catch {
    return null;
  }
}

// Reusable checkbox pair for paste options
function PasteOption({ label, includeChecked, clearChecked, onChangeInclude, onChangeClear }) {
  return (
    <div style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={includeChecked} onChange={onChangeInclude} style={{ width: 18, height: 18 }} />
        <span style={{ color: '#1e40af', fontSize: 14, fontWeight: 600 }}>{label}</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={clearChecked} onChange={onChangeClear} style={{ width: 18, height: 18 }} />
        <span style={{ color: '#1e40af', fontSize: 14 }}>Clear first</span>
      </label>
    </div>
  );
}

// Reusable paste preview block
function PastePreview({ data }) {
  const title = data?.title || '';
  const description = data?.description || '';
  const keywords = Array.isArray(data?.keywords) ? data.keywords : [];
  const rowStyle = { fontSize: 14, lineHeight: '20px', opacity: 0.95, display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 };
  const labelStyle = { fontWeight: 800 };
  const valueStyle = { wordBreak: 'break-word' };
  return (
    <div style={{ marginTop: 8, color: '#1e40af' }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Paste preview</div>
      <div style={rowStyle}><span style={labelStyle}>Title:</span><span style={valueStyle}>{title || '(empty)'}</span></div>
      <div style={rowStyle}><span style={labelStyle}>Description:</span><span style={valueStyle}>{description || '(empty)'}</span></div>
      <div style={rowStyle}><span style={labelStyle}>Keywords:</span><span style={valueStyle}>{keywords.join(', ') || '(empty)'}</span></div>
    </div>
  );
}

const Container = styled.div`
  height: calc(100vh - 85px);
  background: #f3f4f6;
  padding: 10px 10px 0 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const QueueStatusBar = styled.div`
  margin: 0 0 12px 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(147, 197, 253, 0.8);
  background: linear-gradient(90deg, rgba(30, 64, 175, 0.10), rgba(147, 197, 253, 0.10));
  color: #1e40af;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const QueueSpinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid #93c5fd;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const Header = styled.div`
  margin-bottom: 14px;
`;

/** One row: action buttons · folder meta · keyword count (right). Horizontal scroll when needed. */
const HeaderBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px 12px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 4px 16px rgba(15, 23, 42, 0.06);
  min-width: 0;
  overflow: visible;
`;

/** Horizontal scroll only over the button strip so dropdowns in FolderMeta/Keywords are not clipped. */
const ToolbarScrollRegion = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  padding: 2px 0;

  &::-webkit-scrollbar {
    height: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
`;

const FolderMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  flex: 1 1 140px;
  max-width: min(480px, 45vw);
`;

const ToolbarScroll = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 2px 0;
`;

/** Pins keyword count to the right of the bar (flex row). */
const KeywordsCountAside = styled.div`
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
`;

const ToolbarDivider = styled.span`
  flex: 0 0 auto;
  width: 1px;
  height: 30px;
  background: linear-gradient(180deg, transparent, #e2e8f0 15%, #e2e8f0 85%, transparent);
  opacity: 0.95;
`;

const Button = styled.button`
  height: ${(p) => (p.$toolbar ? "38px" : "44px")};
  min-height: ${(p) => (p.$toolbar ? "38px" : "44px")};
  background: ${props => props.$variant === 'secondary' ? 'white' : '#2563eb'};
  color: ${props => props.$variant === 'secondary' ? '#1e40af' : 'white'};
  font-weight: 600;
  font-size: ${(p) => (p.$toolbar ? "13px" : undefined)};
  letter-spacing: ${(p) => (p.$toolbar ? "-0.01em" : undefined)};
  padding: ${(p) => (p.$toolbar ? "0 14px" : "10px 12px")};
  border: 1px solid transparent;
  border-radius: ${(p) => (p.$toolbar ? "10px" : "8px")};
  cursor: pointer;
  ${(p) =>
    p.$toolbar
      ? `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 0 0 auto;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    &:hover:not(:disabled) {
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
    }
    &:active:not(:disabled) {
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
  `
      : ""}
  &:hover {
    background: ${props => props.$variant === 'secondary' ? 'white' : '#1d4ed8'};
    border-color: ${props => props.$variant === 'secondary' ? '#93c5fd' : 'transparent'};
  }
  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
  &:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }
  &:focus:not(:focus-visible), &:active, &:focus-within {
    border-color: transparent;
    outline: none;
  }
`;

const MagicButton = styled(Button)`
  background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
  border: 1px solid rgba(109, 40, 217, 0.25);
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #9f7aea 0%, #7c3aed 100%);
  }
`;

const EmbedButton = styled(Button)`
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(5, 120, 87, 0.3);
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #059669 0%, #047857 100%);
  }
`;

const ExportButton = styled(Button)`
  background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%);
  border: 1px solid rgba(2, 132, 199, 0.35);
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
  }
`;

const GettyMapButton = styled(Button)`
  background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
  border: 1px solid rgba(180, 83, 9, 0.35);
  color: #fff;
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #f59e0b 0%, #b45309 100%);
  }
`;

/** Primary actions (Upload, Move) — same polish as other toolbar tones */
const ToolbarPrimaryBtn = styled(Button)`
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border: 1px solid rgba(30, 64, 175, 0.28);
  color: #fff;
  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  }
`;

const KeywordsCountContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const KeywordsCountLabel = styled.span`
  font-weight: 500;
  color: #6b7280;
`;

const KeywordsCountSelect = styled.div`
  position: relative;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    border-color: #1e40af;
  }
  
  &:focus {
    outline: none;
  }
`;

const DropdownArrow = styled.div`
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #6b7280;
  transition: transform 0.2s ease;
  
  ${KeywordsCountSelect}:hover & {
    transform: rotate(180deg);
  }
`;

const DropdownOptions = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 20000;
  margin-top: 4px;
  overflow: hidden;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownOption = styled.div`
  padding: 5px 0 0 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &:active {
    background-color: #e5e7eb;
  }
  
  ${props => props.isSelected && `
    background-color: #eff6ff;
    color: #1e40af;
    font-weight: 600;
  `}
`;

const PasteOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalCard = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: ${props => props.$w ? props.$w : '80vw'};
  height: ${props => props.$h ? props.$h : '70vh'};
  max-width: 900px;
  padding: 20px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ModalBody = styled.div`
  ${props => props.$h && `height: ${props.$h};`}
  ${props => props.$position && `position: ${props.$position};`}
  display: flex;
  ${props => props.$direction && `flex-direction: ${props.$direction};`}
  ${props => props.$gap ? `gap: ${props.$gap};` : 'gap: 24px;'}
  overflow: hidden;
`;

// Move modal dropdown styles
const MoveSelect = styled.div`
  position: relative;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s ease;
  min-width: 280px;
  &:hover { border-color: #1e40af; }
  &:focus { outline: none; }
`;

const MoveOptions = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
`;

const MoveSearch = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  outline: none;
  font-size: 14px;
`;

const MoveList = styled.div`
  max-height: 260px;
  overflow: auto;
`;

const MoveOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s ease;
  &:hover { background: #f9fafb; }
`;

const PasteLeft = styled.div`
  width: 60%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
`;

const PasteOptions = styled.div`
  display: grid;
  gap: 14px;
  width: 300px;
  height: 150px;
`;

const ModalActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  position: absolute;
  bottom: 20px;
  right: 20px;
`;

// Bulk overlay styled components
const scanX = keyframes`
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
`;

const BulkOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const BulkCardOutline = styled.div`
  background: linear-gradient(135deg,#0ea5e9 0%, #1e40af 100%);
  padding: 2px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
`;

const BulkCard = styled.div`
  background: #0b1220;
  border-radius: 14px;
  padding: 16px;
  width: 420px;
  max-width: 90vw;
`;

const BulkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BulkPreviewBox = styled.div`
  position: relative;
  width: 120px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  background: #111827;
  flex: 0 0 auto;
`;

const BulkImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BulkNoPreview = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
`;

const BulkScanBar = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  top: 0;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent);
  filter: blur(2px);
  animation: ${scanX} 1.4s linear infinite;
`;

const BulkDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const BulkTitle = styled.div`
  color: #e5e7eb;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 6px;
`;

const BulkSubtitle = styled.div`
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BulkProgress = styled.div`
  height: 8px;
  border-radius: 999px;
  background: #1f2937;
  overflow: hidden;
`;

const BulkProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  transition: width 300ms ease;
`;

const BulkMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  color: #9ca3af;
  font-size: 12px;
`;

const ModalTextArea = styled.textarea`
  width: 700px;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #111827;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  background: white;
  resize: none;
  &::placeholder { color: #9ca3af; }
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: 1px solid #cbd5e1; outline: none; }
`;

const DropZone = styled.div`
  height: ${props => props.$table ? 'calc(100% - 155px)' : 'calc(70vh - 112px)'};
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #93c5fd;
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  color: #1e40af;
`;

const Toast = styled.div`
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  background: #1e40af;
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  z-index: 50;
`;

const MetaChipsWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const MetaChips = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  padding: 6px 8px;
  padding-right: 36px;
  border-radius: 8px;
  cursor: text;
  max-height: 100%;
  overflow: auto;
`;

const KeywordCountBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #1e40af;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  pointer-events: none;
  z-index: 1;
`;

const MetaChip = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  &:hover { background: #bfdbfe; }
`;

const MetaEditableKeywords = styled.span`
  outline: none;
  color: #1e40af;
  caret-color: #1e40af;
`;

const MetaPlaceholder = styled.span`
  color: #9ca3af;
  user-select: none;
`;

const TitleCellWrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const OverlayPlaceholder = styled.span`
  position: absolute;
  top: 8px;
  left: 12px;
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
`;

const StyledDataGrid = styled(DataGrid)`
  width: 100% !important;
  /* Remove blue focus/selection styles */
  --rdg-selection-color: inherit;
  --rdg-selection-background-color: transparent;
  --rdg-focus-color: transparent;

  .rdg-cell:focus,
  .rdg-cell:focus-within,
  .rdg-cell[aria-selected="true"] {
    outline: none;
    box-shadow: none;
    background: inherit;
  }

  .rdg-cell ::selection {
    background: transparent;
  }
  /* Re-enable visible selection inside inline editors */
  .rdg-cell [contenteditable="true"]::selection {
    background: #cfe3ff;
    color: inherit;
  }
  
  width: 100%;
  border: 2px solid #DAE0E8;
  background-color: transparent;
  border-radius: 12px;

  /* Disabled row styling during analysis */
  .row-disabled {
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(0.2);
  }

  [role='row'] {
    background-color: #FFFFFF !important;
  }

  .rdg-header-row {
    position: sticky;
    top: 0;
    z-index: 3;
  }
  .rdg-header-row .rdg-cell {
    cursor: default;
    pointer-events: none;
    
  }
    
  .hdr {
    font-weight: 600;
    color: #1e40af;
  }

  .flex-start-cell {
    display: flex;
    align-items: start;
  }

  /* Selected row outline without changing backgrounds */
  .rdg-row[aria-selected="true"] .rdg-cell {
    background: #eef6ff;
  }

  /* Busy row cells: block interaction and dim */
  .row-busy { pointer-events: none; opacity: 0.6; }
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  color: #1e40af;
  &:hover { background: #eff6ff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:focus, &:active, &:focus-visible, &:focus-within { outline: none; border-color: transparent; }
`;

const ActionCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const EmbeddedBadge = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: #059669;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  z-index: 10;
`;

const CheckboxWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 6px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  
  &:checked {
    background: #2563eb;
    border-color: #2563eb;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  span {
    color: #1e40af;
    font-size: 14px;
    font-weight: 500;
  }
`;

const WandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 341.956 341.956" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g>
      <g>
        <path fill="#1e40af" d="M10.655,335.932l-3.984-3.984c-8.032-8.032-8.032-21.056,0-29.088L211.286,98.245 c8.032-8.032,21.056-8.032,29.088,0l3.984,3.984c8.032,8.032,8.032,21.056,0,29.088L39.743,335.932 C31.71,343.964,18.687,343.964,10.655,335.932z"/>
        <path fill="#165C6C" d="M151.869,157.662L6.671,302.86c-8.032,8.032-8.032,21.056,0,29.088l3.984,3.984 c8.032,8.032,21.056,8.032,29.088,0l112.126-112.126V157.662z"/>
        <path fill="#32A5B9" d="M209.459,166.215l34.899-34.899c8.032-8.032,8.032-21.056,0-29.088l-3.984-3.984 c-8.032-8.032-21.056-8.032-29.088,0l-34.899,34.899L209.459,166.215z"/>
        <path fill="#F8B242" d="M280.346,76.043c-3.839,0-7.658-1.445-10.587-4.374c-5.858-5.857-5.838-15.336,0.019-21.193 l23.22-23.22c5.857-5.857,15.356-5.857,21.213,0c5.858,5.857,5.858,15.355,0,21.213l-23.22,23.22 C288.063,74.618,284.185,76.043,280.346,76.043z"/>
        <path fill="#F8B242" d="M229.462,69.272c-7.257,0-13.636-5.276-14.799-12.671l-6.176-39.267 C207.2,9.151,212.79,1.473,220.974,0.186c8.183-1.293,15.861,4.303,17.148,12.486l6.176,39.267 c1.287,8.184-4.304,15.861-12.487,17.148C231.022,69.212,230.237,69.272,229.462,69.272z"/>
        <path fill="#F8B242" d="M326.326,133.008c-0.775,0-1.56-0.06-2.35-0.185l-39.266-6.177 c-8.184-1.287-13.774-8.965-12.487-17.148c1.287-8.183,8.961-13.789,17.149-12.486l39.266,6.177 c8.184,1.287,13.774,8.965,12.487,17.148C339.962,127.731,333.582,133.008,326.326,133.008z"/>
        <g>
          <path fill="#F8B242" d="M175.525,89.405c-3.839,0-7.597-1.546-10.525-4.475l-25.467-25.467 c-5.858-5.858-5.858-15.356,0-21.213c5.857-5.857,15.356-5.858,21.213,0l25.467,25.467c5.858,5.858,5.817,15.396-0.041,21.254 C183.244,87.9,179.364,89.405,175.525,89.405z"/>
          <path fill="#D09838" d="M151.869,33.968c-4.393-0.507-8.966,0.913-12.335,4.282c-5.858,5.857-5.858,15.355,0,21.213 l12.335,12.335V33.968z"/>
          <path fill="#F8B242" d="M292.372,206.252c-3.839,0-7.597-1.546-10.525-4.475l-25.467-25.467 c-5.858-5.858-5.858-15.356,0-21.213c5.857-5.857,15.356-5.858,21.213,0l25.467,25.467c5.858,5.858,5.817,15.396-0.041,21.254 C300.09,204.747,296.211,206.252,292.372,206.252z"/>
        </g>
      </g>
    </g>
  </svg>
);

export default function ImportPage() {
  const fileRef = useRef(null);
  const gridRef = useRef(null);
  const controlsRef = useRef(null);
  const pendingPasteRef = useRef(false);
  const uploadBatchSummaryRef = useRef({ total: 0, success: 0, failed: 0 });
  const prevUploadingRef = useRef(false);
  const location = useLocation();

  const folderId = location.pathname.startsWith('/import/') ? location.pathname.split('/import/')[1] : null;

  const [open, setOpen] = useState(false);
  const [showImportIntroModal, setShowImportIntroModal] = useState(false);
  const [showKeywordWizardIntro, setShowKeywordWizardIntro] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [lastCopied, setLastCopied] = useState(null);
  
  // API integration
  const { folders, saveFolder } = useFoldersRedux();
  const { 
    getFolderImages, 
    saveImageMetadata, 
    getFolderStats, 
    moveImages, 
    startAnalyzeBatch, 
    getAnalyzeBatchStatus, 
    getAnalyzeStatusByImageIds, 
    mapGettyBatch,
    saveImageExportLogs
  } = useApi();
  const currentFolder = folders?.find(f => String(f.id) === String(folderId));
  const [folderStats, setFolderStats] = useState(null);
  const [folderStatsLoading, setFolderStatsLoading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkPreview, setBulkPreview] = useState({ url: '', title: '' });
  const [bulkObjectUrl, setBulkObjectUrl] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState('');
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  // Load keywordsCount from localStorage or default to 50
  const [keywordsCount, setKeywordsCount] = useState(() => {
    try {
      const saved = localStorage.getItem('keywordsCount');
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });
  const [isKeywordsDropdownOpen, setIsKeywordsDropdownOpen] = useState(false);
  const [spendingInfo, setSpendingInfo] = useState(null);
  const noAnalysesLeft = spendingInfo && spendingInfo.remaining <= 0;

  // Spending: once on mount + on `refresh-user` (payment, after analysis — no polling)
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE_URL}/api/user/spending-info`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.spending) setSpendingInfo(data.spending);
        }
      } catch (e) {
        console.error('Error loading spending info:', e);
      }
    };
    load();
    window.addEventListener('refresh-user', load);
    return () => window.removeEventListener('refresh-user', load);
  }, []);

  // Fallback state to avoid undefined refs if paste modal JSX is present
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteData, setPasteData] = useState({ title: '', description: '', keywords: [] });
  const [keywordsViewMode, setKeywordsViewMode] = useState('custom'); // 'custom' | 'getty'
  const [pasteOptions, setPasteOptions] = useState({
    title: { include: true, clear: false },
    description: { include: true, clear: false },
    keywords: { include: true, clear: false },
  });

  const getDefaultPasteOptions = useCallback(() => ({
    title: { include: true, clear: false },
    description: { include: true, clear: false },
    keywords: { include: true, clear: false },
  }), []);

  const parseClipboardMetadata = useCallback((txt) => {
    if (!txt) return { title: '', description: '', keywords: [] };
    let nextTitle = '';
    let nextDescription = '';
    let nextKeywords = [];
    let parsedOk = false;
    try {
      const parsed = JSON.parse(txt);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.title === 'string') nextTitle = parsed.title;
        if (typeof parsed.description === 'string') nextDescription = parsed.description;
        if (Array.isArray(parsed.keywords)) nextKeywords = parsed.keywords;
        if (typeof parsed.keywords === 'string') nextKeywords = parsed.keywords.split(',').map(s=>s.trim()).filter(Boolean);
        parsedOk = true;
      }
    } catch {}
    if (!parsedOk) {
      const lines = txt.split(/\r?\n/);
      if (lines.length >= 1) nextTitle = (lines[0] || '').trim();
      if (lines.length >= 2) nextDescription = (lines[1] || '').trim();
      if (lines.length >= 3) nextKeywords = (lines[2] || '').split(',').map(s=>s.trim()).filter(Boolean);
    }
    return { title: nextTitle, description: nextDescription, keywords: nextKeywords };
  }, []);

  const copyTextToClipboard = useCallback(async (text) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    // Fallback (no permissions prompt; still needs user gesture)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch {}
    return false;
  }, []);

  // Unified AI prompt modal state (used for bulk and single analyze)
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptConfirmOpen, setPromptConfirmOpen] = useState(false);
  const [promptTargetRow, setPromptTargetRow] = useState(null); // null => bulk; object => single row
  const [pollingQueueStatus, setPollingQueueStatus] = useState(false); // when all selected in queue, poll status
  /** Pixel height of the grid viewport (from layout); avoids magic innerHeight offsets. */
  const [gridViewportHeight, setGridViewportHeight] = useState(480);
  const [istockExportOpen, setIstockExportOpen] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [csvExportProgress, setCsvExportProgress] = useState({ current: 0, total: 0 });
  const [mappingGettyLoading, setMappingGettyLoading] = useState(false);
  const [gettyMapModalOpen, setGettyMapModalOpen] = useState(false);

  // Samo slike u redu ili u obradi su "busy"; učitane (completed/none/failed) nisu disabled
  const isImageInQueueOrProcessing = (row) => {
    if (!row?.id) return false;
    if (analyzingIds.has(row.id)) return true;
    const status = row.analysis_status ?? row.analysisStatus ?? '';
    return status === 'pending' || status === 'processing';
  };

  const allSelectedInQueueOrProcessing = React.useMemo(() => {
    const sel = selectedRows instanceof Set ? selectedRows : new Set();
    if (sel.size === 0) return false;
    const selectedRowsList = rows.filter(r => sel.has(r.id));
    return selectedRowsList.length > 0 && selectedRowsList.every(isImageInQueueOrProcessing);
  }, [rows, selectedRows, analyzingIds]);

  /** Getty mapping: needs custom keywords on every selection + no row stuck in analysis queue. */
  const gettyMapEligibility = React.useMemo(() => {
    const sel = selectedRows instanceof Set ? selectedRows : new Set();
    if (sel.size === 0) return { ok: false, reason: "Select at least one image." };
    const list = rows.filter((r) => sel.has(r.id));
    for (const r of list) {
      const kw = Array.isArray(r.keywords)
        ? r.keywords
        : String(r.keywords || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      if (kw.length === 0) {
        return {
          ok: false,
          reason: "Run Keyword Wizard first — each selected image needs custom keywords.",
        };
      }
      if (isImageInQueueOrProcessing(r)) {
        return {
          ok: false,
          reason: "Wait until analysis finishes for the selected row(s).",
        };
      }
    }
    return { ok: true, reason: "" };
  }, [rows, selectedRows, analyzingIds]);

  // ID-evi za polling: izabrane u redu ILI bilo koja slika u folderu sa pending/processing (npr. posle refresh-a)
  const idsToPollForStatus = React.useMemo(() => {
    if (allSelectedInQueueOrProcessing) {
      const sel = selectedRows instanceof Set ? selectedRows : new Set();
      return rows.filter(r => sel.has(r.id)).map(r => r.id).filter(Boolean);
    }
    const inQueue = rows.filter(r => {
      const s = r?.analysis_status ?? r?.analysisStatus ?? '';
      return s === 'pending' || s === 'processing';
    }).map(r => r.id).filter(Boolean);
    return inQueue;
  }, [allSelectedInQueueOrProcessing, rows, selectedRows]);

  const HEADER_ROW_HEIGHT = 40;
  const DATA_ROW_HEIGHT = 150;
  const GRID_BOTTOM_GAP_PX = 10;

  useLayoutEffect(() => {
    if (rows.length === 0) return undefined;
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) setGridViewportHeight(Math.max(200, h - GRID_BOTTOM_GAP_PX));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows.length, pollingQueueStatus]);

  const { embedOneToFolder } = useEmbedToFolder();
  const { showToast: showGlobalToast } = useStore();
  
  // (Avoid noisy logs on every rows change)

  // Log upload summary once per batch (like analysis status), not per image
  useEffect(() => {
    try {
      if (prevUploadingRef.current && !uploadingImages) {
        const s = uploadBatchSummaryRef.current || { total: 0, success: 0, failed: 0 };
        if (s.total > 0) {
          console.log(`✅ Upload finished: ${s.success}/${s.total}${s.failed ? ` (failed: ${s.failed})` : ''}`);
        }
        uploadBatchSummaryRef.current = { total: 0, success: 0, failed: 0 };
      }
      prevUploadingRef.current = uploadingImages;
    } catch {}
  }, [uploadingImages]);

  // Save keywordsCount to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('keywordsCount', String(keywordsCount));
    } catch (error) {
      console.error('Failed to save keywordsCount to localStorage:', error);
    }
  }, [keywordsCount]);

  // Check if user should see import intro modal on page load
  useEffect(() => {
    const hideImportIntro = localStorage.getItem('hideImportIntroModal');
    console.log('🖼️ ImportPage loaded - hideImportIntroModal:', hideImportIntro);
    if (!hideImportIntro && rows.length === 0) {
      console.log('🔔 Showing import introduction modal');
      setShowImportIntroModal(true);
    } else if (hideImportIntro) {
      console.log('✅ Import introduction modal hidden (user already saw it)');
    }
  }, []); // Only run on mount

  const handleImportIntroModalProceed = () => {
    setShowImportIntroModal(false);
    // Don't open upload modal - user can use drag & drop or Upload button
  };

  const handleKeywordWizardClick = () => {
    // Directly start analysis with current keywords count
    console.log('🪄 Keyword Wizard clicked - starting analysis directly');
    if (promptTargetRow) {
      analyzeRow(promptTargetRow, "");
    } else {
      analyzeSelected("");
    }
    
    /* 
    // Original modal logic - commented out for future use
    const hideWizardIntro = localStorage.getItem('hideKeywordWizardIntro');
    console.log('🪄 Keyword Wizard clicked - hideKeywordWizardIntro:', hideWizardIntro);
    
    if (!hideWizardIntro) {
      console.log('🔔 Showing Keyword Wizard intro modal');
      setShowKeywordWizardIntro(true);
    } else {
      console.log('✅ Opening Keyword Wizard directly');
      openKeywordWizard();
    }
    */
  };

  const handleKeywordWizardIntroComplete = () => {
    setShowKeywordWizardIntro(false);
    openKeywordWizard();
  };

  const openKeywordWizard = () => {
    setPromptTargetRow(null);
    analyzeSelected("");
  };

  const showToast = (msg, type = 'success') => {
    showGlobalToast({ type, message: msg });
  };

  const analyzeRow = async (row, extraPrompt = "") => {
    if (isImageInQueueOrProcessing(row)) {
      showToast('Image is already being processed or in queue.', 'error');
      return;
    }
    try {
      setAnalyzingIds(prev => { const s = new Set(prev); s.add(row.id); return s; });
      showToast('Analyzing...');
      // Prefer original image for analysis (thumbnail can be too small and harm accuracy)
      let blob = row?.originalBlob;
      if (!(blob instanceof Blob)) blob = row?.fileBlob;
      if (!(blob instanceof Blob)) blob = row?.thumbnailBlob;
      if (!blob && row?.thumbUrl) {
        try { const res = await fetch(row.thumbUrl); blob = await res.blob(); } catch {}
      }
      if (!(blob instanceof Blob)) { showToast('Image unavailable'); return; }
      
      // Resize image to max 1024px for analysis (and to stay under 10MB server limit)
      try {
        const { blob: resizedBlob } = await resizeImage(blob, 1024, "image/jpeg", 0.85);
        blob = resizedBlob;
      } catch (resizeErr) {
        console.error('Failed to resize image:', resizeErr);
        showToast('Failed to process image. Please try a different image.');
        return;
      }

      const folder = folders.find(f => String(f.id) === String(folderId));
      const folderDesc = (folder?.description || '').trim();
      const extra = (extraPrompt || '').trim();
      const parts = [];
      if (folderDesc) parts.push(`User set shooting set description: ${folderDesc}`);
      if (extra) parts.push(`Added extra suggestion: ${extra}`);
      const combinedPrompt = parts.join(' <br/> ');

      const data = await analyzeImage(blob, keywordsCount, combinedPrompt);

      let nextTitle = row.title || '';
      let nextDescription = row.description || '';
      let nextKeywords = Array.isArray(row.keywords)
        ? row.keywords
        : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);

      if (data) {
        try {
          const payload = data.result ? JSON.parse(data.result) : data;
          if (typeof payload.title === 'string') nextTitle = payload.title;
          if (typeof payload.description === 'string') nextDescription = payload.description;
          if (Array.isArray(payload.keywords)) nextKeywords = payload.keywords;
          if (typeof payload.keywords === 'string') nextKeywords = payload.keywords.split(',').map(s=>s.trim()).filter(Boolean);
          
          // Auto-add suggested tags to folder if folder has no tags yet (ignore blank tags)
          const existingFolderTags = Array.isArray(folder?.tags)
            ? folder.tags.map(t => String(t ?? '').trim()).filter(Boolean)
            : [];
          const suggestedFolderTags = Array.isArray(payload?.suggestedTags)
            ? payload.suggestedTags.map(t => String(t ?? '').trim()).filter(Boolean)
            : [];
          if (folder && existingFolderTags.length === 0 && suggestedFolderTags.length > 0) {
            try {
              const updatedFolder = {
                ...folder,
                tags: suggestedFolderTags.slice(0, 2), // Max 2 auto tags
                updatedAt: Date.now()
              };
              await saveFolder(updatedFolder, true);
              showToast(`Auto-tagged folder: ${suggestedFolderTags.slice(0, 2).join(', ')}`);
            } catch (err) {
              console.error('Failed to auto-tag folder:', err);
            }
          }
        } catch {
          if (typeof data.description === 'string') nextDescription = data.description;
        }
      }

      const analyzedAtIso = new Date().toISOString();
      setRows(prev =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                title: nextTitle,
                description: nextDescription,
                keywords: nextKeywords,
                analysis_status: "completed",
                analyzedAt: analyzedAtIso,
              }
            : r
        )
      );

      saveMetadataChanges(row.id, {
        title: nextTitle,
        description: nextDescription,
        keywords: nextKeywords,
        analysis_status: "completed",
        analyzedAt: analyzedAtIso,
      });

      window.dispatchEvent(new CustomEvent('refresh-user'));
      showToast('Metadata updated');
    } catch (e) {
      console.error('Analysis error:', e);
      // Show user-friendly error messages
      let errorMsg = 'Analysis failed. Please try again.';
      if (e?.message?.includes('File too large') || e?.response?.status === 413) {
        errorMsg = 'Image is too large. Please use a smaller image (max 10MB).';
      } else if (e?.message?.includes('limit') || e?.message?.includes('Analysis limit')) {
        errorMsg = 'Analysis limit reached. Go to Buy Credits to get more analyses.';
      } else if (e?.response?.status === 403) {
        errorMsg = e?.response?.data?.message || 'Access denied. Check your account status.';
      } else if (e?.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (e?.message) {
        errorMsg = e.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setAnalyzingIds(prev => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  };

  const analyzeSelected = async (extraPrompt = "") => {
    try {
      setAnalyzeLoading(true);
      const selectedSet = new Set((selectedRows instanceof Set ? [...selectedRows] : selectedRows || []).map(String));
      let ids = [...selectedSet];
      if (!ids.length && lastSelectedIndex !== null && rows[lastSelectedIndex]) {
        ids = [String(rows[lastSelectedIndex].id)];
      }
      if (!ids.length) { showToast('No rows selected'); return; }
      // Use table order (rows); only images with thumbUrl and not already in queue/processing
      const withUrl = rows
        .filter(r => selectedSet.has(String(r.id)) && r.thumbUrl && !isImageInQueueOrProcessing(r))
        .map(r => r.id);
      const inQueueCount = rows.filter(r => selectedSet.has(String(r.id)) && isImageInQueueOrProcessing(r)).length;
      const skipped = ids.length - withUrl.length;
      if (withUrl.length === 0) {
        showToast(inQueueCount > 0 ? 'All selected images are already being processed or in queue.' : 'Selected images must be saved (thumbnail URL). Save folder and try again.', 'error');
        return;
      }
      if (inQueueCount > 0) {
        showToast(`${inQueueCount} images are already being processed, the rest are in queue.`);
      } else if (skipped > 0) {
        showToast(`${skipped} images skipped (no URL). ${withUrl.length} in queue for analysis.`);
      } else {
        showToast('Analysis started in background. You can close the page.');
      }
      setSelectedRows(new Set());
      setLastSelectedIndex(null);
      setAnalyzingIds(prev => { const s = new Set(prev); withUrl.forEach(id => s.add(id)); return s; });
      setBulkRunning(true);
      setBulkTotal(withUrl.length);
      setBulkDone(0);
      const folder = folders?.find(f => String(f.id) === String(folderId));
      const folderDesc = (folder?.description || '').trim();
      const extra = (extraPrompt || '').trim();
      const parts = [];
      if (folderDesc) parts.push(`User set shooting set description: ${folderDesc}`);
      if (extra) parts.push(`Added extra suggestion: ${extra}`);
      const combinedPrompt = parts.join(' <br/> ');
      const { batchId, total } = await startAnalyzeBatch(folderId, withUrl, {
        prompt: combinedPrompt,
        maxKeywords: keywordsCount
      });
      setBulkTotal(total);
      const poll = async () => {
        try {
          const status = await getAnalyzeBatchStatus(batchId);
          setBulkDone(status.done + status.failed);
          const hasCompleted = (status?.results || []).some(r => (r.status || '').toLowerCase() === 'completed');
          if (hasCompleted || (status?.status || '').toLowerCase() === 'completed') {
            const apiImages = await getFolderImages(folderId);
            setRows(prev => {
              const byId = new Map((apiImages || []).map(i => [String(i.id), i]));
              return prev.map(r => {
                const fresh = byId.get(String(r.id));
                if (!fresh) return r;
                return {
                  ...r,
                  title: fresh.title ?? r.title,
                  description: fresh.description ?? r.description,
                  keywords: Array.isArray(fresh.keywords) ? fresh.keywords : (r.keywords || []),
                  gettyKeywords: Array.isArray(fresh.gettyKeywords) ? fresh.gettyKeywords : (r.gettyKeywords || []),
                  analysis_status: fresh.analysis_status ?? fresh.analysisStatus ?? r.analysis_status,
                  analyzedAt: fresh.analyzedAt ?? fresh.analyzedat ?? r.analyzedAt,
                };
              });
            });
            setAnalyzingIds(prev => {
              const next = new Set(prev);
              (status?.results || []).filter(r => (r.status || '').toLowerCase() === 'completed').forEach(r => next.delete(r.id));
              return next;
            });
          }
          if ((status?.status || '').toLowerCase() === 'completed') {
            setAnalyzingIds(prev => { const s = new Set(prev); withUrl.forEach(id => s.delete(id)); return s; });
            setBulkRunning(false);
            setBulkTotal(0);
            setBulkDone(0);
            window.dispatchEvent(new CustomEvent('refresh-user'));
            showToast(`Analysis complete. ${status.done} done, ${status.failed} failed.`);
            return;
          }
          setTimeout(poll, 2500);
        } catch {
          setBulkRunning(false);
          setAnalyzingIds(prev => { const s = new Set(prev); withUrl.forEach(id => s.delete(id)); return s; });
          showToast('Could not fetch batch status.', 'error');
        }
      };
      setTimeout(poll, 2000);
    } catch (e) {
      console.error(e);
      showToast(e?.message || 'Failed to start batch analysis', 'error');
      setAnalyzingIds(prev => {
        const s = new Set(prev);
        for (const id of (selectedRows instanceof Set ? selectedRows.values() : [])) s.delete(id);
        return s;
      });
      setBulkRunning(false);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const embedSelected = async () => {
    try {
      setEmbedLoading(true);
      let ids = Array.from(selectedRows instanceof Set ? selectedRows.values() : []);
      if (!ids.length && lastSelectedIndex !== null && rows[lastSelectedIndex]) {
        ids = [rows[lastSelectedIndex].id];
      }
      if (!ids.length) { showToast('No rows selected'); return; }
      showToast(`Embedding ${ids.length}...`);

      // Load previously embedded names (case-insensitive) to prevent duplicates across runs
      let embeddedNames = [];
      try { embeddedNames = (await localforage.getItem('embedded_names_v1')) || []; } catch {}
      const embeddedNameSet = new Set(Array.isArray(embeddedNames) ? embeddedNames.map(n => String(n).toLowerCase()) : []);
      const seenNames = new Set();
      let embeddedCount = 0;
      let skippedCount = 0;

      for (const id of ids) {
        const r = rows.find(x => String(x.id) === String(id));
        if (!r) { skippedCount++; continue; }
        try {
          // Use blob directly from row
          let blob = r.blob;
          if (!(blob instanceof Blob)) {
            try { const res = await fetch(r.thumbUrl); blob = await res.blob(); } catch {}
          }
          if (!(blob instanceof Blob)) { skippedCount++; continue; }

          const fileName = (r.name || r.originalName || `image_${r.id}.jpg`);
          const key = fileName.toLowerCase();

          await embedOneToFolder({
            blob,
            name: fileName,
            title: r.title || "",
            description: r.description || "",
            keywords: Array.isArray(r.keywords) ? r.keywords : String(r.keywords || '').split(',').map(s=>s.trim()).filter(Boolean),
            overwrite: true,
            folderId,
          });

          seenNames.add(key);
          embeddedNameSet.add(key);
          embeddedCount++;
          setRows(prev => prev.map(x => x.id === r.id ? { ...x, embedded: true } : x));
        } catch (e) {
          if (e && e.message === 'FILE_NOT_IN_FOLDER') {
            showToast(`File "${fileName}" not found in selected folder. Please choose the correct folder.`, 'error');
            // Clear cached directory for this folder to force re-selection
            try {
              const storageKey = folderId ? `last_directory_${folderId}` : 'last_directory_default';
              const timestampKey = folderId ? `last_directory_picked_${folderId}` : 'last_directory_picked_default';
              await localforage.removeItem(storageKey);
              await localforage.removeItem(timestampKey);
            } catch {}
          } else if (e && e.message === 'ORIGINAL_FILE_NOT_FOUND') {
            showToast(`Original file not found: ${fileName}`, 'error');
          }
          skippedCount++;
        }
      }

      try { await localforage.setItem('embedded_names_v1', Array.from(embeddedNameSet)); } catch {}

      showToast(`Embedded: ${embeddedCount}${skippedCount ? `, skipped: ${skippedCount}` : ''}`);
    } catch (e) {
      showToast(e && e.message ? e.message : 'Embedding failed', 'error');
    } finally {
      setEmbedLoading(false);
    }
  };

  // Capture pasted clipboard text (no Clipboard API permissions prompt)
  useEffect(() => {
    const handler = (e) => {
      try {
        // Don't interfere with normal typing/pasting in inputs/contentEditable
        const ae = document.activeElement;
        const isEditable = ae && ((ae.getAttribute && ae.getAttribute('contenteditable') === 'true') || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
        if (isEditable) return;

        const shouldHandle = pasteOpen || pendingPasteRef.current;
        if (!shouldHandle) return;

        const txt = (e.clipboardData && e.clipboardData.getData && (e.clipboardData.getData('text/plain') || e.clipboardData.getData('text'))) || '';
        if (!txt) return;

        e.preventDefault();
        const parsed = parseClipboardMetadata(txt);
        setPasteData(parsed);
        setPasteOptions(getDefaultPasteOptions());
        setPasteOpen(true);
        pendingPasteRef.current = false;
      } catch {}
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [pasteOpen, parseClipboardMetadata, getDefaultPasteOptions]);

/*  
  // Deselect when clicking outside the grid
  useEffect(() => {
    const handleGlobalClick = (e) => {
      try {
        if (open || pasteOpen || promptOpen || promptConfirmOpen || showKeywordWizardIntro) return; // keep selection when modals are open
        const gridEl = gridRef.current;
        const controlsEl = controlsRef.current;
        if (!gridEl) return;
        const clickedInsideGrid = gridEl.contains(e.target);
        const clickedInsideControls = controlsEl ? controlsEl.contains(e.target) : false;
        if (!clickedInsideGrid && !clickedInsideControls) {
          setSelectedRows(new Set());
          setLastSelectedIndex(null);
        }
      } catch {}
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [open, pasteOpen, promptOpen, promptConfirmOpen, showKeywordWizardIntro]);
 */
  const cols = [
    {
      key: "checkbox",
      name: "",
      width: 44,
      frozen: true,
      cellClass: (row) => {
        return `flex-start-cell${isImageInQueueOrProcessing(row) ? ' row-busy' : ''}`;
      },
      renderHeaderCell: () => (
        <div className="hdr" style={{ pointerEvents: 'auto' }}>
          <CheckboxWrap
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <Checkbox
              type="checkbox"
              aria-label="Select all rows"
              checked={(() => {
                const selectable = rows.filter(r => !isImageInQueueOrProcessing(r));
                if (selectable.length === 0) return false;
                const sel = selectedRows instanceof Set ? selectedRows : new Set();
                return selectable.every(r => sel.has(r.id));
              })()}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.checked) {
                  setSelectedRows(new Set(rows.filter(r => !isImageInQueueOrProcessing(r)).map(r => r.id)));
                } else {
                  setSelectedRows(new Set());
                }
                setLastSelectedIndex(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </CheckboxWrap>
        </div>
      ),
      renderCell: ({ row }) => (
        <CheckboxWrap>
          <Checkbox
            style={{ marginTop: 12 }}
            type="checkbox"
            disabled={isImageInQueueOrProcessing(row)}
            checked={selectedRows instanceof Set ? selectedRows.has(row.id) : false}
            onChange={(e) => {
              e.stopPropagation();
              if (isImageInQueueOrProcessing(row)) return;
              setSelectedRows(prev => {
                const next = prev instanceof Set ? new Set(prev) : new Set();
                if (e.target.checked) next.add(row.id); else next.delete(row.id);
                return next;
              });
            }}
            onClick={(e)=> e.stopPropagation()}
            aria-label="Select row"
          />
        </CheckboxWrap>
      )
    },
    {
      key: "image",
      name: "Image",
      frozen: true,
      width: 190,
      renderHeaderCell: () => <div className="hdr">Image</div>,
      cellClass: (row) => isImageInQueueOrProcessing(row) ? 'row-busy' : '',
      renderCell: ({ row }) => {
        const displayName = row.name || row.originalName || '';
        const createdAt = row.imageCreatedAt;
        let dateStr = '';
        if (createdAt) {
          try {
            const d = new Date(createdAt);
            if (!Number.isNaN(d.getTime())) {
              dateStr = d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
            }
          } catch {}
        }
        return (
        <div
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', padding: 4 }}
          onClick={(e) => {
            try {
              const idx = rows.findIndex(r => r.id === row.id);
              if (idx === -1) return;
              const isToggle = e.metaKey || e.ctrlKey;
              const isRange = e.shiftKey && lastSelectedIndex !== null;
              if (isRange) {
                const start = Math.min(lastSelectedIndex, idx);
                const end = Math.max(lastSelectedIndex, idx);
                const idsInRange = rows.slice(start, end + 1).map(r => r.id);
                const next = new Set(selectedRows);
                idsInRange.forEach(id => next.add(id));
                setSelectedRows(next);
              } else if (isToggle) {
                const next = new Set(selectedRows);
                if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
                setSelectedRows(next);
                setLastSelectedIndex(idx);
              } else {
                // Regular click - toggle selection of this image
                const next = new Set(selectedRows);
                if (next.has(row.id)) {
                  next.delete(row.id);
                } else {
                  next.add(row.id);
                }
                setSelectedRows(next);
                setLastSelectedIndex(idx);
            }
          } catch {}
        }}
        >
          {displayName ? (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} title={displayName}>
              {displayName}
            </div>
          ) : null}
          {row.thumbUrl ? (
          <img
            src={row.thumbUrl}
              alt={row.name || 'thumbnail'}
            style={{ flex: 1, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', minHeight: 0 }}
              onError={(e) => { try { e.currentTarget.style.display = 'none'; } catch {} }}
          />
          ) : (
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
              No preview
            </div>
          )}
          {dateStr ? (
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Created {dateStr}</div>
          ) : null}
          {row.embedded && (
            <EmbeddedBadge title="Embedded to folder">✓</EmbeddedBadge>
          )}
        </div>
        );
      }
    },
    {
      key: "title",
      name: "Title",
      frozen: true,
      width: '1fr',
      renderHeaderCell: () => <div className="hdr">Title</div>,
      cellClass: (row) => isImageInQueueOrProcessing(row) ? 'row-busy' : '',
      renderCell: ({ row, onRowChange }) => {
        const ref = React.useRef(null);
        const [draft, setDraft] = useState((row.title ?? ''));
        React.useEffect(() => {
          if (ref.current) {
            ref.current.textContent = row.title || '';
          }
          try { setDraft(row.title || ''); } catch {}
        }, [row.title]);
        return(
          <TitleCellWrap>
            {!draft?.trim() && <OverlayPlaceholder>Title</OverlayPlaceholder>}
          <MetaEditableKeywords
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            style={{ display: 'block', width: '100%', height: '100%', outline: 'none', padding: '10px', whiteSpace: 'break-spaces' }}
            onDoubleClick={() => {
              try {
                if (!ref.current) return;
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(ref.current);
                sel.removeAllRanges();
                sel.addRange(range);
              } catch {}
            }}
            onInput={() => {
              try { setDraft(ref.current?.textContent || ''); } catch {}
            }}
            onKeyDown={(e)=> {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const next = (ref.current?.textContent || '').trim();
                const prev = (row.title || '').trim();
                if (next !== prev) {
                  onRowChange({ ...row, title: next }, true);
                showToast('Title updated');
                }
                try { e.currentTarget.blur(); } catch {}
              }
              if (e.key === 'Escape') { e.preventDefault(); setDraft(row.title || ''); }
            }}
            onBlur={() => {
              const next = (ref.current?.textContent || '').trim();
              const prev = (row.title || '').trim();
              if (next !== prev) {
                onRowChange({ ...row, title: next }, true);
                saveMetadataChanges(row.id, { title: next });
              showToast('Title updated');
              }
            }}
          />
          </TitleCellWrap>
        )}
    },
    {
      key: "description",
      name: "Description",
      width: '2.5fr',
      frozen: true,
      renderHeaderCell: () => <div className="hdr">Description</div>,
      cellClass: (row) => isImageInQueueOrProcessing(row) ? 'row-busy' : '',
      renderCell: ({ row, onRowChange }) => {
        const ref = React.useRef(null);
        const [draft, setDraft] = useState((row.description ?? ''));
        React.useEffect(() => {
          if (ref.current) {
            ref.current.textContent = row.description || '';
          }
          try { setDraft(row.description || ''); } catch {}
        }, [row.description]);
        return(
          <TitleCellWrap>
            {!draft?.trim() && <OverlayPlaceholder>Description</OverlayPlaceholder>}
          <MetaEditableKeywords
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            style={{ display: 'block', width: '100%', height: '100%', outline: 'none', padding: '10px', whiteSpace: 'break-spaces' }}
            onDoubleClick={() => {
              try {
                if (!ref.current) return;
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(ref.current);
                sel.removeAllRanges();
                sel.addRange(range);
              } catch {}
            }}
            onInput={() => {
              try { setDraft(ref.current?.textContent || ''); } catch {}
            }}
            onKeyDown={(e)=> {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const next = (ref.current?.textContent || '').trim();
                const prev = (row.description || '').trim();
                if (next !== prev) {
                  onRowChange({ ...row, description: next }, true);
                showToast('Description updated');
                }
                try { e.currentTarget.blur(); } catch {}
              }
              if (e.key === 'Escape') { e.preventDefault(); setDraft(row.description || ''); }
            }}
            onBlur={() => {
              const next = (ref.current?.textContent || '').trim();
              const prev = (row.description || '').trim();
              if (next !== prev) {
                onRowChange({ ...row, description: next }, true);
                saveMetadataChanges(row.id, { description: next });
              showToast('Description updated');
              }
            }}
          />
          </TitleCellWrap>
        )}
    },
    {
      key: "keywords",
      name: "Keywords",
      frozen: true,
      width: '4.5fr',
      cellClass: (row) => {
        const busy = analyzingIds.has(row.id) ? 'row-busy' : '';
        return `flex-start-cell${busy ? ' ' + busy : ''}`;
      },
      renderHeaderCell: () => {
        const hasAnyGetty = rows.some(r => Array.isArray(r.gettyKeywords) && r.gettyKeywords.length > 0);
        return (
          <div className="hdr" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, pointerEvents: 'auto', width: '100%' }}>
            <span>Keywords</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setKeywordsViewMode('custom'); }}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid #93c5fd',
                  borderRadius: 6,
                  background: keywordsViewMode === 'custom' ? '#1e40af' : '#eff6ff',
                  color: keywordsViewMode === 'custom' ? '#fff' : '#1e40af',
                  cursor: 'pointer',
                }}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (hasAnyGetty) setKeywordsViewMode('getty'); }}
                disabled={!hasAnyGetty}
                title={hasAnyGetty ? 'Getty/iStock mapped keywords (saved on server or from export)' : 'Use “Map to Getty/iStock” on selected rows, or export CSV after mapping'}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid #93c5fd',
                  borderRadius: 6,
                  background: keywordsViewMode === 'getty' ? '#1e40af' : (hasAnyGetty ? '#eff6ff' : '#e5e7eb'),
                  color: keywordsViewMode === 'getty' ? '#fff' : (hasAnyGetty ? '#1e40af' : '#9ca3af'),
                  cursor: hasAnyGetty ? 'pointer' : 'not-allowed',
                }}
              >
                Getty/iStock
              </button>
            </div>
          </div>
        );
      },
      renderCell: ({ row, onRowChange }) => {
        const isGettyMode = keywordsViewMode === 'getty';
        const gettyList = Array.isArray(row.gettyKeywords) ? row.gettyKeywords : [];
        const list = isGettyMode
          ? gettyList
          : (Array.isArray(row.keywords) ? row.keywords : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean));
        const chipsRef = React.useRef(null);
        const [hasDraft, setHasDraft] = useState(false);
        const addKeyword = (val) => {
          if (isGettyMode) return; // read-only in Getty mode
          const t = (val || '').trim();
          if (!t) return;
          const customList = Array.isArray(row.keywords) ? row.keywords : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
          if (customList.includes(t)) return;
          const newKeywords = [...customList, t];
          onRowChange({ ...row, keywords: newKeywords }, true);
          saveMetadataChanges(row.id, { keywords: newKeywords });
          if (chipsRef.current) chipsRef.current.textContent = '';
          setHasDraft(false);
          showToast('Keywords updated');
        };
        const removeAt = (idx) => {
          if (isGettyMode) return;
          const customList = Array.isArray(row.keywords) ? row.keywords : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
          const next = customList.filter((_, i) => i !== idx);
          onRowChange({ ...row, keywords: next }, true);
          saveMetadataChanges(row.id, { keywords: next });
          showToast('Keywords updated');
        };
        const handleKeyDown = (e) => {
          if (isGettyMode) return;
          if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            const sel = window.getSelection();
            const text = sel && sel.anchorNode ? sel.anchorNode.textContent : '';
            addKeyword(text);
          }
          if (e.key === 'Backspace') {
            const content = (chipsRef.current?.textContent || '').trim();
            const customList = Array.isArray(row.keywords) ? row.keywords : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
            if (!content && customList.length) {
              e.preventDefault();
              removeAt(customList.length - 1);
            }
          }
        };
        if (isGettyMode) {
          return (
            <MetaChipsWrapper>
              <MetaChips style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {list.length > 0 ? list.map((kw, idx) => (
                    <MetaChip key={idx} style={{ cursor: 'default' }}>{kw}</MetaChip>
                  )) : (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>Not exported yet</span>
                  )}
                </div>
              </MetaChips>
              <KeywordCountBadge>{list.length}</KeywordCountBadge>
            </MetaChipsWrapper>
          );
        }
        return (
          <MetaChipsWrapper>
            <MetaChips
              onClick={() => chipsRef.current && chipsRef.current.focus()}
              onMouseDown={(e) => { try { e.stopPropagation(); } catch {} }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.map((kw, idx) => (
                  <MetaChip key={idx} title="Click to remove" onClick={() => removeAt(idx)}>{kw}</MetaChip>
                ))}
                <MetaEditableKeywords
                  ref={chipsRef}
                  contentEditable
                  suppressContentEditableWarning
                  style={{ minWidth: 8 }}
                  onMouseDown={(e) => { try { e.stopPropagation(); } catch {} }}
                  onKeyDown={handleKeyDown}
                  onInput={() => {
                    const txt = (chipsRef.current?.textContent || '').trim();
                    setHasDraft(!!txt);
                  }}
                />
              </div>
              {!list.length && !hasDraft && (
                <MetaPlaceholder>Type keyword and press Enter</MetaPlaceholder>
              )}
            </MetaChips>
            <KeywordCountBadge>{list.length}</KeywordCountBadge>
          </MetaChipsWrapper>
        );
      }
    },
/*     
    // trailing SVG action column (visual only for now)
    {
      key: "actions",
      name: "",
      width: 44,
      frozen: true,
      cellClass: (row) => {
        return `flex-start-cell${isImageInQueueOrProcessing(row) ? ' row-busy' : ''}`;
      },
      renderHeaderCell: () => <div className="hdr"></div>,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <ActionButton
            title="Analyze"
            onClick={(e)=> {
              e.stopPropagation();
              analyzeRow(row, "");
            }}
            disabled={isImageInQueueOrProcessing(row)}
          >
            <WandIcon />
          </ActionButton>
        </div>
      )
    }, */
  ];

  // Copy/Paste metadata with Cmd/Ctrl+C / Cmd/Ctrl+V when a single row is selected (copy) or any selection (paste shows modal)
  useEffect(() => {
    const handler = (e) => {
      try {
        // Ignore when typing in an input/contentEditable
        const ae = document.activeElement;
        const isEditable = ae && ((ae.getAttribute && ae.getAttribute('contenteditable') === 'true') || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
        if (isEditable && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
          return;
        }

        // Arrow navigation (single or range select)
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!rows.length) return;
          e.preventDefault();
          const indices = Array.from(selectedRows.values()).map(id => rows.findIndex(r => r.id === id)).filter(i => i >= 0).sort((a,b)=>a-b);
          const hasSelection = indices.length > 0;
          const goingDown = e.key === 'ArrowDown';
          if (!e.shiftKey) {
            let baseIdx = 0;
            if (hasSelection) {
              baseIdx = goingDown ? Math.min(rows.length - 1, indices[indices.length - 1] + 1)
                                  : Math.max(0, indices[0] - 1);
            }
            setSelectedRows(new Set([rows[baseIdx].id]));
          } else {
            // Extend from anchor
            let anchor = null;
            if (lastSelectedIndex !== null) anchor = lastSelectedIndex;
            else if (hasSelection) anchor = indices[0];
            else anchor = 0;
            let edge = hasSelection ? (goingDown ? indices[indices.length - 1] : indices[0]) : anchor;
            let target = goingDown ? Math.min(rows.length - 1, (edge ?? anchor) + 1)
                                   : Math.max(0, (edge ?? anchor) - 1);
            const start = Math.min(anchor, target);
            const end = Math.max(anchor, target);
            const next = new Set();
            for (let i = start; i <= end; i++) next.add(rows[i].id);
            setSelectedRows(next);
          }
          return;
        }

        const isCopy = (e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey);
        const isPaste = (e.key === 'v' || e.key === 'V') && (e.metaKey || e.ctrlKey);
        if (!isCopy && !isPaste) return;

        // Copy: requires a single row
        if (isCopy) {
          if (!(selectedRows instanceof Set) || selectedRows.size !== 1) {
            if (selectedRows instanceof Set && selectedRows.size > 1) {
              e.preventDefault();
              showToast('Copy works only with a single row');
            }
            return;
          }
          const [onlyId] = Array.from(selectedRows.values());
          const row = rows.find(r => r.id === onlyId);
          if (!row) return;
          const title = (row.title || '').trim();
          const description = (row.description || '').trim();
          const keywords = Array.isArray(row.keywords)
            ? row.keywords
            : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
          const text = [title, description, keywords.join(', ')].join('\n');
          e.preventDefault();
          copyTextToClipboard(text)
            .then((ok) => { if (ok) showToast('Copied metadata'); })
            .catch(() => {});
          // Capture last copied info for modal preview
          try {
            setLastCopied({
              id: row.id,
              thumbUrl: row.thumbUrl,
              name: row.name,
              payload: { title, description, keywords }
            });
          } catch {}
          return;
        }

        // Paste: open modal to choose apply strategy; allow pasting to one or many selected rows
        if (isPaste) {
          // Only intercept paste shortcut when we have a target selection
          let ids = Array.from(selectedRows instanceof Set ? selectedRows.values() : []);
          if (!ids.length && lastSelectedIndex !== null && rows[lastSelectedIndex]) {
            ids = [rows[lastSelectedIndex].id];
          }
          if (!ids.length) {
            e.preventDefault();
            showToast('No rows selected');
            return;
          }

          // Arm next paste event to populate modal (no navigator.clipboard.readText())
          pendingPasteRef.current = true;
          setPasteData({ title: '', description: '', keywords: [] });
          setPasteOptions(getDefaultPasteOptions());
          setPasteOpen(true);
          // Do NOT preventDefault: allow the real paste event to fire so we can read e.clipboardData
        }
      } catch {}
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rows, selectedRows, lastSelectedIndex, copyTextToClipboard, getDefaultPasteOptions]);

  // Load images from API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log('Loading images for folder:', folderId);
      try {
        if (folderId) {
          const images = await getFolderImages(folderId);
          if (isMounted) {
            // Process images to use Firebase URLs when available
            const processedImages = images.map(img => ({
              ...img,
              thumbUrl: img.thumbUrl // Use stored thumbUrl (base64 data URL)
            })).sort((a, b) => {
              // Sort by file name (case-insensitive)
              const nameA = (a.name || '').toLowerCase();
              const nameB = (b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });
            setRows(processedImages);
            setPageLoading(false);
          }
        } else {
          if (isMounted) {
            setRows([]);
            setPageLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading images:', error);
        if (isMounted) {
          setRows([]);
          setPageLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [folderId]); // Remove getFolderImages from dependencies

  // Load folder stats
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!folderId) return;
      try {
        setFolderStatsLoading(true);
        const stats = await getFolderStats(folderId);
        if (isMounted) setFolderStats(stats);
      } catch (e) {
        if (isMounted) setFolderStats(null);
      } finally {
        if (isMounted) setFolderStatsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [folderId, getFolderStats]);

  // Poll status every 3 seconds when there are images in queue (all selected in queue OR any in folder pending/processing, after refresh)
  useEffect(() => {
    if (idsToPollForStatus.length === 0 || bulkRunning || !folderId) {
      setPollingQueueStatus(false);
      return;
    }
    const ids = [...idsToPollForStatus];
    setPollingQueueStatus(true);
    const POLL_MS = 3000;
    let cancelled = false;
    const t = setInterval(async () => {
      if (cancelled) return;
      try {
        const status = await getAnalyzeStatusByImageIds(ids);
        if (cancelled) return;
        const hasCompleted = (status?.results || []).some(r => (r.status || '').toLowerCase() === 'completed');
        if (hasCompleted || (status?.status || '').toLowerCase() === 'completed') {
          const apiImages = await getFolderImages(folderId);
          if (cancelled) return;
          setRows(prev => {
            const byId = new Map((apiImages || []).map(i => [String(i.id), i]));
            return prev.map(r => {
              const fresh = byId.get(String(r.id));
              if (!fresh) return r;
              return {
                ...r,
                title: fresh.title ?? r.title,
                description: fresh.description ?? r.description,
                keywords: Array.isArray(fresh.keywords) ? fresh.keywords : (r.keywords || []),
                gettyKeywords: Array.isArray(fresh.gettyKeywords) ? fresh.gettyKeywords : (r.gettyKeywords || []),
                analysis_status: fresh.analysis_status ?? fresh.analysisStatus ?? r.analysis_status,
              };
            });
          });
        }
        if (status?.status === 'completed') {
          setPollingQueueStatus(false);
        }
      } catch (_) {}
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
      setPollingQueueStatus(false);
    };
  }, [idsToPollForStatus, bulkRunning, folderId, getAnalyzeStatusByImageIds, getFolderImages]);

  // Save new images to API in batch (only when new images are added)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (folderId && rows.length > 0) {
          // Only save images that don't have thumbUrl (newly added)
          const unsavedImages = rows.filter(row => !row.thumbUrl && row.thumbnailBlob);
          
          if (unsavedImages.length > 0) {
            // Check storage limit before saving
            try {
              const token = localStorage.getItem('auth_token');
              const API_BASE_URL = import.meta.env.VITE_API_URL || '';
              const storageResponse = await fetch(`${API_BASE_URL}/api/user/storage-info`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (storageResponse.ok) {
                const storageData = await storageResponse.json();
                if (storageData.success && storageData.storage.isOverLimit) {
                  showToast(`Storage limit reached. Cannot save images. Please delete files first.`, 'error');
                  // Remove unsaved images from rows to prevent retry
                  setRows(prev => prev.filter(row => row.thumbUrl || !row.thumbnailBlob));
                  return;
                }
              }
            } catch (error) {
              console.error('Error checking storage limit:', error);
              // Continue anyway if storage check fails
            }
            
            setUploadingImages(true);
            setUploadProgress({ current: 0, total: unsavedImages.length });
            uploadBatchSummaryRef.current = { total: unsavedImages.length, success: 0, failed: 0 };
            
            // Save all images in batch
            const batchSize = 5; // Process 5 images at a time
            let processedCount = 0;
            
            for (let i = 0; i < unsavedImages.length; i += batchSize) {
              const batch = unsavedImages.slice(i, i + batchSize);
              
              await Promise.all(
                batch.map(async (row) => {
                  try {
                    const savedImage = await saveImageMetadata(folderId, row);
                    try { uploadBatchSummaryRef.current.success += 1; } catch {}
                    
                    // Update with stored thumbUrl
                    setRows(prev => prev.map(r => 
                      r.id === row.id ? { 
                        ...r, 
                        thumbUrl: savedImage.thumbUrl
                      } : r
                    ));
                    
                    processedCount++;
                    setUploadProgress({ current: processedCount, total: unsavedImages.length });
                  } catch (error) {
                    console.error('Error saving new image to API:', error);
                    try { uploadBatchSummaryRef.current.failed += 1; } catch {}
                    processedCount++;
                    setUploadProgress({ current: processedCount, total: unsavedImages.length });
                  }
                })
              );
              
              // Small delay between batches
              if (i + batchSize < unsavedImages.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            }
            
            setUploadingImages(false);
          }
        }
      } catch (error) {
        console.error('Error persisting new images:', error);
        setPageLoading(false);
      }
    }, 1000); // Debounce saves by 1 second for batch processing
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [rows, folderId, saveImageMetadata]);

  // Save metadata changes (when title, description, keywords change)
  const saveMetadataChanges = useCallback(async (rowId, updatedData) => {
    try {
      if (folderId && rowId) {
        console.log('Saving metadata changes for:', rowId);
        const updatedRow = rows.find(r => r.id === rowId);
        if (updatedRow) {
          const updatedImage = { ...updatedRow, ...updatedData };
          await saveImageMetadata(folderId, updatedImage);
          console.log('Metadata saved successfully for:', rowId);
          setPageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error saving metadata changes:', error);
      setPageLoading(false);
    }
  }, [folderId, rows, saveImageMetadata]);


  // Image resize function
  const resizeImage = async (fileOrBlob, maxSize, outputType = "image/jpeg", quality = 0.85) => {
    const file = fileOrBlob;
    const imgUrl = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imgUrl;
    });

    let { width, height } = img;
    if (width <= maxSize && height <= maxSize) {
      // no resize needed; still return a new URL so caller can manage lifecycle
      return { blob: file, url: imgUrl };
    }

    const ratio = width / height;
    if (width > height) {
      width = maxSize;
      height = Math.round(maxSize / ratio);
    } else {
      height = maxSize;
      width = Math.round(maxSize * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    URL.revokeObjectURL(imgUrl);
    const url = URL.createObjectURL(blob);
    return { blob, url };
  };

  // Create thumbnail function
  const createThumbnail = async (fileOrBlob, size = 300) => {
    const file = fileOrBlob;
    const imgUrl = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    
    // Draw image centered and cropped to square
    const ratio = img.width / img.height;
    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
    
    if (ratio > 1) {
      // Landscape - crop width
      sourceWidth = img.height;
      sourceX = (img.width - sourceWidth) / 2;
    } else {
      // Portrait - crop height
      sourceHeight = img.width;
      sourceY = (img.height - sourceHeight) / 2;
    }
    
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);
    
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    URL.revokeObjectURL(imgUrl);
    const url = URL.createObjectURL(blob);
    return { blob, url };
  };

  const onFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    
    // Check storage limit before processing
    try {
      const token = localStorage.getItem('auth_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const storageResponse = await fetch(`${API_BASE_URL}/api/user/storage-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (storageResponse.ok) {
        const storageData = await storageResponse.json();
        if (storageData.success && storageData.storage.isOverLimit) {
          showToast(`Storage limit reached (${storageData.storage.total.formatted} / ${storageData.storage.limit.formatted}). Please delete files to continue uploading.`, 'error');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking storage limit:', error);
      // Continue anyway if storage check fails
    }
    
    setProcessingImages(true);
    setProcessingProgress({ current: 0, total: list.length });
    showToast('Processing images...');
    
    // Process all images in parallel with limited concurrency
    const concurrency = 3;
      const added = [];
    
    const processImage = async (f, index) => {
      try {
        const rawId = `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`;
        const newId = rawId.replace(/\s+/g, "_").replace(/[?#%&]/g, "_");

        const imageCreatedAt = await extractImageCreatedAt(f);

        // Resize to 1024px for S3: one image for grid display and AI analysis
        const { blob: imageBlob } = await resizeImage(f, 1024, "image/jpeg", 0.85);

        return {
          id: newId,
          name: f.name,
          size: Math.round(f.size / 1024), // Original file size for reference
          type: f.type,
          thumbUrl: null, // Will be set after S3 upload
          thumbnailBlob: imageBlob, // 1024px blob → uploaded to S3, used for display + AI
          originalBlob: f, // Keep original for analyzeRow (resized before send until we have queue)
          title: "",
          description: "",
          keywords: [],
          color: "",
          ...(imageCreatedAt ? { imageCreatedAt } : {}),
        };
      } catch (error) {
        console.error('Error processing image:', f.name, error);
        // Add fallback if processing fails
        let imageCreatedAt = null;
        try { imageCreatedAt = await extractImageCreatedAt(f); } catch {}
        const rawId = `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`;
        return {
          id: rawId.replace(/\s+/g, "_").replace(/[?#%&]/g, "_"),
          name: f.name,
          size: Math.round(f.size / 1024),
          type: f.type,
          thumbUrl: null,
          title: "",
          description: "",
          keywords: [],
          ...(imageCreatedAt ? { imageCreatedAt } : {}),
        };
      }
    };
    
    // Process images in batches
    for (let i = 0; i < list.length; i += concurrency) {
      const batch = list.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((f, idx) => processImage(f, i + idx)));
      added.push(...batchResults);
      
      // Update UI with processed images, sorted by name
      setRows(prev => {
        const combined = [...prev, ...batchResults];
        return combined.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      });
      
      // Update progress
      setProcessingProgress({ current: Math.min(i + concurrency, list.length), total: list.length });
      
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    showToast(`Processed ${added.length} images`);
    setOpen(false);
    setProcessingImages(false);
  };

  const pickFolder = async () => {
    if (!window.showDirectoryPicker) {
      showToast('FS API unavailable');
      return;
    }
    const dir = await window.showDirectoryPicker();
    
    const entries = [];
    for await (const handle of dir.values()) {
      try {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          entries.push(file);
        }
      } catch {}
    }
    onFiles(entries);
  };

  const mapGettyForSelected = async ({ force = false, scoreThreshold } = {}) => {
    const sel = selectedRows instanceof Set ? selectedRows : new Set();
    const ids = [...sel];
    if (!ids.length) {
      showToast('Select at least one image', 'error');
      return;
    }
    if (!folderId) return;
    setMappingGettyLoading(true);
    try {
      const data = await mapGettyBatch({
        folderId,
        imageIds: ids,
        maxKeywords: keywordsCount,
        force,
        scoreThreshold,
      });
      const results = Array.isArray(data?.results) ? data.results : [];
      const byId = new Map(results.map((r) => [r.imageId, r]));
      setRows((prev) =>
        prev.map((r) => {
          const u = byId.get(r.id);
          if (!u) return r;
          return { ...r, gettyKeywords: Array.isArray(u.gettyKeywords) ? u.gettyKeywords : [] };
        })
      );
      const skipped = results.filter((r) => r.skipped).length;
      const done = results.length - skipped;
      if (skipped && !done) {
        showToast('No custom keywords to map on selected rows.', 'error');
      } else if (skipped) {
        showToast(`Getty mapping saved for ${done} image(s). ${skipped} skipped (no keywords).`);
      } else {
        showToast(`Getty/iStock mapping saved for ${results.length} image(s).`);
      }
    } catch (e) {
      console.error(e);
      showToast(e?.message || 'Getty mapping failed', 'error');
    } finally {
      setMappingGettyLoading(false);
    }
  };

  // Export iStock/Getty CSV template (Excel-friendly): CRLF + UTF-8 (no BOM) + required columns/order
  // Uses Getty keywords saved via "Map to Getty/iStock" (or legacy: last export log).
  const exportWindowsCsv = async (shootDateOverride = '', countryOverride = '') => {
    setExportingCsv(true);
    setCsvExportProgress({ current: 0, total: rows.length });
    try {
      const missingGetty = rows.filter((r) => {
        const custom = Array.isArray(r.keywords)
          ? r.keywords
          : String(r.keywords || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
        const g = Array.isArray(r.gettyKeywords) ? r.gettyKeywords : [];
        return custom.length > 0 && g.length === 0;
      });
      if (missingGetty.length > 0) {
        showToast(
          `${missingGetty.length} image(s) have no Getty mapping — keywords column will be empty for those. Use "Map to Getty/iStock" first.`,
          'warning'
        );
      }

      const headers = [
        'file name',
        'created date',
        'description',
        'country',
        'brief code',
        'title',
        'keywords',
      ];
      const toCsvValue = (v) => {
        const s = (v ?? '').toString();
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      const ensureExt = (fileName) => {
        const base = String(fileName || '').trim();
        if (!base) return '';
        // If it already has an extension, keep it
        if (/\.[a-z0-9]{2,5}$/i.test(base)) return base;
        return `${base}.jpg`;
      };
      const formatDate = (d) => {
        // Required: YYYY-MM-DD (we choose this format consistently)
        const dt = d instanceof Date ? d : (d ? new Date(d) : null);
        if (!dt || Number.isNaN(dt.getTime())) return '';
        const yyyy = String(dt.getFullYear()).padStart(4, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const override = String(shootDateOverride || '').trim();
      const overrideCountry = String(countryOverride || '').trim();
      const lines = [headers.join(',')];
      const exportLogItems = [];
      let processedRows = 0;
      const totalRows = rows.length;
      for (const r of rows) {
        const bumpProgress = () => {
          processedRows += 1;
          setCsvExportProgress({ current: processedRows, total: totalRows });
        };

        const rawName = r.name || r.originalName || '';
        const fileName = ensureExt(rawName);
        if (!fileName) {
          bumpProgress();
          continue; // spec: file name column can't be empty; ignore row
        }

        const title = r.title || '';
        const description = r.description || '';
        const customKeywordsArr = Array.isArray(r.keywords)
          ? r.keywords
          : String(r.keywords || '').split(',').map(s => s.trim()).filter(Boolean);

        const gettyKeywordsArr = Array.isArray(r.gettyKeywords) ? r.gettyKeywords : [];
        const keywordsStr = gettyKeywordsArr.join(', ');

        // Use imageCreatedAt per image (from EXIF) when available; fallback to shoot date override
        const createdDate = formatDate(r.imageCreatedAt) || override || '';
        const country = overrideCountry || r.country || '';
        const briefCode = r.briefCode || r.brief_code || '';

        // Collect export log item (for audit)
        if (r.id) {
          exportLogItems.push({
            imageId: r.id,
            folderId,
            customKeywords: customKeywordsArr,
            gettyKeywords: gettyKeywordsArr
          });
        }

        const rowVals = [fileName, createdDate, description, country, briefCode, title, keywordsStr].map(toCsvValue);
        lines.push(rowVals.join(','));
        bumpProgress();
      }

      // Save export logs (audit) in the background; CSV export should still succeed even if this fails
      if (exportLogItems.length > 0) {
        try {
          await saveImageExportLogs({
            platform: 'istock',
            batchId: null,
            items: exportLogItems
          });
        } catch (logErr) {
          console.error('Failed to save export logs (non-fatal):', logErr);
        }
        // Update rows with gettyKeywords so Getty/iStock button works immediately without refresh
        setRows(prev => prev.map(r => {
          const item = exportLogItems.find(x => x.imageId === r.id);
          if (!item?.gettyKeywords?.length) return r;
          return { ...r, gettyKeywords: item.gettyKeywords };
        }));
      }

      // Windows CSV: CRLF line endings (avoid BOM; some importers treat it as part of "file name" header)
      const csvContent = lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const folderName = (Array.isArray(folders) ? folders.find(f => String(f.id) === String(folderId))?.name : null) || 'export';
      const safeName = String(folderName).replace(/[^\w\-\s]/g, '').trim() || 'export';
      // Note: we can't use "/" in filenames; use underscore instead.
      a.download = `${safeName}_istock_getty.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast('iStock/Getty CSV export failed', 'error');
    } finally {
      setExportingCsv(false);
      setCsvExportProgress({ current: 0, total: 0 });
    }
  };

  // Apply paste modal action
  const applyPaste = async () => {
    try {
      setPasteLoading(true);
      let ids = Array.from(selectedRows instanceof Set ? selectedRows.values() : []);
      if (!ids.length && lastSelectedIndex !== null && rows[lastSelectedIndex]) {
        ids = [rows[lastSelectedIndex].id];
      }
      if (!ids.length) { setPasteOpen(false); showToast('No rows selected'); return; }
      const normalizeKeywords = (v) => Array.isArray(v) ? v : String(v || '').split(',').map(s=>s.trim()).filter(Boolean);
      const opts = pasteOptions;
      const payload = pasteData;
      setRows(prev => prev.map(r => {
        if (!ids.includes(r.id)) return r;
        let nextTitle = r.title || '';
        let nextDescription = r.description || '';
        let nextKeywords = Array.isArray(r.keywords) ? r.keywords : normalizeKeywords(r.keywords);
        if (opts.title.include) {
          nextTitle = opts.title.clear ? (payload.title || '') : [r.title || '', payload.title || ''].filter(Boolean).join(' ').trim();
        }
        if (opts.description.include) {
          nextDescription = opts.description.clear ? (payload.description || '') : [r.description || '', payload.description || ''].filter(Boolean).join(' ').trim();
        }
        if (opts.keywords.include) {
          const pasted = normalizeKeywords(payload.keywords);
          nextKeywords = opts.keywords.clear ? pasted : Array.from(new Set([...(nextKeywords||[]), ...pasted]));
        }
        
        // Save metadata changes to Firebase
        const updatedData = { title: nextTitle, description: nextDescription, keywords: nextKeywords };
        saveMetadataChanges(r.id, updatedData);
        
        return { ...r, ...updatedData };
      }));
      setPasteOpen(false);
      showToast('Metadata pasted');
    } catch { 
      setPasteOpen(false); 
    } finally {
      setPasteLoading(false);
    }
  };
  
  return (
    <Container>
      <Header>
        <HeaderBar ref={controlsRef}>
          <ToolbarScrollRegion>
          <ToolbarScroll>
            <FastTooltip label="Upload images to this folder">
              <ToolbarPrimaryBtn $toolbar onClick={() => setOpen(true)} type="button">
                Upload
              </ToolbarPrimaryBtn>
            </FastTooltip>
            <FastTooltip
              label={
                noAnalysesLeft ? 'No analyses left. Buy more to continue.' :
                bulkRunning ? 'Analysis in progress…' :
                allSelectedInQueueOrProcessing ? 'All selected images are already being processed' :
                'Analyze selected'
              }
            >
              <MagicButton
                $toolbar
                onClick={handleKeywordWizardClick}
                type="button"
                disabled={bulkRunning || allSelectedInQueueOrProcessing || noAnalysesLeft}
              >
                <WandIcon />
                {bulkRunning ? 'Analyzing…' : 'Keyword Wizard'}
              </MagicButton>
            </FastTooltip>
            <FastTooltip label={noAnalysesLeft ? 'No analyses left. Buy more to continue.' : 'Embed to folder'}>
              <EmbedButton
                $toolbar
                onClick={embedSelected}
                type="button"
                disabled={noAnalysesLeft}
              >
                Embed
              </EmbedButton>
            </FastTooltip>
            <FastTooltip label="Move selected to another folder">
              <ToolbarPrimaryBtn
                $toolbar
                onClick={() => {
                  const hasSelection = (selectedRows instanceof Set ? selectedRows.size : 0) > 0;
                  if (!hasSelection) { showToast('No rows selected'); return; }
                  setMoveTargetFolderId('');
                  setMoveOpen(true);
                }}
                type="button"
              >
                Move
              </ToolbarPrimaryBtn>
            </FastTooltip>
            <ToolbarDivider aria-hidden />
            <FastTooltip
              label={
                gettyMapEligibility.ok
                  ? 'Map custom keywords to Getty/iStock (saved to your account)'
                  : gettyMapEligibility.reason
              }
            >
              <GettyMapButton
                $toolbar
                onClick={() => {
                  if (!gettyMapEligibility.ok) {
                    showToast(gettyMapEligibility.reason, "error");
                    return;
                  }
                  setGettyMapModalOpen(true);
                }}
                type="button"
                disabled={
                  mappingGettyLoading ||
                  (selectedRows instanceof Set ? selectedRows.size : 0) === 0 ||
                  !gettyMapEligibility.ok
                }
              >
                {mappingGettyLoading ? 'Mapping…' : 'Getty / iStock'}
              </GettyMapButton>
            </FastTooltip>
            <FastTooltip
              label={
                noAnalysesLeft ? 'No analyses left. Buy more to continue.' :
                exportingCsv ? 'Export in progress...' :
                'Export iStock/Getty CSV'
              }
            >
              <ExportButton
                $toolbar
                onClick={() => {
                  if (exportingCsv) return;
                  if (noAnalysesLeft) { showToast('No analyses left. Buy more to continue.', 'error'); return; }
                  setIstockExportOpen(true);
                }}
                type="button"
                disabled={noAnalysesLeft || exportingCsv}
              >
                {exportingCsv ? 'Exporting…' : 'Export CSV'}
              </ExportButton>
            </FastTooltip>
          </ToolbarScroll>

          <ToolbarDivider aria-hidden />
          </ToolbarScrollRegion>

          <FolderMeta>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, width: '100%', color: '#1e40af', fontWeight: 800, fontSize: 15 }}>
              <span style={{ letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFolder?.name || 'Folder'}</span>
              <span style={{ color: '#cbd5e1', flexShrink: 0 }} aria-hidden>|</span>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                {folderStatsLoading ? 'Loading…' : folderStats ? `${folderStats.imageCount} images · ${folderStats.storage.formatted}` : ''}
              </span>
            </div>
            {currentFolder?.id && (
              <div style={{ fontSize: 11, color: '#64748b', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 500 }}>ID</span>{' '}
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                    textDecoration: 'underline dotted',
                    color: '#475569'
                  }}
                  title="Click to copy folder ID"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(currentFolder.id);
                      } else {
                        const ta = document.createElement('textarea');
                        ta.value = currentFolder.id;
                        ta.style.position = 'fixed';
                        ta.style.left = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                      }
                    } catch (err) {
                      console.error('Failed to copy folder ID:', err);
                    }
                  }}
                >
                  {currentFolder.id}
                </span>
              </div>
            )}
          </FolderMeta>

          <KeywordsCountAside>
            <KeywordsCountContainer>
              <KeywordsCountLabel>Keywords</KeywordsCountLabel>
              <KeywordsCountSelect
                onClick={() => setIsKeywordsDropdownOpen(!isKeywordsDropdownOpen)}
                onBlur={() => setTimeout(() => setIsKeywordsDropdownOpen(false), 150)}
                tabIndex={0}
              >
                <span>{keywordsCount}</span>
                <DropdownArrow />
                <DropdownOptions isOpen={isKeywordsDropdownOpen}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const value = 10 + i * 10;
                    return (
                      <DropdownOption
                        key={value}
                        isSelected={value === keywordsCount}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKeywordsCount(value);
                          setIsKeywordsDropdownOpen(false);
                        }}
                      >
                        {value}
                      </DropdownOption>
                    );
                  })}
                </DropdownOptions>
              </KeywordsCountSelect>
            </KeywordsCountContainer>
          </KeywordsCountAside>
        </HeaderBar>
      </Header>

      {moveOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setMoveOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, minWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Move selected images</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: '#6b7280' }}>Target folder</label>
              <MoveSelect
                tabIndex={0}
                onClick={() => setMoveDropdownOpen(!moveDropdownOpen)}
                title={moveTargetFolderId ? (folders?.find(f=> String(f.id)===String(moveTargetFolderId))?.name || '') : 'Select folder…'}
              >
                <span style={{ color: moveTargetFolderId ? '#111827' : '#9ca3af' }}>
                  {moveTargetFolderId ? (folders?.find(f=> String(f.id)===String(moveTargetFolderId))?.name || '') : 'Select folder…'}
                </span>
                <span style={{ color: '#9ca3af' }}>▾</span>
                {moveDropdownOpen && (
                  <MoveOptions>
                    <MoveList>
                      {(folders || []).filter(f => String(f.id) !== String(folderId)).map(f => (
                        <MoveOption key={f.id} onClick={()=>{ setMoveTargetFolderId(f.id); setMoveDropdownOpen(false); }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#cbd5e1' }} />
                            <span style={{ color: '#111827', fontWeight: 600 }}>{f.name}</span>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>{typeof f.imageCount === 'number' ? `${f.imageCount}` : ''}</span>
                        </MoveOption>
                      ))}
                      {((folders||[]).filter(f => String(f.id) !== String(folderId)).length === 0) && (
                        <div style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>No folders</div>
                      )}
                    </MoveList>
                  </MoveOptions>
                )}
              </MoveSelect>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setMoveOpen(false)} type="button">Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    const ids = Array.from(selectedRows instanceof Set ? selectedRows.values() : []);
                    if (!ids.length) { showToast('No rows selected'); return; }
                    if (!moveTargetFolderId) { showToast('Choose a target folder'); return; }
                    const res = await moveImages(ids, moveTargetFolderId);
                    setRows(prev => prev.filter(r => !ids.includes(r.id)));
                    setSelectedRows(new Set());
                    setMoveOpen(false);
                    showToast(`Moved ${res?.movedCount ?? ids.length} images`);
                  } catch (e) {
                    showToast('Move failed', 'error');
                  }
                }}
                type="button"
              >
                Move
              </Button>
            </div>
          </div>
        </div>
      )}

      {pollingQueueStatus && (
        <QueueStatusBar>
          <QueueSpinner />
          Checking batch status… will refresh when done
        </QueueStatusBar>
      )}

      {rows.length === 0 ? (
            <DropZone
            $table
            onDragOver={(e)=> { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e)=> { e.preventDefault(); e.stopPropagation(); onFiles(e.dataTransfer.files); }}
          >
            Drag & drop images here
          </DropZone>
      ) : (
        <div
          ref={gridRef}
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <StyledDataGrid
            columns={cols}
            rows={rows}
            rowHeight={DATA_ROW_HEIGHT}
            headerRowHeight={HEADER_ROW_HEIGHT}
            onRowsChange={setRows}
            rowKeyGetter={(row) => row.id}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
            className="rdg-light"
            rowClass={(row) => (analyzingIds.has(row.id) ? 'row-disabled' : '')}
            style={{ width: '100%', minWidth: '100%', height: gridViewportHeight }}
          />
        </div>
      )}
{/*       {bulkRunning && (
        <BulkOverlay>
          <BulkCardOutline>
            <BulkCard>
              <BulkRow>
                <BulkPreviewBox>
                  {bulkPreview.url ? (
                    <BulkImg src={bulkPreview.url} alt="Analyzing preview" />
                  ) : (
                    <BulkNoPreview>No preview</BulkNoPreview>
                  )}
                  <BulkScanBar />
                </BulkPreviewBox>
                <BulkDetails>
                  <BulkTitle>Analyzing images…</BulkTitle>
                  <BulkSubtitle title={bulkPreview.title || ''}>{bulkPreview.title || 'Preparing image'}</BulkSubtitle>
                  <BulkProgress>
                    <BulkProgressFill style={{ width: `${Math.max(0, Math.min(100, (bulkDone / Math.max(1, bulkTotal)) * 100))}%` }} />
                  </BulkProgress>
                  <BulkMeta>
                    <span>{bulkDone} / {bulkTotal}</span>
                    <span>Working…</span>
                  </BulkMeta>
                </BulkDetails>
              </BulkRow>
            </BulkCard>
          </BulkCardOutline>
        </BulkOverlay>
      )} */}
  
      {open && (
        <PasteOverlay onClick={() => setOpen(false)}>
          <ModalCard onClick={(e)=> e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e)=> onFiles(e.target.files)} />
              <Button onClick={() => fileRef.current && fileRef.current.click()}>Choose files</Button>
              <Button onClick={pickFolder}>Choose folder</Button>
            </div>
            <DropZone
              $modal
              onDragOver={(e)=> { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e)=> { e.preventDefault(); e.stopPropagation(); onFiles(e.dataTransfer.files); }}
            >
              Drag & drop images here
            </DropZone>
          </ModalCard>
        </PasteOverlay>
      )}

      {pasteOpen && (
        <PasteOverlay onClick={() => setPasteOpen(false)}>
          <ModalCard onClick={(e)=> e.stopPropagation()} $h="auto">
            <ModalHeader><h3 style={{ color: '#1e40af', margin: 0, fontSize: 22 }}>Paste options</h3></ModalHeader>
            <ModalBody>
              <PasteLeft>
                {lastCopied?.thumbUrl ? (
                  <img src={lastCopied.thumbUrl} alt={lastCopied?.name || 'Copied image'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }} />
                ) : (
                  <div style={{ color: '#9ca3af' }}>No copied image available</div>
                )}
              </PasteLeft>
              <PasteOptions>
                <div style={{ marginBottom: 10, fontSize: 12, lineHeight: '16px', color: '#6b7280' }}>
                  <div><strong>Include</strong>: apply the pasted value to the selected image(s).</div>
                  <div><strong>Clear first</strong>: overwrite existing value first.</div>
                  <div style={{ marginTop: 4 }}>Notes: Title/Description will be appended if “Clear first” is off; Keywords will be merged and deduplicated if “Clear first” is off.</div>
                </div>
                <PasteOption
                  label="Title"
                  includeChecked={pasteOptions.title.include}
                  clearChecked={pasteOptions.title.clear}
                  onChangeInclude={(e)=> setPasteOptions(p=>({ ...p, title: { ...p.title, include: e.target.checked } }))}
                  onChangeClear={(e)=> setPasteOptions(p=>({ ...p, title: { ...p.title, clear: e.target.checked } }))}
                />
                <PasteOption
                  label="Description"
                  includeChecked={pasteOptions.description.include}
                  clearChecked={pasteOptions.description.clear}
                  onChangeInclude={(e)=> setPasteOptions(p=>({ ...p, description: { ...p.description, include: e.target.checked } }))}
                  onChangeClear={(e)=> setPasteOptions(p=>({ ...p, description: { ...p.description, clear: e.target.checked } }))}
                />
                <PasteOption
                  label="Keywords"
                  includeChecked={pasteOptions.keywords.include}
                  clearChecked={pasteOptions.keywords.clear}
                  onChangeInclude={(e)=> setPasteOptions(p=>({ ...p, keywords: { ...p.keywords, include: e.target.checked } }))}
                  onChangeClear={(e)=> setPasteOptions(p=>({ ...p, keywords: { ...p.keywords, clear: e.target.checked } }))}
                />
              </PasteOptions>
            </ModalBody>
            <PastePreview data={pasteData} />
            <ModalActions>
              <Button type="button" onClick={applyPaste}>Apply</Button>
              <Button type="button" $variant="secondary" onClick={() => setPasteOpen(false)}>Cancel</Button>
            </ModalActions>
          </ModalCard>
        </PasteOverlay>
      )}

      {promptConfirmOpen && (
        <PasteOverlay onClick={() => setBulkConfirmOpen(false)}>
          <ModalCard onClick={(e)=> e.stopPropagation()} $w="460px" $h="170px">
            <ModalHeader>
              <h3 style={{ color: '#1e40af', margin: 0, fontSize: 22 }}>Add extra suggestion?</h3>
            </ModalHeader>
            <ModalBody>
              <div style={{ color: '#1f2937', fontSize: 15, lineHeight: 1.5 }}>
                You can optionally add a short hint to steer AI results (e.g., mood, focus, terminology).
              </div>
            </ModalBody>
            <ModalActions style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button type="button" $variant="secondary" style={{ background: 'white', color: '#1e40af', border: '1px solid #cbd5e1' }} onClick={() => {
                setPromptConfirmOpen(false);
                if (promptTargetRow) {
                  analyzeRow(promptTargetRow, "");
                } else {
                  analyzeSelected("");
                }
              }}>Skip for now</Button>
              <Button type="button" onClick={() => { setPromptConfirmOpen(false); setPromptText(""); setPromptOpen(true); }}>Add suggestion</Button>
            </ModalActions>
          </ModalCard>
        </PasteOverlay>
      )}

      {promptOpen && (
        <PasteOverlay onClick={() => setPromptOpen(false)}>
          <ModalCard onClick={(e)=> e.stopPropagation()} $w="725px" $h="250px">
            <ModalHeader><h3 style={{ color: '#1e40af', margin: 0, fontSize: 22 }}>Add details for AI suggestion</h3></ModalHeader>
            <ModalBody $position="relative" $direction="column" $gap="5px" $h="200px">
              <ModalTextArea
                value={promptText}
                onChange={(e)=> setPromptText((e.target.value || '').slice(0, 400))}
                placeholder="Extra suggestion for AI (≤ 400 chars), e.g., emphasize professionalism, calm mood, avoid jargon"
                maxLength={400}
              />
              <div style={{ position: 'absolute', bottom: 60, right: 10, color: '#9ca3af', fontSize: 12 }}>
                {400 - (promptText?.length || 0)} left
              </div>
              <div style={{ position: 'absolute', bottom: 0}}>
                <RadioGroup
                  name="kwCount"
                  options={Array.from({ length: 5 }, (_, i) => ({ value: 10 + i * 10, label: 10 + i * 10 }))}
                  value={keywordsCount}
                  onChange={setKeywordsCount}
                  label="Keywords:"
                />
              </div>
            </ModalBody>
            <ModalActions>
              <MagicButton type="button" disabled={noAnalysesLeft} onClick={() => {
                if (noAnalysesLeft) return;
                setPromptOpen(false);
                if (promptTargetRow) {
                  analyzeRow(promptTargetRow, promptText);
                } else {
                  analyzeSelected(promptText);
                }
              }}>
                <WandIcon />
                {bulkRunning ? 'Analyzing…' : 'Keyword Wizard'}
              </MagicButton>
              <Button type="button" $variant="secondary" onClick={() => setPromptOpen(false)}>Cancel</Button>
            </ModalActions>
          </ModalCard>
        </PasteOverlay>
      )}

      <GettyMappingModal
        open={gettyMapModalOpen}
        onClose={() => setGettyMapModalOpen(false)}
        onConfirm={({ force, scoreThreshold }) => {
          setGettyMapModalOpen(false);
          mapGettyForSelected({ force, scoreThreshold });
        }}
        maxKeywords={keywordsCount}
        selectedCount={selectedRows instanceof Set ? selectedRows.size : 0}
        mappingAllowed={gettyMapEligibility.ok}
        disabledHint={gettyMapEligibility.reason}
      />

      <IstockGettyExportModal
        open={istockExportOpen}
        onClose={() => setIstockExportOpen(false)}
        loading={exportingCsv}
        defaultShootDate={
          (() => {
            try {
              const raw = String(currentFolder?.shootingDate || '').trim();
              return raw && /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
            } catch {
              return '';
            }
          })()
        }
        onExport={async ({ shootDate, country }) => {
          setIstockExportOpen(false);
          await exportWindowsCsv(shootDate, country);
        }}
      />

      
      {/* Import Introduction Modal */}
      {showImportIntroModal && (
        <ImportIntroModal 
          onClose={() => setShowImportIntroModal(false)}
          onProceed={handleImportIntroModalProceed}
        />
      )}
      
      {/* Keyword Wizard Introduction Modal */}
      {showKeywordWizardIntro && (
        <KeywordWizardIntroModal 
          onClose={() => setShowKeywordWizardIntro(false)}
          onProceed={handleKeywordWizardIntroComplete}
        />
      )}
      
      {/* Single global spinner with dynamic message */}
      <GlobalSpinner 
        show={ pasteLoading || embedLoading || processingImages || uploadingImages || exportingCsv || mappingGettyLoading} 
        text={
          pasteLoading ? "Applying paste..." :
          embedLoading ? "Embedding metadata..." :
          processingImages ? `Processing images... ${processingProgress.current}/${processingProgress.total}` :
          uploadingImages ? `Saving to database... ${uploadProgress.current}/${uploadProgress.total}` :
          mappingGettyLoading ? "Mapping to Getty/iStock..." :
          exportingCsv ? `Exporting CSV… ${csvExportProgress.current}/${csvExportProgress.total || rows.length}` :
          "Loading..."
        } 
      />

    </Container>
  );
}
