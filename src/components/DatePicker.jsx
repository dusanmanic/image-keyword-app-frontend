import React, { useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import DatePickerLib from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Wrap = styled.div`
  width: 200px;
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #e5e7eb;
  background: transparent;
  border-radius: 8px;
  width: ${props => props.$width || '180px'};
  color: #1e40af;
  color-scheme: light;
  font-family: 'Nunito Sans';
  font-size: 14px;

  &::-webkit-calendar-picker-indicator {
    opacity: 1;
    display: block;
    cursor: pointer;
    filter: invert(16%) sepia(83%) saturate(958%) hue-rotate(205deg) brightness(90%) contrast(95%);
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
    background: transparent;
  }
`;

const Icon = styled.span`
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #1e40af;
`;

export default function DatePicker({ id, value, onChange, placeholder, width }) {
  const selected = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const handleChange = (date) => {
    if (!onChange) return;
    if (!date) { onChange({ target: { value: '' } }); return; }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    onChange({ target: { value: `${yyyy}-${mm}-${dd}` } });
  };

  return (
    <Wrap>
      <GlobalStyles />
      <StyledDatePicker
        id={id}
        selected={selected}
        onChange={handleChange}
        placeholderText={placeholder}
        dateFormat="yyyy-MM-dd"
        popperPlacement="bottom-start"
        showPopperArrow
        isClearable={false}
        customInput={<Input as="input" $width={width} />}
      />
      {selected && (
        <ClearButton type="button" onClick={()=> handleChange(null)} title="Clear date">×</ClearButton>
      )}
    </Wrap>
  );
}

const StyledDatePicker = styled(DatePickerLib)`

`;

const GlobalStyles = createGlobalStyle`
  .react-datepicker {
    border: 1px solid #e5e7eb !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.12) !important;
    overflow: hidden;
    font-family: 'Nunito Sans';
  }
  .react-datepicker__header {
    background: #eff6ff !important;
    border-bottom: 1px solid #e5e7eb !important;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: #1e40af !important;
  }
  .react-datepicker__day--today {
    border-radius: 50%;
    outline: 2px solid #93c5fd;
  }

  /* Ensure library close icon stays hidden */
  .react-datepicker__close-icon { display: none !important; }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eff6ff;
  border: 1px solid #cbd5e1;
  color: #1e40af;
  font-weight: 700;
  line-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;


