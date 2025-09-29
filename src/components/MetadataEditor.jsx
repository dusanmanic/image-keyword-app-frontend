import React from "react";
import styled from "styled-components";

export default function MetadataEditor({
  title,
  description,
  keywords,
  onChange,
  renderTitleHeader,
  renderDescriptionHeader,
  renderKeywordsHeader,
}) {
  const list = (keywords || "").split(',').map(s=>s.trim()).filter(Boolean);

  const addKeyword = (val) => {
    const t = (val || "").trim();
    if (!t) return;
    if (list.includes(t)) return;
    const next = [...list, t].join(', ');
    onChange && onChange({ title, description, keywords: next });
  };

  const removeAt = (idx) => {
    const next = list.filter((_, i) => i !== idx).join(', ');
    onChange && onChange({ title, description, keywords: next });
  };

  const chipsRef = React.useRef(null);
  const handleChipsKeyDown = (e) => {
    if (!onChange) return;
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      const sel = window.getSelection();
      const text = sel && sel.anchorNode ? sel.anchorNode.textContent : '';
      addKeyword(text);
      if (chipsRef.current) chipsRef.current.textContent = '';
      return;
    }
    if (e.key === 'Backspace') {
      const content = (chipsRef.current?.textContent || '').trim();
      if (!content && list.length) {
        e.preventDefault();
        removeAt(list.length - 1);
      }
    }
  };
  const handleChipsInput = () => {};
  const focusChips = () => { chipsRef.current && chipsRef.current.focus(); };

  const titleRef = React.useRef(null);
  const descRef = React.useRef(null);
  React.useEffect(() => {
    if (titleRef.current && (titleRef.current.textContent || '') !== (title || '')) {
      titleRef.current.textContent = title || '';
    }
  }, [title]);
  React.useEffect(() => {
    if (descRef.current && (descRef.current.textContent || '') !== (description || '')) {
      descRef.current.textContent = description || '';
    }
  }, [description]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        {renderTitleHeader ? renderTitleHeader() : <FieldLabel>Title:</FieldLabel>}
        <EditableTitleBox
          ref={titleRef}
          contentEditable={!!onChange}
          suppressContentEditableWarning
          data-placeholder="Title"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
          onInput={() => onChange && onChange({ title: titleRef.current?.textContent || '', description, keywords })}
        />
      </div>
      <div>
        {renderDescriptionHeader ? renderDescriptionHeader() : <FieldLabel>Description:</FieldLabel>}
        <EditableBox
          ref={descRef}
          contentEditable={!!onChange}
          suppressContentEditableWarning
          data-placeholder="Description"
          onInput={() => onChange && onChange({ title, description: descRef.current?.textContent || '', keywords })}
        />
      </div>
      <div>
        {renderKeywordsHeader ? renderKeywordsHeader() : <FieldLabel>Keywords:</FieldLabel>}
        <Chips onClick={focusChips}>
          {list.map((kw, idx) => (
            <Chip key={idx} title={onChange ? "Click to remove" : undefined} onClick={onChange ? () => removeAt(idx) : undefined}>{kw}</Chip>
          ))}
          <EditableKeywords
            ref={chipsRef}
            contentEditable={!!onChange}
            suppressContentEditableWarning
            onKeyDown={handleChipsKeyDown}
            onInput={handleChipsInput}
          />
          {!list.length && !(chipsRef.current && chipsRef.current.textContent) && (
            <Placeholder>Type keyword and press Enter</Placeholder>
          )}
        </Chips>
      </div>
    </div>
  );
}

export const FieldLabel = styled.h2`
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const EditableBox = styled.div`
  font-family: 'Nunito Sans';
  color: #1e40af;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  caret-color: #1e40af;
  white-space: pre-wrap;
  &:empty:before { content: attr(data-placeholder); color: #9ca3af; }
`;

export const EditableTitleBox = styled(EditableBox)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  cursor: text;
  background: #f9fafb;
  padding: 12px;
`;

export const Chip = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  &:hover { background: #bfdbfe; }
`;

export const EditableKeywords = styled.span`
  outline: none;
  color: #1e40af;
  caret-color: #1e40af;
`;

export const Placeholder = styled.span`
  color: #9ca3af;
  user-select: none;
`;


