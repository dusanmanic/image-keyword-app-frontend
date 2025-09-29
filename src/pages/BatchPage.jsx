import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import MetadataEditor from "../components/MetadataEditor.jsx";
import toastBus from "../utils/toastEventBus.js";
import localforage from "localforage";
import piexif from "piexifjs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px;
`;

const Grid = styled.div`
  display: flex;
  gap: 16px;
`;

const Card = styled.div`
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 12px;
`;

const Preview = styled.img`
  height: 120px;
  object-fit: contain;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
`;

const ThumbBox = styled.div`
  height: 120px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  cursor: text;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
`;

const Chip = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  &:hover { background: #bfdbfe; }
`;

const LeftPanel = styled.div`
  width: 500px;
`;

const RightPanel = styled.div`
  width: 850px;
`;

const KeywordCursor = styled.span`
  display: inline-block;
  min-width: 2px;
  border-left: 2px solid #2563eb;
  height: 1em;
  align-self: center;
  margin-left: 2px;
`;

const Placeholder = styled.span`
  color: #9ca3af;
  user-select: none;
`;

const EditableKeywords = styled.span`
  outline: none;
  color: #1e40af;
  caret-color: #1e40af;
`;

const Input = styled.input`
  font-family: 'Nunito Sans';
  width: 450px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin-top: 8px;
  background: #f9fafb;
  color: #1e40af;
  caret-color: #1e40af;
  font-size: 14px;
  &:focus { outline: none; }
`;

