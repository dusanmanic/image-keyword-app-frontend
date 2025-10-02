import React, { useState, useRef, useEffect } from "react";
import localforage from "localforage";
import toastBus from "../utils/toastEventBus.js";
import styled from "styled-components";
import { useAuthRedux } from "../hooks/useAuthRedux.js";
import { useNavigate, Link } from "react-router-dom";
import { computeBlobSha256Hex } from "../utils/hash.js";
import { analyzeImage } from "../services/analyzeService.js";
import Controls from "../components/Controls.jsx";
import Gallery from "../components/Gallery.jsx";
import ImageModal from "../components/ImageModal.jsx";

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 40;
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavLink = styled(Link)`
  color: #1e40af;
  text-decoration: none;
  font-weight: 600;
  &:hover { text-decoration: underline; }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  padding: 20px;
`;

const Panel = styled.div`
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 16px;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

const Button = styled.button`
  width: 100%;
  background: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: transparent;
    outline: none;
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  background: white;
  color: #1e40af;
  font-weight: 600;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background: #eff6ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: transparent;
    outline: none;
  }
`;

const Section = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.h2`
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #1e40af;
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #eff6ff; }
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: transparent;
    outline: none;
  }
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

const FloatingClear = styled.button`
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: white;
  color: #1e40af;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  cursor: pointer;
  z-index: 50;
  &:hover { background: #eff6ff; }
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: transparent; outline: none; }
`;

const Description = styled.p`
  color: #1e40af;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
`;

const KeywordsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Keyword = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
`;

const PreviewImage = styled.img`
  width: 100%;
  border-radius: 12px;
  margin-bottom: 12px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

