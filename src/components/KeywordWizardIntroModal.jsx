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
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
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

const HighlightBox = styled.div`
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 16px;
  margin-top: 24px;
  border-radius: 8px;
`;

const HighlightText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #92400e;
  line-height: 1.5;
  font-weight: 500;
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
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
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

export default function KeywordWizardIntroModal({ onClose, onProceed }) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideKeywordWizardIntro', 'true');
    }
    onClose();
  };

  const handleProceed = () => {
    // Only hide if checkbox is checked
    if (dontShowAgain) {
      localStorage.setItem('hideKeywordWizardIntro', 'true');
      console.log('✅ Keyword Wizard intro hidden - localStorage set:', localStorage.getItem('hideKeywordWizardIntro'));
    }
    onProceed();
  };

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Icon>🪄</Icon>
          <Title>Keyword Wizard</Title>
          <Subtitle>AI-powered metadata generation in seconds</Subtitle>
        </Header>

        <Content>
          <Section>
            <SectionIcon>✨</SectionIcon>
            <SectionContent>
              <SectionTitle>What is Keyword Wizard?</SectionTitle>
              <SectionText>
                Keyword Wizard uses AI to automatically generate titles, descriptions, and Getty Images optimized keywords for your selected photos. No manual typing needed!
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>🎯</SectionIcon>
            <SectionContent>
              <SectionTitle>How to Use</SectionTitle>
              <SectionText>
                <strong>1.</strong> Select one or more images in the table (click checkboxes or Shift+Click for bulk selection)<br/>
                <strong>2.</strong> Click "Keyword Wizard" button<br/>
                <strong>3.</strong> Choose how many keywords (10-50)<br/>
                <strong>4.</strong> Click "Start Analysis" and wait for AI to process
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>📋</SectionIcon>
            <SectionContent>
              <SectionTitle>Folder Context</SectionTitle>
              <SectionText>
                If you added "Details for AI analysis" to your folder (location, theme, number of people), the AI will use this context to generate more accurate and relevant keywords.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>💡</SectionIcon>
            <SectionContent>
              <SectionTitle>Optional Extra Prompt</SectionTitle>
              <SectionText>
                You can add custom instructions like "emphasize outdoor activities" or "focus on business context" to guide the AI's keyword selection.
              </SectionText>
            </SectionContent>
          </Section>

          {/* Cost info - hidden until pricing is finalized
          <HighlightBox>
            <HighlightText>
              💰 <strong>Cost-Effective:</strong> Each analysis costs ~$0.01-0.02 depending on image complexity. Your spending limit is shown in the top-right corner.
            </HighlightText>
          </HighlightBox>
          */}
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
            Start Using Wizard
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  );
}