const Textarea = styled.textarea`
  font-family: 'Nunito Sans';
  width: 450px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin-top: 8px;
  background: #f9fafb;
  color: #1e40af;
  caret-color: #1e40af;
  font-size: 14px;
  resize: vertical;
  &:focus { outline: none; }
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
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

const Button = styled.button`
  width: 150px;
  background: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; &:hover { background: #2563eb; } }
  &:hover { background: #1d4ed8; }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: transparent;
    outline: none;
  }
`;

const SecondaryButton = styled.button`
  background: white;
  color: #1e40af;
  font-weight: 600;
  padding: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: #eff6ff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export default function BatchPage() {
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkDesc, setBulkDesc] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [copyImages, setCopyImages] = useState(false);
  const { logout, email } = useAuth();
  const navigate = useNavigate();
  const [editorIndex, setEditorIndex] = useState(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDesc, setEditorDesc] = useState("");
  const [editorKeywords, setEditorKeywords] = useState("");
  const [loadTotal, setLoadTotal] = useState(0);
  const [loadDone, setLoadDone] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);
  const [bulkFromClipboardTs, setBulkFromClipboardTs] = useState(0);

  const addFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    // Create placeholders immediately
    const placeholders = list.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name || "image.jpg",
      blob: null,
      url: "",
      title: "",
      description: "",
      keywords: [],
      selected: false,
      loading: true,
    }));
    setItems(prev => [...prev, ...placeholders]);
    setLoadTotal(list.length);
    setLoadDone(0);

    // Fill placeholders with limited concurrency so UI can paint between items
    const yieldToPaint = () => new Promise(res => requestAnimationFrame(() => res()));
    const concurrency = 3;
    let nextIndex = 0;
    const worker = async () => {
      while (true) {
        const idx = nextIndex++;
        if (idx >= list.length) return;
        const file = list[idx];
        const id = placeholders[idx].id;
        try {
          const { blob, url } = await resizeImage(file, 1600, "image/jpeg", 0.85);
          setItems(prev => prev.map(it => it.id === id ? { ...it, blob, url, loading: false } : it));
        } catch (_) {
          setItems(prev => prev.map(it => it.id === id ? { ...it, loading: false } : it));
        }
        setLoadDone(prev => Math.min(prev + 1, list.length));
        await yieldToPaint();
      }
    };
    await Promise.all(new Array(Math.min(concurrency, list.length)).fill(0).map(() => worker()));
  };

  const analyzeOne = async (index) => {
    const item = items[index];
    if (!item) return;
    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("image", item.blob);
      fd.append("maxKeywords", "30");
      const headers = {};
      try { const t = localStorage.getItem("auth_token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      const res = await fetch("/analyze", { method: "POST", headers, body: fd });
      const data = await res.json();
      const kw = Array.isArray(data.keywords) ? data.keywords : String(data.keywords || "").split(",").map(s=>s.trim()).filter(Boolean);
      setItems(prev => prev.map((it, idx) => idx === index ? { ...it, title: data.title || it.title, description: data.description || it.description, keywords: kw.length ? kw : it.keywords } : it));
    } finally {
      setBusy(false);
    }
  };

  const saveOne = async (index) => {
    const item = items[index];
    if (!item) return;
    const newId = Date.now();
    await localforage.setItem(`image_blob_${newId}`, item.blob).catch(()=>{});
    const record = { id: newId, imageUrl: item.url, title: item.title, description: item.description, keywords: item.keywords };
    const stored = (await localforage.getItem("processed_items_v1")) || [];
    const next = Array.isArray(stored) ? [...stored, record] : [record];
    await localforage.setItem("processed_items_v1", next);

    // Also download to default Downloads folder via browser download
    try {
      const base = (item.name || 'image').replace(/\.[^.]+$/, '');
      const meta = {
        title: item.title,
        description: item.description,
        keywords: item.keywords,
        originalName: item.name,
      };
      const metaBlob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
      downloadBlob(metaBlob, `${base}.json`);
      if (copyImages && item.blob) {
        const ext = (item.name && item.name.includes('.')) ? item.name.split('.').pop() : 'jpg';
        downloadBlob(item.blob, `${base}.${ext}`);
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const saveAll = async () => {
    for (let i = 0; i < items.length; i++) {
      await saveOne(i);
    }
  };

  const applyBulkToSelected = () => {
    const kw = bulkKeywords.split(',').map(s=>s.trim()).filter(Boolean);
    setItems(prev => prev.map(it => it.selected ? {
      ...it,
      title: bulkTitle || it.title,
      description: bulkDesc || it.description,
      keywords: kw.length ? kw : it.keywords,
    } : it));
    try {
      toastBus.emit('toast', 'Applied to selected');
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage('Applied to selected');
      toastTimerRef.current = setTimeout(() => setToastMessage(''), 1500);
    } catch {}
  };

  const analyzeSelected = async () => {
    // Placeholder: korisnik ručno unosi meta; ovo ne poziva BE
    alert('Analyze selected je isključen. Unesite title/description/keywords ručno ili koristite Apply to selected.');
  };

  const saveSelectedToFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert('File System Access API nije dostupna u ovom browseru. Probaj Chrome/Edge ili koristi Save All.');
        return;
      }
      const dir = await window.showDirectoryPicker();
      const selectedItems = items.filter(it => it.selected);
      for (const it of selectedItems) {
        const base = (it.name || 'image').replace(/\.[^.]+$/, '');
        const meta = {
          title: it.title,
          description: it.description,
          keywords: it.keywords,
          originalName: it.name,
        };
        const metaFile = await dir.getFileHandle(`${base}.json`, { create: true });
        const metaWritable = await metaFile.createWritable();
        await metaWritable.write(new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' }));
        await metaWritable.close();

        if (copyImages && it.blob) {
          const imgExt = (it.name && it.name.includes('.')) ? it.name.split('.').pop() : 'jpg';
          const imgFile = await dir.getFileHandle(`${base}.${imgExt}`, { create: true });
          const imgWritable = await imgFile.createWritable();
          await imgWritable.write(it.blob);
          await imgWritable.close();
        }
      }
      alert('Saved to selected folder.');
    } catch (e) {
      console.error(e);
      alert('Saving failed.');
    }
  };

  const embedAndSaveSelectedToFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert('File System Access API nije dostupna u ovom browseru. Probaj Chrome/Edge.');
        return;
      }
      const dir = await window.showDirectoryPicker();
      const selectedItems = items.filter(it => it.selected);
      for (const it of selectedItems) {
        // samo JPEG
        const isJpeg = it.blob && (/jpeg|jpg/i).test(it.blob.type || '')
          || (it.name && /\.jpe?g$/i.test(it.name));
        if (!isJpeg) continue;

        // Write EXIF only (more compatible and avoids XMP prepending issues)
        const withExif = await embedExifIntoJpegBlob(it.blob, { title: it.title, description: it.description, keywords: it.keywords });
        const ext = (it.name && it.name.match(/\.jpe?g$/i)) ? it.name.split('.').pop() : 'jpg';
        const base = (it.name || 'image').replace(/\.[^.]+$/, '');
        const outFile = await dir.getFileHandle(`${base}.${ext.toLowerCase()}`, { create: true });
        const writable = await outFile.createWritable();
        await writable.write(withExif);
        await writable.close();
      }
      alert('Embedded metadata saved to folder.');
    } catch (e) {
      console.error(e);
      alert('Embedding failed.');
    }
  };

  const selectAll = () => {
    setItems(prev => prev.map(it => ({ ...it, selected: true })));
  };

  const openEditor = (idx) => {
    const it = items[idx];
    if (!it) return;
    setEditorIndex(idx);
    setEditorTitle(it.title || "");
    setEditorDesc(it.description || "");
    setEditorKeywords((it.keywords || []).join(", "));
  };

  const closeEditor = () => setEditorIndex(null);

  const saveEditor = () => {
    if (editorIndex == null) return;
    const kw = (editorKeywords || "").split(',').map(s=>s.trim()).filter(Boolean);
    setItems(prev => prev.map((p,i)=> i===editorIndex ? { ...p, title: editorTitle, description: editorDesc, keywords: kw } : p));
    setEditorIndex(null);
  };

  const ensurePreviewUrl = (idx) => {
    setItems(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      try {
        if (p?.blob instanceof Blob) {
          const fresh = URL.createObjectURL(p.blob);
          return { ...p, url: fresh };
        }
      } catch {}
      return p;
    }));
  };

  return (
    <Container>
      <Layout>
        <div>
          <div style={{ margin: '12px 0', display: 'flex', gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e)=> addFiles(e.target.files)} style={{ display: 'none' }} />
            <Button onClick={() => fileRef.current && fileRef.current.click()}>Choose files</Button>
            <Button onClick={selectAll} disabled={!items.length || busy}>Select All</Button>
            <Button onClick={applyBulkToSelected} disabled={!items.some(it=>it.selected) || busy}>Apply to selected</Button>
            <Button onClick={embedAndSaveSelectedToFolder} disabled={!items.some(it=>it.selected) || busy}>Embed to folder</Button>
            <Button onClick={async ()=>{
              try {
                const text = await navigator.clipboard.readText();
                const obj = JSON.parse(text);
                setBulkTitle(String(obj.title || ''));
                setBulkDesc(String(obj.description || ''));
                const kws = Array.isArray(obj.keywords) ? obj.keywords.join(', ') : String(obj.keywords || '');
                setBulkKeywords(kws);
                toastBus.emit('toast', 'Metadata pasted');
              } catch (_) { toastBus.emit('toast', 'Paste failed'); }
            }} disabled={busy}>Paste from clipboard</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'start', marginBottom: 12 }}>
            <div style={{ width: '70%' }}>
              <MetadataEditor
                title={bulkTitle}
                description={bulkDesc}
                keywords={bulkKeywords}
                onChange={(next) => {
                  setBulkTitle(next.title || "");
                  setBulkDesc(next.description || "");
                  setBulkKeywords(next.keywords || "");
                }}
                renderTitleHeader={undefined}
              />
            </div>
          </div>
          {loadTotal > 0 && (
            <div style={{ margin: '8px 0', color: '#6b7280', fontWeight: 600 }}>
              Učitano {loadDone} / {loadTotal}
            </div>
          )}
          <Grid>
            {items.map((it, idx) => (
              <Card key={it.id}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" disabled={it.loading} checked={!!it.selected} onChange={(e)=> setItems(prev => prev.map((p,i)=> i===idx? { ...p, selected: e.target.checked }: p))} /> Select
                </label>
                {it.loading ? (
                  <ThumbBox>
                    <Spinner />
                  </ThumbBox>
                ) : (
                  <Preview src={it.url} alt={`Item ${idx+1}`} onClick={() => openEditor(idx)} onError={() => ensurePreviewUrl(idx)} />
                )}
              </Card>
            ))}
          </Grid>
          {editorIndex != null && (
            <ModalOverlay onClick={closeEditor}>
              <ModalContent onClick={(e)=> e.stopPropagation()}>
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
                  <div>
                    <img src={items[editorIndex]?.url} alt="preview" style={{ width: '100%', height: 200, objectFit: 'contain', background: '#f9fafb', borderRadius: 8 }} />
                  </div>
                  <div>
                    <MetadataEditor
                      title={editorTitle}
                      description={editorDesc}
                      keywords={editorKeywords}
                      onChange={(next) => {
                        setEditorTitle(next.title || "");
                        setEditorDesc(next.description || "");
                        setEditorKeywords(next.keywords || "");
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <Button onClick={saveEditor} disabled={busy}>Save</Button>
                      <SecondaryButton onClick={closeEditor}>Close</SecondaryButton>
                    </div>
                  </div>
                </div>
              </ModalContent>
            </ModalOverlay>
          )}
        </div>
      </Layout>
      {toastMessage && <Toast>{toastMessage}</Toast>}
    </Container>
  )
}

