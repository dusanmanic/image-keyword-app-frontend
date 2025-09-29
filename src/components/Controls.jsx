import React from "react";
import styled from "styled-components";

const Select = styled.select`
  color: #1e40af;
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin: 0 0 14px 0;
  background: white;
  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    border-color: #e5e7eb;
    outline: none;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
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

  &:hover { background: #1d4ed8; }
  &:disabled { background: #93c5fd; cursor: not-allowed; }
  &:focus, &:active, &:focus-visible, &:focus-within { border-color: transparent; outline: none; }
`;

export default function Controls({ maxKeywords, onChangeMaxKeywords, fileInputRef, onFileChange, onOpenFileDialog, loading }) {
  return (
    <>
      <Select value={maxKeywords} onChange={(e) => onChangeMaxKeywords(Number(e.target.value))}>
        <option value={10}>10 keywords</option>
        <option value={20}>20 keywords</option>
        <option value={30}>30 keywords</option>
        <option value={40}>40 keywords</option>
        <option value={50}>50 keywords</option>
      </Select>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
      />

      <Button onClick={onOpenFileDialog} disabled={loading}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </Button>
    </>
  );
}


