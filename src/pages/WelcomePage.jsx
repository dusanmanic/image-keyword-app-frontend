import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  padding: 20px;
  justify-content: center;
`;

const WelcomeCard = styled.div`
  height: 650px;
  max-width: 1000px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 32px;
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
  color: #1e40af;
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
  background: #eff6ff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #dbeafe;
`;

const CTATitle = styled.h3`
  color: #1e40af;
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
  background: #1e40af;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    navigate('/payment');
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
          <CTATitle>Ready to get started?</CTATitle>
          <CTAText>
            Get 10,000 credits for just $25 and start analyzing your images with AI-powered keyword generation!
          </CTAText>
          <BuyCreditsButton onClick={handleBuyCredits}>
            Buy Credits
          </BuyCreditsButton>
        </CTA>
      </WelcomeCard>
    </Container>
  );
}
