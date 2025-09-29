import React from "react";
import styled from "styled-components";

const Section = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.h2`
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const GalleryGrid = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const Thumb = styled.img`
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
`;

export default function Gallery({ items, onSelect }) {
  if (!items?.length) return null;
  return (
    <Section>
      <SectionTitle>Processed images:</SectionTitle>
      <GalleryGrid>
        {items.map((it, idx) => (
          <Thumb key={it.id} src={it.imageUrl} alt={`Item ${idx + 1}`} onClick={() => onSelect(idx)} />
        ))}
      </GalleryGrid>
    </Section>
  );
}