// Simple modal for editing one image's metadata
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 720px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

async function resizeImage(fileOrBlob, maxSize, outputType = "image/jpeg", quality = 0.85) {
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
    return { blob: file, url: imgUrl };
  }
  const ratio = width / height;
  if (width > height) { width = maxSize; height = Math.round(maxSize / ratio); }
  else { height = maxSize; width = Math.round(maxSize * ratio); }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
  URL.revokeObjectURL(imgUrl);
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try { document.body.removeChild(a); } catch {}
    URL.revokeObjectURL(url);
  }, 0);
}

// Build minimal XMP packet with dc:title, dc:description, dc:subject (keywords)
function buildXmp({ title = "", description = "", keywords = [] }) {
  const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const titleXml = esc(title);
  const descXml = esc(description);
  const kws = (keywords || []).map(esc);
  return (
`<?xpacket begin='\uFEFF' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/'>
 <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
  <rdf:Description
    xmlns:dc='http://purl.org/dc/elements/1.1/'
    xmlns:xmp='http://ns.adobe.com/xap/1.0/'>
    <dc:title><rdf:Alt><rdf:li xml:lang='x-default'>${titleXml}</rdf:li></rdf:Alt></dc:title>
    <dc:description><rdf:Alt><rdf:li xml:lang='x-default'>${descXml}</rdf:li></rdf:Alt></dc:description>
    <dc:subject><rdf:Bag>${kws.map(k=>`<rdf:li>${k}</rdf:li>`).join('')}</rdf:Bag></dc:subject>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`);
}

