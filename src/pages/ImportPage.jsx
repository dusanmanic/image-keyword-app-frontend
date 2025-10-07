import React, { useRef, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
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
  height: calc(100vh - 100px);
  background: #f3f4f6;
  padding: 20px 20px 0 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Button = styled.button`
  height: 44px;
  background: ${props => props.$variant === 'secondary' ? 'white' : '#2563eb'};
  color: ${props => props.$variant === 'secondary' ? '#1e40af' : 'white'};
  font-weight: 600;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: ${props => props.$variant === 'secondary' ? 'white' : '#1d4ed8'};
    border-color: ${props => props.$variant === 'secondary' ? '#93c5fd' : 'transparent'};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: transparent; outline: none; }
`;

const MagicButton = styled(Button)`
  background: #8b5cf6;
  &:hover { background: #7c3aed; }
`;

const EmbedButton = styled(Button)`
  background: #059669;
  &:hover { background: #047857; }
`;

const ExportButton = styled(Button)`
  background: #0ea5e9;
  &:hover { background: #0284c7; }
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
  height: ${props => props.$table ? 'calc(100vh - 222px)' : 'calc(70vh - 112px)'};
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

const MetaChips = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: text;
  max-height: 100%;
  overflow: auto;
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
  
  height: 100%;
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

const RowCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
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
  const location = useLocation();

  const folderId = location.pathname.startsWith('/import/') ? location.pathname.split('/import/')[1] : null;

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [lastCopied, setLastCopied] = useState(null);
  
  // API integration
  const { folders } = useFoldersRedux();
  const { getFolderImages, saveImageMetadata } = useApi();
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkDone, setBulkDone] = useState(0);
  const [pasteLoading, setPasteLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [keywordsCount, setKeywordsCount] = useState(30);

  // Fallback state to avoid undefined refs if paste modal JSX is present
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteData, setPasteData] = useState({ title: '', description: '', keywords: [] });
  const [pasteOptions, setPasteOptions] = useState({
    title: { include: true, clear: false },
    description: { include: true, clear: false },
    keywords: { include: true, clear: false },
  });

  // Unified AI prompt modal state (used for bulk and single analyze)
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptConfirmOpen, setPromptConfirmOpen] = useState(false);
  const [promptTargetRow, setPromptTargetRow] = useState(null); // null => bulk; object => single row
  const [keywordsModalOpen, setKeywordsModalOpen] = useState(false);

  const { embedOneToFolder } = useEmbedToFolder();
  const { showToast: showGlobalToast, openAiApiKey } = useStore();
  
  React.useEffect(() => {
    console.log('[ImportPage] rows', rows);
  }, [rows]);

  const showToast = (msg, type = 'success') => {
    showGlobalToast({ type, message: msg });
  };

  const analyzeRow = async (row, extraPrompt = "") => {
    try {
      setAnalyzingIds(prev => { const s = new Set(prev); s.add(row.id); return s; });
      showToast('Analyzing...');
      if (!(openAiApiKey || '').trim()) {
        showToast('OpenAI API key is required', 'error');
        return;
      }
      // Use thumbnailBlob for analysis
      let blob = row?.thumbnailBlob;
      if (!blob && row?.thumbUrl) {
        try { const res = await fetch(row.thumbUrl); blob = await res.blob(); } catch {}
      }
      if (!(blob instanceof Blob)) { showToast('Image unavailable'); return; }

      const folder = folders.find(f => String(f.id) === String(folderId));
      const folderDesc = (folder?.description || '').trim();
      const extra = (extraPrompt || '').trim();
      const parts = [];
      if (folderDesc) parts.push(`User set shooting set description: ${folderDesc}`);
      if (extra) parts.push(`Added extra suggestion: ${extra}`);
      const combinedPrompt = parts.join(' <br/> ');

      const data = await analyzeImage(blob, keywordsCount, combinedPrompt, (openAiApiKey || '').trim());

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
        } catch {
          if (typeof data.description === 'string') nextDescription = data.description;
        }
      }

      setRows(prev => prev.map(r => r.id === row.id ? ({ ...r, title: nextTitle, description: nextDescription, keywords: nextKeywords }) : r));
      
      // Save metadata changes to Firebase
      saveMetadataChanges(row.id, { title: nextTitle, description: nextDescription, keywords: nextKeywords });
      
      showToast('Metadata updated');
    } catch (e) {
      showToast('Analyze failed', 'error');
    } finally {
      setAnalyzingIds(prev => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  };

  const analyzeSelected = async (extraPrompt = "") => {
    try {
      setAnalyzeLoading(true);
      showToast('Bulk analyze start');
      let ids = Array.from(selectedRows instanceof Set ? selectedRows.values() : []);
      if (!ids.length && lastSelectedIndex !== null && rows[lastSelectedIndex]) {
        ids = [rows[lastSelectedIndex].id];
      }
      if (!ids.length) { showToast('No rows selected'); return; }
      // mark all selected as analyzing (disabled)
      setAnalyzingIds(prev => {
        const s = new Set(prev);
        for (const id of ids) s.add(id);
        return s;
      });
      setBulkRunning(true);
      setBulkTotal(ids.length);
      setBulkDone(0);
      showToast(`Analyzing ${ids.length}...`);
      for (const id of ids) {
        const r = rows.find(x => String(x.id) === String(id));
        if (!r) continue;
        try { // eslint-disable-next-line no-await-in-loop
          await analyzeRow(r, extraPrompt);
        } catch {}
        setBulkDone(prev => prev + 1);
      }
      showToast('Bulk analysis done');
    } catch {
      showToast('Bulk analysis failed', 'error');
    } finally {
      setBulkRunning(false);
      setAnalyzeLoading(false);
      // clear analyzing marks for the batch
      setAnalyzingIds(prev => {
        const s = new Set(prev);
        for (const id of (selectedRows instanceof Set ? selectedRows : new Set())) {
          s.delete(id);
        }
        return s;
      });
      setTimeout(() => { setBulkTotal(0); setBulkDone(0); }, 500);
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

  // Ctrl/Cmd+V to open paste modal for selected rows
  useEffect(() => {
    const handler = (e) => {
      try {
        const isPaste = (e.key === 'v' || e.key === 'V') && (e.metaKey || e.ctrlKey);
        if (!isPaste) return;
        // ignore when typing
        const ae = document.activeElement;
        const isEditable = ae && ((ae.getAttribute && ae.getAttribute('contenteditable') === 'true') || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
        if (isEditable) return;
        e.preventDefault();
        (async () => {
          try {
            const txt = await navigator.clipboard.readText();
            if (!txt) return;
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
            setPasteData({ title: nextTitle, description: nextDescription, keywords: nextKeywords });
            setPasteOptions({ title: { include: true, clear: false }, description: { include: true, clear: false }, keywords: { include: true, clear: false } });
            setPasteOpen(true);
          } catch {}
        })();
      } catch {}
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Deselect when clicking outside the grid
  useEffect(() => {
    const handleGlobalClick = (e) => {
      try {
        if (open || pasteOpen || promptOpen || promptConfirmOpen || keywordsModalOpen) return; // keep selection when modals are open
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
  }, [open, pasteOpen, promptOpen, promptConfirmOpen, keywordsModalOpen]);

  const cols = [
    {
      key: "checkbox",
      name: "",
      width: 44,
      frozen: true,
      cellClass: (row) => {
        return `flex-start-cell${analyzingIds.has(row.id) ? ' row-busy' : ''}`;
      },
      renderHeaderCell: () => (
        <div className="hdr" style={{ pointerEvents: 'auto' }}>
          <CheckboxWrap
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <RowCheckbox
              type="checkbox"
              aria-label="Select all rows"
              checked={rows.length > 0 && (selectedRows instanceof Set ? selectedRows.size === rows.length : false)}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.checked) {
                  setSelectedRows(new Set(rows.map(r => r.id)));
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
          <RowCheckbox
            style={{ marginTop: 12 }}
            type="checkbox"
            checked={selectedRows instanceof Set ? selectedRows.has(row.id) : false}
            onChange={(e) => {
              e.stopPropagation();
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
      width: 250,
      renderHeaderCell: () => <div className="hdr">Image</div>,
      cellClass: (row) => analyzingIds.has(row.id) ? 'row-busy' : '',
      renderCell: ({ row }) => (
        <div
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
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
                setSelectedRows(new Set([row.id]));
                setLastSelectedIndex(idx);
              }
            } catch {}
          }}
        >
          {row.thumbUrl ? (
          <img
            src={row.thumbUrl}
              alt={row.name || 'thumbnail'}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => { try { e.currentTarget.style.display = 'none'; } catch {} }}
          />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
              No preview
            </div>
          )}
          {row.embedded && (
            <EmbeddedBadge title="Embedded to folder">✓</EmbeddedBadge>
          )}
        </div>
      )
    },
    {
      key: "title",
      name: "Title",
      frozen: true,
      width: '25%',
      renderHeaderCell: () => <div className="hdr">Title</div>,
      cellClass: (row) => analyzingIds.has(row.id) ? 'row-busy' : '',
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
      width: '25%',
      frozen: true,
      renderHeaderCell: () => <div className="hdr">Description</div>,
      cellClass: (row) => analyzingIds.has(row.id) ? 'row-busy' : '',
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
      cellClass: (row) => {
        const busy = analyzingIds.has(row.id) ? 'row-busy' : '';
        return `flex-start-cell${busy ? ' ' + busy : ''}`;
      },
      renderHeaderCell: () => <div className="hdr">Keywords</div>,
      renderCell: ({ row, onRowChange }) => {
        const list = Array.isArray(row.keywords)
          ? row.keywords
          : String(row.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
        const chipsRef = React.useRef(null);
        const [hasDraft, setHasDraft] = useState(false);
        const addKeyword = (val) => {
          const t = (val || '').trim();
          if (!t) return;
          if (list.includes(t)) return;
          const newKeywords = [...list, t];
          onRowChange({ ...row, keywords: newKeywords }, true);
          saveMetadataChanges(row.id, { keywords: newKeywords });
          if (chipsRef.current) chipsRef.current.textContent = '';
          setHasDraft(false);
          showToast('Keywords updated');
        };
        const removeAt = (idx) => {
          const next = list.filter((_, i) => i !== idx);
          onRowChange({ ...row, keywords: next }, true);
          saveMetadataChanges(row.id, { keywords: next });
          showToast('Keywords updated');
        };
        const handleKeyDown = (e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            const sel = window.getSelection();
            const text = sel && sel.anchorNode ? sel.anchorNode.textContent : '';
            addKeyword(text);
          }
          if (e.key === 'Backspace') {
            const content = (chipsRef.current?.textContent || '').trim();
            if (!content && list.length) {
              e.preventDefault();
              removeAt(list.length - 1);
            }
          }
        };
        return (
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
        );
      }
    },
    // trailing SVG action column (visual only for now)
    {
      key: "actions",
      name: "",
      width: 44,
      frozen: true,
      cellClass: (row) => {
        return `flex-start-cell${analyzingIds.has(row.id) ? ' row-busy' : ''}`;
      },
      renderHeaderCell: () => <div className="hdr"></div>,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <ActionButton
            title="Analyze"
            onClick={(e)=> {
              e.stopPropagation();
              setPromptTargetRow(row);
              setPromptConfirmOpen(true);
            }}
            disabled={analyzingIds.has(row.id)}
          >
            <WandIcon />
          </ActionButton>
        </div>
      )
    },
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
          navigator.clipboard && navigator.clipboard.writeText(text)
            .then(() => { showToast('Copied metadata'); })
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
          e.preventDefault();
          (async () => {
            try {
              const txt = await navigator.clipboard.readText();
              if (!txt) return;
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
                  if (typeof parsed.keywords === 'string') {
                    nextKeywords = parsed.keywords.split(',').map(s=>s.trim()).filter(Boolean);
                  }
                  parsedOk = true;
                }
              } catch {}
              if (!parsedOk) {
                const lines = txt.split(/\r?\n/);
                if (lines.length >= 1) nextTitle = (lines[0] || '').trim();
                if (lines.length >= 2) nextDescription = (lines[1] || '').trim();
                if (lines.length >= 3) nextKeywords = (lines[2] || '').split(',').map(s=>s.trim()).filter(Boolean);
              }

              setPasteData({ title: nextTitle, description: nextDescription, keywords: nextKeywords });
              setPasteOptions({ title: { include: true, clear: false }, description: { include: true, clear: false }, keywords: { include: true, clear: false } });
              setPasteOpen(true);
            } catch {}
          })();
        }
      } catch {}
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rows, selectedRows, lastSelectedIndex]);

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
              thumbUrl: img.thumbUrl // Use Firestore thumbUrl (base64 data URL)
            }));
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

  // Save new images to API in batch (only when new images are added)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (folderId && rows.length > 0) {
          // Only save images that don't have thumbUrl (newly added)
          const unsavedImages = rows.filter(row => !row.thumbUrl && row.thumbnailBlob);
          
          if (unsavedImages.length > 0) {
            console.log('Saving new images to API in batch:', unsavedImages.length, 'images');
            setUploadingImages(true);
            setUploadProgress({ current: 0, total: unsavedImages.length });
            
            // Save all images in batch
            const batchSize = 5; // Process 5 images at a time
            let processedCount = 0;
            
            for (let i = 0; i < unsavedImages.length; i += batchSize) {
              const batch = unsavedImages.slice(i, i + batchSize);
              
              await Promise.all(
                batch.map(async (row) => {
                  try {
                    console.log('Saving new image:', row.name);
                    const savedImage = await saveImageMetadata(folderId, row);
                    console.log('New image saved successfully:', row.name);
                    
                    // Update with Firestore thumbUrl
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
    
    setProcessingImages(true);
    setProcessingProgress({ current: 0, total: list.length });
    showToast('Processing images...');
    
    // Process all images in parallel with limited concurrency
    const concurrency = 3;
      const added = [];
    
    const processImage = async (f, index) => {
      try {
        const newId = `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`;
        
        // Create thumbnail (300x300px) - only thumbnail, no original
        const { blob: thumbnailBlob, url: thumbnailUrl } = await createThumbnail(f, 300);
        
        return {
          id: newId,
          name: f.name,
          size: Math.round(f.size / 1024), // Original file size for reference
          type: f.type,
          thumbUrl: null, // Will be set after Firebase upload
          thumbnailBlob: thumbnailBlob, // Store thumbnail blob for Firebase upload
          title: "",
          description: "",
          keywords: [],
          color: "",
        };
      } catch (error) {
        console.error('Error processing image:', f.name, error);
        // Add fallback if processing fails
        return {
          id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
          name: f.name,
          size: Math.round(f.size / 1024),
          type: f.type,
          thumbUrl: null,
          title: "",
          description: "",
          keywords: [],
        };
      }
    };
    
    // Process images in batches
    for (let i = 0; i < list.length; i += concurrency) {
      const batch = list.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((f, idx) => processImage(f, i + idx)));
      added.push(...batchResults);
      
      // Update UI with processed images
      setRows(prev => [...prev, ...batchResults]);
      
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

  // Export current rows to CSV
  const exportCsv = () => {
    try {
      const headers = [
        'file name',
        'title',
        'description',
        'keywords',
        'created date',
        'country'
      ];
      const toCsvValue = (v) => {
        const s = (v ?? '').toString();
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      const lines = [headers.join(',')];
      for (const r of rows) {
        const fileName = r.name || r.originalName || '';
        const title = r.title || '';
        const description = r.description || '';
        const keywordsArr = Array.isArray(r.keywords) ? r.keywords : String(r.keywords || '').split(',').map(s=>s.trim()).filter(Boolean);
        const keywordsStr = keywordsArr.join(', ');
        const createdDate = '';
        const country = '';
        const rowVals = [fileName, title, description, keywordsStr, createdDate, country].map(toCsvValue);
        lines.push(rowVals.join(','));
      }
      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const folderName = (Array.isArray(folders) ? folders.find(f => String(f.id) === String(folderId))?.name : null) || 'export';
      const safeName = String(folderName).replace(/[^\w\-\s]/g, '').trim() || 'export';
      a.download = `${safeName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast('CSV export failed', 'error');
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
        <div ref={controlsRef} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button onClick={() => setOpen(true)} type="button">Upload</Button>
          <MagicButton onClick={() => { setPromptTargetRow(null); setPromptConfirmOpen(true); }} type="button" disabled={bulkRunning} title="Analyze selected">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <WandIcon />
              {bulkRunning ? 'Analyzing…' : ' Keyword Wizard'}
            </span>
          </MagicButton>
          <EmbedButton onClick={embedSelected} type="button" title="Embed to folder">
            Embed to folder
          </EmbedButton>
          <ExportButton onClick={exportCsv} type="button" title="Export CSV">Export CSV</ExportButton>
        </div>
      </Header>

      {rows.length === 0 ? (
            <DropZone
            $table
            onDragOver={(e)=> { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e)=> { e.preventDefault(); e.stopPropagation(); onFiles(e.dataTransfer.files); }}
          >
            Drag & drop images here
          </DropZone>
      ) : (
        <div ref={gridRef} style={{ overflow: 'auto' }}>
        <StyledDataGrid
          columns={cols}
          rows={rows}
          rowHeight={150}
          headerRowHeight={40}
          onRowsChange={setRows}
          rowKeyGetter={(row) => row.id}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
          className="rdg-light"
          rowClass={(row) => (analyzingIds.has(row.id) ? 'row-disabled' : '')}
        />
        </div>
      )}
      {bulkRunning && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', fontSize: 13 }}>
          Analyzing {bulkDone}/{bulkTotal}
        </div>
      )}
  
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
          <ModalCard onClick={(e)=> e.stopPropagation()}>
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
                setKeywordsModalOpen(true);
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
              <MagicButton type="button" onClick={() => {
                setPromptOpen(false);
                if (promptTargetRow) {
                  analyzeRow(promptTargetRow, promptText);
                } else {
                  analyzeSelected(promptText);
                }
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <WandIcon />
                  {bulkRunning ? 'Analyzing…' : ' Keyword Wizard'}
                </span>
              </MagicButton>
              <Button type="button" $variant="secondary" onClick={() => setPromptOpen(false)}>Cancel</Button>
            </ModalActions>
          </ModalCard>
        </PasteOverlay>
      )}

      {keywordsModalOpen && (
        <PasteOverlay onClick={() => setKeywordsModalOpen(false)}>
          <ModalCard  onClick={(e)=> e.stopPropagation()} $w="460px" $h="170px">
            <ModalHeader>
              <h3 style={{ color: '#1e40af', margin: 0, fontSize: 22 }}>Select keywords count</h3>
            </ModalHeader>
            <ModalBody $direction="column" $gap="10px">
              <div style={{ color: '#1f2937', fontSize: 15, lineHeight: 1.5, marginBottom: 5 }}>
                How many keywords should the AI generate for each image?
              </div>
              <RadioGroup
                name="kwCount"
                options={Array.from({ length: 5 }, (_, i) => ({ value: 10 + i * 10, label: 10 + i * 10 }))}
                value={keywordsCount}
                onChange={setKeywordsCount}
                label={null}
              />
            </ModalBody>
            <ModalActions style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" $variant="secondary" style={{ background: 'white', color: '#1e40af', border: '1px solid #cbd5e1' }} onClick={() => setKeywordsModalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => {
                setKeywordsModalOpen(false);
                if (promptTargetRow) {
                  analyzeRow(promptTargetRow, "");
                } else {
                  analyzeSelected("");
                }
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <WandIcon />
                  {bulkRunning ? 'Analyzing…' : ' Start Analysis'}
                </span>
              </Button>
            </ModalActions>
          </ModalCard>
        </PasteOverlay>
      )}
      
      {/* Single global spinner with dynamic message */}
      <GlobalSpinner 
        show={pageLoading || pasteLoading || analyzeLoading || embedLoading || processingImages || uploadingImages} 
        text={
          pageLoading ? "Loading..." :
          pasteLoading ? "Applying paste..." :
          analyzeLoading ? "Analyzing images..." :
          embedLoading ? "Embedding metadata..." :
          processingImages ? `Processing images... ${processingProgress.current}/${processingProgress.total}` :
          uploadingImages ? `Saving to Firestore... ${uploadProgress.current}/${uploadProgress.total}` :
          "Loading..."
        } 
      />
    </Container>
  );
}
