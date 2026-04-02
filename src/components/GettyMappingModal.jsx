import React, { useState, useEffect } from "react";
import styled from "styled-components";

/** Presets for `scoreWithFrequency` threshold (backend); default is Medium. */
export const GETTY_PRECISION_PRESETS = [
  {
    id: "strong",
    label: "Strong",
    value: 0.9,
    display: "0.90",
    hint: "Fewest tags, safest match.",
  },
  {
    id: "medium",
    label: "Medium",
    value: 0.7,
    display: "0.70",
    hint: "Balanced — good default.",
  },
  {
    id: "light",
    label: "Light",
    value: 0.55,
    display: "0.55",
    hint: "More tags, between Med/Low.",
  },
  {
    id: "low",
    label: "Low",
    value: 0.45,
    display: "0.45",
    hint: "Most tags, looser fit.",
  },
];

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 12px;
`;

const Card = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 14px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
`;

const AccentBar = styled.div`
  height: 3px;
  background: linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
`;

const Inner = styled.div`
  padding: 14px 16px 12px;
`;

const Title = styled.h3`
  color: #0f172a;
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.35;
`;

const Meta = styled.div`
  font-size: 11px;
  color: #64748b;
  line-height: 1.35;
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 5px;
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-bottom: 8px;
`;

const PresetCell = styled.label`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  min-height: 0;
  transition: border-color 0.12s ease, background 0.12s ease;

  &:hover {
    border-color: #cbd5e1;
    background: #fafafa;
  }

  ${(p) =>
    p.$checked
      ? `
    border-color: #f59e0b;
    background: #fffbeb;
  `
      : ""}

  ${(p) =>
    p.$disabled
      ? `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `
      : ""}
`;

const PresetTop = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PresetRadio = styled.input.attrs({ type: "radio" })`
  margin: 0;
  accent-color: #d97706;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
`;

const PresetTitle = styled.span`
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
  white-space: nowrap;
`;

const PresetBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #b45309;
  background: rgba(245, 158, 11, 0.18);
  padding: 1px 5px;
  border-radius: 4px;
`;

const PresetHint = styled.span`
  font-size: 10px;
  color: #64748b;
  line-height: 1.25;
  padding-left: 20px;
`;

const ForceCard = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  margin-bottom: 0;
  transition: border-color 0.12s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  ${(p) =>
    p.$disabled
      ? `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `
      : ""}
`;

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const CheckBox = styled.span`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.12s, background 0.12s;

  ${ForceCard}:hover:not([aria-disabled="true"]) & {
    border-color: #94a3b8;
  }

  ${(p) =>
    p.$checked
      ? `
    background: #d97706;
    border-color: #d97706;
  `
      : ""}
`;

const CheckMark = styled.svg`
  width: 10px;
  height: 10px;
  color: white;
`;

const ForceTitle = styled.div`
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
`;

const ForceHint = styled.div`
  font-size: 10px;
  color: #64748b;
  line-height: 1.3;
  margin-top: 2px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SecondaryButton = styled.button`
  background: #ffffff;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`;

/**
 * Modal: Getty/iStock mapping with match precision (score threshold) and optional force fill.
 */
export default function GettyMappingModal({
  open,
  onClose,
  onConfirm,
  maxKeywords = 50,
  selectedCount = 0,
  /** When false, primary + force option disabled (e.g. analysis not done). */
  mappingAllowed = true,
  disabledHint = "",
}) {
  const [force, setForce] = useState(false);
  const [precisionId, setPrecisionId] = useState("medium");

  useEffect(() => {
    if (open) {
      setForce(false);
      setPrecisionId("medium");
    }
  }, [open]);

  if (!open) return null;

  const canInteract = mappingAllowed;
  const selectedPreset =
    GETTY_PRECISION_PRESETS.find((p) => p.id === precisionId) || GETTY_PRECISION_PRESETS[1];

  return (
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="getty-map-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <Card onClick={(e) => e.stopPropagation()}>
        <AccentBar />
        <Inner>
          <Title id="getty-map-title">Map to Getty / iStock</Title>
          <Subtitle>
            Up to {maxKeywords} keywords · {selectedCount} image(s)
            {force ? " · merge if force on" : ""}
          </Subtitle>

          <Meta>
            Weighted score (embedding + popularity). Lower threshold → more tags on first pass.
          </Meta>

          {!mappingAllowed && disabledHint && (
            <Meta style={{ background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" }}>
              {disabledHint}
            </Meta>
          )}

          <SectionLabel>Match precision</SectionLabel>
          <PresetGrid role="radiogroup" aria-label="Getty match precision">
            {GETTY_PRECISION_PRESETS.map((p) => (
              <PresetCell
                key={p.id}
                $checked={precisionId === p.id}
                $disabled={!canInteract}
                aria-disabled={!canInteract ? "true" : undefined}
                title={p.hint}
              >
                <PresetTop>
                  <PresetRadio
                    name="getty-precision"
                    value={p.id}
                    checked={precisionId === p.id}
                    disabled={!canInteract}
                    onChange={() => setPrecisionId(p.id)}
                  />
                  <PresetTitle>{p.label}</PresetTitle>
                  <PresetBadge>{p.display}</PresetBadge>
                </PresetTop>
                <PresetHint>{p.hint}</PresetHint>
              </PresetCell>
            ))}
          </PresetGrid>

          <ForceCard
            $disabled={!canInteract}
            aria-disabled={!canInteract ? "true" : undefined}
            onClick={(e) => {
              if (!canInteract) e.preventDefault();
            }}
          >
            <HiddenCheckbox
              checked={force}
              disabled={!canInteract}
              onChange={(e) => setForce(e.target.checked)}
            />
            <CheckBox $checked={force} aria-hidden>
              {force && (
                <CheckMark viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                </CheckMark>
              )}
            </CheckBox>
            <span style={{ flex: 1, minWidth: 0 }}>
              <ForceTitle>Force fill</ForceTitle>
              <ForceHint>
                Weaker matches + top-up to {maxKeywords}. Fuller CSV, less precise.
              </ForceHint>
            </span>
          </ForceCard>

          <Actions>
            <SecondaryButton type="button" onClick={() => onClose?.()}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={!canInteract}
              onClick={() =>
                canInteract &&
                onConfirm?.({
                  force,
                  scoreThreshold: selectedPreset.value,
                })
              }
            >
              Run mapping
            </PrimaryButton>
          </Actions>
        </Inner>
      </Card>
    </Overlay>
  );
}