// Embed XMP into JPEG APP1 segment (naively replaces/creates XMP packet)
async function embedXmpIntoJpegBlob(inputBlob, xmpString) {
  const arrayBuffer = await inputBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  // JPEG must start with 0xFFD8
  if (!(bytes[0] === 0xFF && bytes[1] === 0xD8)) return inputBlob;

  const xmpHeader = new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\x00");
  const xmpData = new TextEncoder().encode(xmpString);
  const xmpTotalLen = xmpHeader.length + xmpData.length;
  const markerLen = xmpTotalLen + 2; // includes length bytes

  const app1Header = new Uint8Array([0xFF, 0xE1, (markerLen >> 8) & 0xFF, markerLen & 0xFF]);
  const app1Payload = new Uint8Array(xmpTotalLen);
  app1Payload.set(xmpHeader, 0);
  app1Payload.set(xmpData, xmpHeader.length);

  // Build new JPEG: SOI + APP1(XMP) + rest (skipping existing XMP if present is out of scope; we just prepend)
  const out = new Uint8Array(bytes.length + app1Header.length + app1Payload.length);
  let offset = 0;
  // SOI
  out[offset++] = 0xFF; out[offset++] = 0xD8;
  // APP1 XMP
  out.set(app1Header, offset); offset += app1Header.length;
  out.set(app1Payload, offset); offset += app1Payload.length;
  // Rest of original after SOI
  out.set(bytes.subarray(2), offset);
  return new Blob([out], { type: 'image/jpeg' });
}

