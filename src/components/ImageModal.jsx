import React from "react";
import styled from "styled-components";
import MetadataEditor from "./MetadataEditor.jsx";
import { useEmbedToFolder } from "./AppHandlers.jsx";

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 80vw;
  height: 80vh;
  padding: 16px;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CloseButton = styled.button`
  color: #1e40af;
  background: transparent;
  border: none;
  font-size: 50px;
  cursor: pointer;
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: transparent; outline: none; }
`;

const ModalBody = styled.div`
  display: flex;
  gap: 20px;
  height: 100%;
  overflow: hidden;
`;

const LeftPane = styled.div`
  width: 30%;
  overflow: auto;
`;

const RightPane = styled.div`
  width: 70%;
  position: relative;
  overflow: auto;
`;

const Section = styled.div`
  margin-top: 20px;
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
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
`;

const Keyword = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #bfdbfe; }
`;

const PreviewImage = styled.img`
  width: 100%;
  border-radius: 12px;
  margin-bottom: 12px;
`;

const ActionButton = styled.button`
  background: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: #1d4ed8; }
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: transparent; outline: none; }
`;

export default function ImageModal({ open, item, error, loading, onClose, onCopy, onRemoveKeyword, onEdit }) {
  if (!open || !item) return null;
  const { embedOneToFolder } = useEmbedToFolder();
  const [previewUrl, setPreviewUrl] = React.useState(item.imageUrl);

  React.useEffect(() => {
    setPreviewUrl(item.imageUrl);
    return () => {
      try {
        if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.imageUrl]);
  const copyProps = async () => {
    try {
      const payload = {
        title: item.title || "",
        description: item.description || "",
        keywords: Array.isArray(item.keywords) ? item.keywords : (item.keywords || []).toString().split(',').map(s=>s.trim()).filter(Boolean),
      };
      await navigator.clipboard.writeText(JSON.stringify(payload));
      try {
        const { default: eventBus } = await import('../utils/toastEventBus.js');
        eventBus.emit('toast', 'Metadata copied');
      } catch {}
    } catch {}
  };
  React.useEffect(() => {
    const handler = (e) => {
      try {
        const isCopy = (e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey);
        if (!isCopy) return;
        e.preventDefault();
        copyProps();
      } catch {}
    };
    if (open) {
      window.addEventListener('keydown', handler);
    }
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [open, item]);
  const handleChange = (next) => {
    if (!onEdit) return;
    const kwArray = (next.keywords || "").split(',').map(s=>s.trim()).filter(Boolean);
    onEdit({ title: next.title || "", description: next.description || "", keywords: kwArray });
  };
  return (
    <ModalOverlay>
      <ModalCard>
        <ModalHeader>
          <SectionTitle>Preview & Result</SectionTitle>
          <CloseButton onClick={onClose} disabled={loading} aria-label="Close">×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <LeftPane>
            <PreviewImage
              src={previewUrl}
              alt="Preview"
              onError={async () => {
                try {
                  const { default: lf } = await import('localforage');
                  const blob = await lf.getItem(`image_blob_${item.id}`);
                  if (blob instanceof Blob) {
                    const fresh = URL.createObjectURL(blob);
                    setPreviewUrl(fresh);
                    return;
                  }
                } catch {}
                try {
                  const res = await fetch(item.imageUrl);
                  const blob = await res.blob();
                  const fresh = URL.createObjectURL(blob);
                  setPreviewUrl(fresh);
                } catch {}
              }}
            />
          </LeftPane>
          <RightPane>
            {error && (
              <Section>
                <SectionTitle>Error:</SectionTitle>
                <Description>{error}</Description>
              </Section>
            )}
            <MetadataEditor
              title={item.title || ""}
              description={item.description || ""}
              keywords={(item.keywords || []).join(", ")}
              onChange={handleChange}
              renderTitleHeader={() => (
                <SectionHeader>
                  <SectionTitle>Title:</SectionTitle>
                  <IconButton onClick={() => onCopy && onCopy(item.title || "", "Title copied")} aria-label="Copy title">⧉</IconButton>
                </SectionHeader>
              )}
              renderDescriptionHeader={() => (
                <SectionHeader>
                  <SectionTitle>Description:</SectionTitle>
                  <IconButton onClick={() => onCopy && onCopy(item.description || "", "Description copied")} aria-label="Copy description">⧉</IconButton>
                </SectionHeader>
              )}
              renderKeywordsHeader={() => (
                <SectionHeader>
                  <SectionTitle>Keywords:</SectionTitle>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <IconButton onClick={() => onCopy && onCopy((item.keywords || []).join(", ") || "", "Keywords copied")} aria-label="Copy keywords">⧉</IconButton>
                  </div>
                </SectionHeader>
              )}
            />
            <div style={{ marginTop: 12, position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 20 }}>
            <ActionButton
                onClick={copyProps}
                title="Copy metadata"
                aria-label="Copy metadata"
              >
                Copy metadata
              </ActionButton>
              <ActionButton
                onClick={async () => {
                  try {
                    // Try to fetch original blob from localForage (by id) if available, otherwise fallback to dataURL fetch
                    let blob = null;
                    try {
                      const lf = (await import('localforage')).default;
                      blob = await lf.getItem(`image_blob_${item.id}`);
                    } catch {}
                    if (!(blob instanceof Blob)) {
                      const res = await fetch(item.imageUrl);
                      blob = await res.blob();
                    }
                    await embedOneToFolder({
                      blob,
                      name: item.originalName || `image_${item.id}.jpg`,
                      title: item.title || "",
                      description: item.description || "",
                      keywords: item.keywords || [],
                    });
                    // success toast
                    try {
                      const { default: eventBus } = await import('../utils/toastEventBus.js');
                      eventBus.emit('toast', 'Embedded and saved.');
                    } catch {}
                  } catch (e) {
                    try {
                      const { default: eventBus } = await import('../utils/toastEventBus.js');
                      const msg = e && e.message === 'FSAPI_UNAVAILABLE' ? 'File System Access API not available' : 'Embedding failed';
                      eventBus.emit('toast', msg);
                    } catch {}
                  }
                }}
                title="Embed to folder"
                aria-label="Embed to folder"
              >
                Embed to folder
              </ActionButton>
            </div>
            {loading && (
              <Section>
                <SectionTitle>Analyzing...</SectionTitle>
                <Description>Please wait while we analyze your image.</Description>
              </Section>
            )}
          </RightPane>
        </ModalBody>
      </ModalCard>
    </ModalOverlay>
  );
}


