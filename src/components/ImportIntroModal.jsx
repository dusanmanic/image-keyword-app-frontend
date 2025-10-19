import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  padding: 32px;
  text-align: center;
  color: white;
`;

const Icon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  font-size: 16px;
  opacity: 0.95;
`;

const Content = styled.div`
  padding: 32px;
`;

const Section = styled.div`
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionIcon = styled.div`
  font-size: 24px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
  flex-shrink: 0;
`;

const SectionContent = styled.div`
  flex: 1;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const SectionText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const Footer = styled.div`
  padding: 24px 32px;
  background: #f9fafb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
    }
  ` : `
    background: white;
    color: #6b7280;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
  margin-right: auto;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

export default function ImportIntroModal({ onClose, onProceed }) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideImportIntroModal', 'true');
    }
    onClose();
  };

  const handleProceed = () => {
    // Only hide if checkbox is checked
    if (dontShowAgain) {
      localStorage.setItem('hideImportIntroModal', 'true');
      console.log('✅ Import intro modal hidden - localStorage set:', localStorage.getItem('hideImportIntroModal'));
    }
    onProceed();
  };

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Icon>🖼️</Icon>
          <Title>Upload & Analyze Images</Title>
          <Subtitle>AI-powered metadata generation for stock photography</Subtitle>
        </Header>

        <Content>
          <Section>
            <SectionIcon>📤</SectionIcon>
            <SectionContent>
              <SectionTitle>Upload Images</SectionTitle>
              <SectionText>
                Click "Upload" or drag & drop images into the zone. Supports JPG, PNG, and other common image formats.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>🪄</SectionIcon>
            <SectionContent>
              <SectionTitle>AI Keyword Wizard</SectionTitle>
              <SectionText>
                Select images and click "Keyword Wizard" to generate titles, descriptions, and Getty-optimized keywords automatically. AI uses folder details for better accuracy.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>✏️</SectionIcon>
            <SectionContent>
              <SectionTitle>Edit Metadata</SectionTitle>
              <SectionText>
                Click any cell in the table to edit titles, descriptions, or keywords. Changes are saved automatically to the cloud.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>💾</SectionIcon>
            <SectionContent>
              <SectionTitle>Embed & Export</SectionTitle>
              <SectionText>
                "Embed to folder" saves metadata directly into image files (IPTC/XMP). "Export CSV" creates a spreadsheet for bulk uploads to stock sites.
              </SectionText>
            </SectionContent>
          </Section>
        </Content>

        <Footer>
          <CheckboxLabel>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show this again
          </CheckboxLabel>
          <Button $primary onClick={handleProceed}>
            Got It, Let's Start!
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  );
}