// Embed basic EXIF tags using piexifjs: XPTitle, XPComment (description), XPKeywords
async function embedExifIntoJpegBlob(inputBlob, { title = "", description = "", keywords = [] }) {
  let arrayBuffer = await inputBlob.arrayBuffer();
  let bytes = new Uint8Array(arrayBuffer);
  let dataUrl = `data:image/jpeg;base64,${uint8ToBase64(bytes)}`;
  let exifObj;
  try {
    exifObj = piexif.load(dataUrl);
  } catch (_) {
    // Fallback: re-encode via canvas to get a clean JPEG, then retry
    const re = await reencodeJpeg(inputBlob, 0.95);
    arrayBuffer = await re.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
    dataUrl = `data:image/jpeg;base64,${uint8ToBase64(bytes)}`;
    exifObj = piexif.load(dataUrl);
  }
  const toUCS2 = (str) => {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i); // 16-bit code unit
      out.push(code & 0xFF, (code >> 8) & 0xFF);
    }
    out.push(0, 0); // terminator
    return out;
  };
  exifObj['0th'] = exifObj['0th'] || {};
  // Map fields for best OS compatibility:
  // - ImageDescription: use Description (most readers show this as caption/description)
  // - XPTitle/XPSubject: Title
  // - XPComment: Description
  // - XPKeywords: semicolon-separated tags
  exifObj['0th'][piexif.ImageIFD.ImageDescription] = description || "";
  if (title) {
    exifObj['0th'][piexif.ImageIFD.XPTitle] = toUCS2(title);
    if (piexif.ImageIFD.XPSubject) {
      exifObj['0th'][piexif.ImageIFD.XPSubject] = toUCS2(title);
    }
  }
  if (description) {
    exifObj['0th'][piexif.ImageIFD.XPComment] = toUCS2(description);
  }
  if (keywords?.length) {
    exifObj['0th'][piexif.ImageIFD.XPKeywords] = toUCS2(keywords.join(';'));
  }
  const exifBytes = piexif.dump(exifObj);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  // Also write XMP so macOS Finder/Preview show Title/Keywords
  const xmpDataUrl = insertXmpIntoJpegDataUrl(newDataUrl, { title, description, keywords });
  const base64 = xmpDataUrl.split(',')[1];
  const outBytes = base64ToUint8(base64);
  return new Blob([outBytes], { type: 'image/jpeg' });
}

