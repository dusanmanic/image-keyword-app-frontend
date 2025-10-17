import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Icon = styled.div`
  font-size: 80px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
`;

const Message = styled.p`
  color: #4b5563;
  font-size: 18px;
  line-height: 1.7;
  margin: 0 0 32px 0;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 2px solid #bfdbfe;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
`;

const InfoText = styled.p`
  color: #1e40af;
  font-size: 16px;
  margin: 0;
  line-height: 1.7;
`;

const BuyCreditsButton = styled.button`
  background: #1e40af;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

export default function AccountDeactivatedPage() {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    navigate('/payment');
  };

  return (
    <Container>
      <Card>
        <Icon>💳</Icon>
        <Title>Account Needs Activation</Title>
        <Message>
          Your account is currently inactive. To start using AI-powered image analysis, 
          you need to purchase 10,000 credits for just $25 and activate your account.
        </Message>
        
        <InfoBox>
          <InfoText>
            <strong>How to get started?</strong>
            <br /><br />
            Simply buy 10,000 credits for just $25 using our secure payment system. Once your payment is processed, 
            your account will be automatically activated and you'll be able to use all features.
            <br /><br />
            Start analyzing your images right away! 🚀
          </InfoText>
        </InfoBox>
        
        <BuyCreditsButton onClick={handleBuyCredits}>
          Buy Credits & Activate Account 💳
        </BuyCreditsButton>
      </Card>
    </Container>
  );
}

