import React from "react";
import styled from "styled-components";
import COUNTRIES from "../config/countries.json";
import { useStore } from "../store/index.js";
import DatePicker from "./DatePicker.jsx";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
`;

const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 540px;
  max-width: calc(100vw - 24px);
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Actions = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const PrimaryButton = styled.button`
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const SecondaryButton = styled.button`
  background: white;
  color: var(--accent);
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const Title = styled.h3`
  color: var(--accent);
  margin: 0;
  font-size: 22px;
`;

const InfoText = styled.div`
  color: #374151;
  font-size: 14px;
  line-height: 1.45;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Label = styled.div`
  min-width: 90px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
`;

const CountryCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const Relative = styled.div`
  width: 325px;
  position: relative;
`;

const TextInput = styled.input`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  width: 300px;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: none;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.15);
  max-height: 180px;
  overflow: auto;
  z-index: 2000;
`;

const Option = styled.div`
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  background: ${p => (p.$active ? "var(--accent-wash)" : "white")};
  cursor: pointer;
`;

const HelpRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HelpText = styled.div`
  color: #9ca3af;
  font-size: 12px;
`;

const InlineClear = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
`;

/**
 * iStock/Getty CSV export modal.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - defaultShootDate?: string (YYYY-MM-DD)
 * - onExport: ({ shootDate: string, country: string }) => void
 */
export default function IstockGettyExportModal({
  open,
  onClose,
  defaultShootDate = "",
  onExport,
  loading = false,
}) {
  const { showToast } = useStore();

  const [shootDate, setShootDate] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [countryQuery, setCountryQuery] = React.useState("");
  const [countryOpen, setCountryOpen] = React.useState(false);

  const countryLabels = React.useMemo(() => {
    try {
      return Object.values(COUNTRIES || {})
        .filter(Boolean)
        .map((s) => String(s))
        .sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }, []);

  const countryLabelSet = React.useMemo(
    () => new Set(countryLabels.map((s) => s.toLowerCase())),
    [countryLabels]
  );

  const applyCountry = React.useCallback((next) => {
    const val = String(next || "").trim();
    setCountry(val);
    setCountryQuery(val);
    setCountryOpen(false);
    try {
      localStorage.setItem("istock_country", val);
    } catch {}
  }, []);

  // Initialize when opened (and allow defaultShootDate + last country to prefill)
  React.useEffect(() => {
    if (!open) return;
    try {
      const savedCountry = localStorage.getItem("istock_country") || "";
      setShootDate((defaultShootDate || "").slice(0, 10));
      setCountry(savedCountry);
      setCountryQuery(savedCountry);
    } catch {
      setShootDate((defaultShootDate || "").slice(0, 10));
      setCountry("");
      setCountryQuery("");
    }
    setCountryOpen(false);
  }, [open, defaultShootDate]);

  if (!open) return null;

  const filteredCountries = countryLabels
    .filter((label) =>
      label.toLowerCase().includes(String(countryQuery || "").toLowerCase())
    )
    .slice(0, 80);

  return (
    <Overlay onClick={() => { if (!loading) onClose?.(); }}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title> iStock/Getty CSV export</Title>
        </Header>

        <Body>
          <InfoText>
            Optionally pick a <strong>country</strong>. The <strong>created date</strong> for each image comes from its EXIF metadata. You can leave country blank and edit it later on the site.
          </InfoText>

          {/* Shoot date commented out: we use imageCreatedAt (from EXIF) per image for the "created date" column in the CSV instead of a single override. */}
          {/* <Row>
            <Label>Shoot date</Label>
            <DatePicker
              id="istock-shoot-date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              placeholder="Enter date"
              width="180px"
            />
          </Row> */}

          <Row>
            <Label>Country</Label>

            <CountryCol>
              <Relative>
                <TextInput
                  value={countryQuery || ""}
                  disabled={loading}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setCountryOpen(true);
                  }}
                  onFocus={() => setCountryOpen(true)}
                  onBlur={() => setTimeout(() => setCountryOpen(false), 120)}
                  placeholder="Start typing…"
                />
                {countryQuery && (
                  <InlineClear
                    type="button"
                    disabled={loading}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyCountry("");
                    }}
                    title="Clear country"
                  >
                    ×
                  </InlineClear>
                )}

                {countryOpen && filteredCountries.length > 0 && (
                  <Dropdown>
                    {filteredCountries.map((label) => (
                      <Option
                        key={label}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyCountry(label);
                        }}
                        $active={label === country}
                      >
                        {label}
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </Relative>

              <HelpRow>
                <HelpText>Optional. Choose from the list (valid ESP values).</HelpText>
              </HelpRow>
            </CountryCol>
          </Row>
        </Body>

        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            onClick={() => {
              if (loading) return;
              const d = String(shootDate || "").trim();
              const c = String(countryQuery || "").trim();
              if (c && !countryLabelSet.has(c.toLowerCase())) {
                showToast(
                  "Please choose a valid country from the list (or clear it).",
                  "error"
                );
                return;
              }
              try {
                localStorage.setItem("istock_country", c);
              } catch {}
              onExport?.({ shootDate: d, country: c });
            }}
          >
            {loading ? "Exporting..." : "Export"}
          </PrimaryButton>
        </Actions>
      </Card>
    </Overlay>
  );
}