function uint8ToBase64(u8) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function reencodeJpeg(blob, quality = 0.95) {
  const imgUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1];
    const outBytes = base64ToUint8(base64);
    return new Blob([outBytes], { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

function insertXmpIntoJpegDataUrl(dataUrl, { title = "", description = "", keywords = [] }) {
  try {
    const b64 = dataUrl.split(',')[1];
    const bytes = base64ToUint8(b64);
    const withXmp = insertXmpIntoJpegBytes(bytes, buildXmpPacket({ title, description, keywords }));
    const outB64 = uint8ToBase64(withXmp);
    return `data:image/jpeg;base64,${outB64}`;
  } catch (_) {
    return dataUrl;
  }
}

function buildXmpPacket({ title = "", description = "", keywords = [] }) {
  const esc = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const kwXml = (keywords || []).map(k => `<rdf:li>${esc(String(k))}</rdf:li>`).join('');
  const xml = `<?xpacket begin=\"\ufeff\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>
<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">
<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:photoshop=\"http://ns.adobe.com/photoshop/1.0/\">
  <rdf:Description>
    <dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">${esc(title)}</rdf:li></rdf:Alt></dc:title>
    <dc:description><rdf:Alt><rdf:li xml:lang=\"x-default\">${esc(description)}</rdf:li></rdf:Alt></dc:description>
    <dc:subject><rdf:Bag>${kwXml}</rdf:Bag></dc:subject>
    <photoshop:Headline>${esc(title)}</photoshop:Headline>
    <photoshop:Keywords><rdf:Bag>${kwXml}</rdf:Bag></photoshop:Keywords>
  </rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end=\"w\"?>`;
  return new TextEncoder().encode(xml);
}

function insertXmpIntoJpegBytes(bytes, xmpUtf8Bytes) {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes; // not JPEG
  const headerStr = "http://ns.adobe.com/xap/1.0/\0";
  const headerBytes = new TextEncoder().encode(headerStr);
  const payloadLen = headerBytes.length + xmpUtf8Bytes.length;
  const app1Len = payloadLen + 2; // includes these two length bytes
  const app1 = new Uint8Array(2 + 2 + payloadLen);
  app1[0] = 0xFF; app1[1] = 0xE1; // APP1 marker
  app1[2] = (app1Len >> 8) & 0xFF; app1[3] = app1Len & 0xFF;
  app1.set(headerBytes, 4);
  app1.set(xmpUtf8Bytes, 4 + headerBytes.length);

  // Find insertion point: after APP0/APP1 segments, before SOS (0xDA)
  let pos = 2;
  while (pos + 4 < bytes.length && bytes[pos] === 0xFF) {
    const marker = bytes[pos + 1];
    if (marker === 0xDA) break; // SOS
    if (marker >= 0xD0 && marker <= 0xD7) { pos += 2; continue; } // RSTn
    if (marker === 0x01 || marker === 0x00) { pos += 2; continue; }
    // Segments with length
    if (marker >= 0xE0 && marker <= 0xEF) {
      const len = (bytes[pos + 2] << 8) | bytes[pos + 3];
      // If this APP1 is XMP, skip it (we'll replace)
      if (marker === 0xE1) {
        const segStart = pos + 4;
        const segEnd = pos + 2 + len;
        const isXmp = matchXmpHeader(bytes, segStart, headerBytes);
        if (isXmp) {
          // remove existing XMP by splicing it out
          const before = bytes.slice(0, pos);
          const after = bytes.slice(segEnd);
          const tmp = new Uint8Array(before.length + after.length);
          tmp.set(before, 0); tmp.set(after, before.length);
          // reset and continue from same pos
          bytes = tmp;
          continue;
        }
      }
      pos += 2 + len;
      continue;
    }
    break;
  }
  const before = bytes.slice(0, pos);
  const after = bytes.slice(pos);
  const out = new Uint8Array(before.length + app1.length + after.length);
  out.set(before, 0);
  out.set(app1, before.length);
  out.set(after, before.length + app1.length);
  return out;
}

function matchXmpHeader(bytes, start, headerBytes) {
  if (start + headerBytes.length > bytes.length) return false;
  for (let i = 0; i < headerBytes.length; i++) {
    if (bytes[start + i] !== headerBytes[i]) return false;
  }
  return true;
}


