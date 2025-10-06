import React from 'react';
import styled from 'styled-components';

const RadioGroupContainer = styled.div`
  display: flex;
  gap: 14px;
`;

const RadioLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$isSelected ? '#1e40af' : '#6b7280'};
  font-weight: 600;
  cursor: pointer;
`;

const RadioInput = styled.input`
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  appearance: none;
  border: ${props => props.$isSelected ? '2px solid #1e40af' : '2px solid #e5e7eb'};
  border-radius: 50%;
  background-color: white;
  position: relative;
  background-image: ${props => props.$isSelected ? 'radial-gradient(circle, #1e40af 6px, white 6px)' : 'none'};
`;

export default function RadioGroup({ 
  name, 
  options, 
  value, 
  onChange, 
  label
}) {
  return (
    <div style={{ display: 'grid'}}>
      {label && <span style={{ color: '#1e40af', fontWeight: 600, fontSize: 14 }}>{label}</span>}
      <RadioGroupContainer>
        {options.map((option) => (
          <RadioLabel 
            key={option.value} 
            $isSelected={value === option.value}
          >
            <RadioInput
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              $isSelected={value === option.value}
            />
            {option.label}
          </RadioLabel>
        ))}
      </RadioGroupContainer>
    </div>
  );
}
