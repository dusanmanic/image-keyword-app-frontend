import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuthRedux } from "../hooks/useAuthRedux.js";

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  padding: 20px;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: 560px) {
    padding: 12px;
  }
`;

const WelcomeCard = styled.div`
  width: 100%;
  max-width: 1000px;
  background: white;
  border-radius: 16px;
  padding: clamp(20px, 5vw, 40px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Title = styled.h1`
  color: var(--accent);
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 700;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 18px;
  margin-bottom: 32px;
  line-height: 1.6;
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const FeatureItem = styled.div`
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const FeatureIcon = styled.div`
  font-size: 24px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  color: var(--accent);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const CTA = styled.div`
  background: var(--accent-wash);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--accent-wash);
`;

const CTATitle = styled.h3`
  color: var(--accent);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CTAText = styled.p`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
`;

const BuyCreditsButton = styled.button`
  background: var(--accent);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--accent-hover);
  }
`;

const GoToFoldersButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #059669;
  }
`;

export default function WelcomePage() {
  const navigate = useNavigate();
  const { isActive } = useAuthRedux();

  const handleBuyCredits = () => {
    navigate('/payment');
  };

  const handleGoToFolders = () => {
    navigate('/folders');
  };

  return (
    <Container>
      <WelcomeCard>
        <Title>Photo Keyword Generator</Title>
        <Subtitle>
          AI-powered image analysis tool that automatically generates keywords, descriptions, and metadata for your photos. 
          Organize your image collection with intelligent categorization and efficient folder management.
        </Subtitle>
        
        <FeatureList>
          <FeatureItem>
            <FeatureIcon>🤖</FeatureIcon>
            <FeatureTitle>AI Analysis</FeatureTitle>
            <FeatureDescription>
              Upload images and get intelligent keywords, titles, and descriptions automatically generated using advanced AI.
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>📁</FeatureIcon>
            <FeatureTitle>Smart Folders</FeatureTitle>
            <FeatureDescription>
              Create organized folders with custom categories, colors, and tags for better image management and organization.
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Batch Processing</FeatureTitle>
            <FeatureDescription>
              Process multiple images at once for efficient keyword generation and bulk metadata management.
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>Analytics & Stats</FeatureTitle>
            <FeatureDescription>
              Track your progress with detailed statistics about your image collection and processing history.
            </FeatureDescription>
          </FeatureItem>
        </FeatureList>

        <CTA>
          {isActive === false ? (
            <>
              <CTATitle>Ready to get started?</CTATitle>
              <CTAText>
                Get 10,000 AI analyses for just $100 and start keyword extraction on your images!
              </CTAText>
              <BuyCreditsButton onClick={handleBuyCredits}>
                Buy Credits
              </BuyCreditsButton>
            </>
          ) : (
            <>
              <CTATitle>You're all set! 🎉</CTATitle>
              <CTAText>
                Your account is active. Start organizing your images by creating folders and analyzing them with AI.
              </CTAText>
              <GoToFoldersButton onClick={handleGoToFolders}>
                Go to Folders →
              </GoToFoldersButton>
            </>
          )}
        </CTA>
      </WelcomeCard>
    </Container>
  );
}
