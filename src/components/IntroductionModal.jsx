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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

export default function IntroductionModal({ onClose, onProceed, hasExistingFolders = false }) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideIntroModal', 'true');
    }
    onClose();
  };

  const handleProceed = () => {
    // Only hide if checkbox is checked
    if (dontShowAgain) {
      localStorage.setItem('hideIntroModal', 'true');
      console.log('✅ Introduction modal hidden - localStorage set:', localStorage.getItem('hideIntroModal'));
    }
    onProceed();
  };

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Icon>📁</Icon>
          <Title>Welcome to Folders!</Title>
          <Subtitle>Organize your images with smart AI assistance</Subtitle>
        </Header>

        <Content>
          <Section>
            <SectionIcon>🎯</SectionIcon>
            <SectionContent>
              <SectionTitle>What are Folders?</SectionTitle>
              <SectionText>
                Folders help you organize your photo sets. Each folder can contain multiple images from the same shoot or theme.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>🤖</SectionIcon>
            <SectionContent>
              <SectionTitle>AI-Powered Tagging</SectionTitle>
              <SectionText>
                When you analyze images, AI automatically suggests 1-2 category tags for your folder based on the content. Categories help you find and filter folders quickly.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>📝</SectionIcon>
            <SectionContent>
              <SectionTitle>Details for Better Analysis</SectionTitle>
              <SectionText>
                Add a description to your folder (shooting location, number of people, theme) to help AI generate more accurate keywords and descriptions for your images.
              </SectionText>
            </SectionContent>
          </Section>

          <Section>
            <SectionIcon>🏷️</SectionIcon>
            <SectionContent>
              <SectionTitle>Manual Tagging</SectionTitle>
              <SectionText>
                You can also manually select up to 3 category tags. Once you set tags (manually or automatically), they won't change on future analyses.
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
            {hasExistingFolders ? 'Got It!' : 'Create My First Folder'}
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  );
}