function FirstTestInner() {
  const { logout } = useAuthRedux();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [lastUploadAt, setLastUploadAt] = useState(0);
  const [maxKeywords, setMaxKeywords] = useState(30);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  const MAX_FILE_MB = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const COOLDOWN_MS = 3000;

  const handleUpload = async (fileToUse, imageUrlForItem, originalName, precomputedHash) => {
    const selected = fileToUse || file;
    if (!selected) return;

    // cooldown guard
    const now = Date.now();
    if (now - lastUploadAt < COOLDOWN_MS) {
      setError("Please wait a moment before analyzing again.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selected);
    if (maxKeywords) formData.append("maxKeywords", String(maxKeywords));

    setLoading(true);

    try {
      // de-dup check by content hash
      try {
        const hash = precomputedHash || await computeBlobSha256Hex(selected);
        const existing = (await localforage.getItem("processed_items_v1")) || [];
        const found = Array.isArray(existing) && existing.find(it => it.contentHash === hash);
        if (found) {
          showToast("Already imported.");
          // open modal on existing item (prefer current state if present)
          const currentIdx = (items || []).findIndex(it => it.contentHash === hash);
          if (currentIdx >= 0) {
            setSelectedIndex(currentIdx);
            setIsModalOpen(true);
            return;
          }
          const idx = existing.findIndex(it => it.contentHash === hash);
          if (idx >= 0) {
            setItems(prev => [...prev, existing[idx]]);
            setSelectedIndex((items?.length || 0));
            setIsModalOpen(true);
          }
          return;
        }
      } catch {}
      
      const data = await analyzeImage(selected, maxKeywords);

      if ("description" in data || "keywords" in data || "title" in data) {
        const kw = Array.isArray(data.keywords)
          ? data.keywords
          : (data.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
        const newId = Date.now();
        try { await localforage.setItem(`image_blob_${newId}`, selected); } catch (_) {}
        const itemUrl = imageUrlForItem || previewUrl || URL.createObjectURL(selected);
        const newItem = {
          id: newId,
          imageUrl: itemUrl,
          title: data.title || "",
          description: data.description || "",
          keywords: kw,
          originalName: originalName || (selected && selected.name) || undefined,
          contentHash: precomputedHash || await computeBlobSha256Hex(selected),
        };
        setItems((prev) => [...prev, newItem]);
        setSelectedIndex((prev, _arr) => {
          const nextIndex = (items?.length || 0);
          return nextIndex;
        });
        setIsModalOpen(true);
      } else if (data.result) {
        try {
          const parsed = JSON.parse(data.result);
          const kw = Array.isArray(parsed.keywords)
            ? parsed.keywords
            : (parsed.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
          const newId = Date.now();
          try { await localforage.setItem(`image_blob_${newId}`, selected); } catch (_) {}
          const itemUrl = imageUrlForItem || previewUrl || URL.createObjectURL(selected);
          const newItem = {
            id: newId,
            imageUrl: itemUrl,
            title: parsed.title || "",
            description: parsed.description || "",
            keywords: kw,
            originalName: originalName || (selected && selected.name) || undefined,
            contentHash: precomputedHash || await computeBlobSha256Hex(selected),
          };
          setItems((prev) => [...prev, newItem]);
          setSelectedIndex((prev, _arr) => {
            const nextIndex = (items?.length || 0);
            return nextIndex;
          });
          setIsModalOpen(true);
        } catch {
          const newId = Date.now();
          try { await localforage.setItem(`image_blob_${newId}`, selected); } catch (_) {}
          const itemUrl = imageUrlForItem || previewUrl || URL.createObjectURL(selected);
          const newItem = {
            id: newId,
            imageUrl: itemUrl,
            title: "",
            description: data.result,
            keywords: [],
            originalName: originalName || (selected && selected.name) || undefined,
            contentHash: precomputedHash || await computeBlobSha256Hex(selected),
          };
          setItems((prev) => [...prev, newItem]);
          setSelectedIndex((prev, _arr) => {
            const nextIndex = (items?.length || 0);
            return nextIndex;
          });
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error analyzing image");
    } finally {
      setLoading(false);
      setLastUploadAt(Date.now());
    }
  };

  const handleFileChange = async (e) => {
    const nextFile = e.target.files?.[0] || null;
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (nextFile) {
      // basic FE validation (type)
      if (!ALLOWED_TYPES.includes(nextFile.type)) {
        setError("Only JPG, PNG or WebP images are allowed.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      // resize on client to reduce payload
      try {
        const { blob, url } = await resizeImage(nextFile, 1600, "image/jpeg", 0.85);
        const sizeMbAfter = blob.size / (1024 * 1024);
        if (sizeMbAfter > MAX_FILE_MB) {
          setError(`Image too large even after compression (> ${MAX_FILE_MB}MB). Try a smaller image.`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (url) URL.revokeObjectURL(url);
          return;
        }
        setPreviewUrl(url);
        // kick off analysis immediately; open modal after result is ready
        Promise.resolve().then(async () => {
          const hash = await computeBlobSha256Hex(blob);
          return handleUpload(blob, url, nextFile?.name, hash);
        }).catch((err) => { console.error('handleUpload chain failed', err); });
        // allow selecting the same file again
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (resizeErr) {
        console.error(resizeErr);
        setError("Failed to process image locally.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    setError("");
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const clearHistory = async () => {
    try {
      (items || []).forEach((it) => {
        if (it?.imageUrl && it.imageUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(it.imageUrl); } catch (_) {}
        }
      });
      try {
        await Promise.all((items || []).map((it) => localforage.removeItem(`image_blob_${it.id}`).catch(() => {})));
      } catch (_) {}
      setItems([]);
      await localforage.removeItem("processed_items_v1");
    } catch (e) {
      // ignore
    }
  };

  const showToast = (message) => {
    try { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); } catch (_) {}
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(""), 1800);
  };

  useEffect(() => {
    const off = toastBus.on((type, payload) => {
      if (type === 'toast') showToast(payload);
    });
    return () => { try { off && off(); } catch {} };
  }, []);

  const copyToClipboard = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast(label);
    } catch {
      showToast("Copy failed");
    }
  };

  // persist items to localForage
  useEffect(() => {
    localforage.setItem("processed_items_v1", items).catch(() => {});
  }, [items]);

  // load items on first mount (rebuild blob URLs from IndexedDB so thumbs render reliably)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await localforage.getItem("processed_items_v1");
        if (!mounted) return;
        if (Array.isArray(data)) {
          // Always attempt to rebuild blob URL from stored blob if available
          const restored = await Promise.all(
            data.map(async (it) => {
              try {
                const blob = await localforage.getItem(`image_blob_${it.id}`);
                if (blob instanceof Blob) {
                  const url = URL.createObjectURL(blob);
                  return { ...it, imageUrl: url };
                }
              } catch {}
              return it;
            })
          );
          setItems(restored);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Container>
      <Layout>
      <div>
          <Gallery
            items={items}
            onSelect={(idx) => { setSelectedIndex(idx); setIsModalOpen(true); }}
          />
      </div>
        <Panel>
          <Controls
            maxKeywords={maxKeywords}
            onChangeMaxKeywords={setMaxKeywords}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onOpenFileDialog={openFileDialog}
            loading={loading}
          />

          {error && (
            <Section>
              <SectionTitle>Error:</SectionTitle>
              <Description>{error}</Description>
            </Section>
          )}
        </Panel>
      </Layout>

      <ImageModal
        open={isModalOpen && selectedIndex !== null && items[selectedIndex]}
        item={items[selectedIndex]}
        error={error}
        loading={loading}
        onClose={() => setIsModalOpen(false)}
        onCopy={copyToClipboard}
        onEdit={(next) => {
          setItems(prev => prev.map((it, idx) => idx === selectedIndex ? {
            ...it,
            title: next.title,
            description: next.description,
            keywords: next.keywords,
          } : it));
          (async () => {
            try {
              const stored = await localforage.getItem("processed_items_v1") || [];
              const updated = Array.isArray(stored) ? stored.map((it, idx) => idx === selectedIndex ? {
                ...it,
                title: next.title,
                description: next.description,
                keywords: next.keywords,
              } : it) : stored;
              await localforage.setItem("processed_items_v1", updated);
            } catch {}
          })();
        }}
        onRemoveKeyword={(removeIdx) => {
          setItems(prev => prev.map((it, idx) => {
            if (idx !== selectedIndex) return it;
            const nextKw = (it.keywords || []).filter((_, i) => i !== removeIdx);
            return { ...it, keywords: nextKw };
          }));
          (async () => {
            try {
              const stored = await localforage.getItem("processed_items_v1") || [];
              const updated = Array.isArray(stored) ? stored.map((it, idx) => {
                if (idx !== selectedIndex) return it;
                const nextKw = (it.keywords || []).filter((_, i) => i !== removeIdx);
                return { ...it, keywords: nextKw };
              }) : stored;
              await localforage.setItem("processed_items_v1", updated);
            } catch {}
          })();
        }}
      />
      {items.length > 0 && (
        <FloatingClear onClick={clearHistory} title="Clear history">Clear</FloatingClear>
      )}
      {toastMessage && <Toast>{toastMessage}</Toast>}
    </Container>
  );
}

export default function FirstTest() { 
  return <FirstTestInner />; 
}

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
}
