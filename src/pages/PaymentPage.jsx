import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useApi } from '../hooks/useApi.js';
import { useAuthRedux } from '../hooks/useAuthRedux.js';

const Container = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  padding: 20px;
  justify-content: center;
`;

const PaymentCard = styled.div`
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #1e40af;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 18px;
  margin-bottom: 32px;
  text-align: center;
`;

const PackageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
`;

const PackageCard = styled.div`
  padding: 32px;
  border-radius: 16px;
  border: 2px solid #1e40af;
  background: #eff6ff;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -8px;
  right: 16px;
  background: #1e40af;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const PackageName = styled.h3`
  color: #1e40af;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const PackageCredits = styled.div`
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 8px;
`;

const PackagePrice = styled.div`
  color: #1e40af;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const PackageDescription = styled.p`
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const PaymentForm = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
`;

const FormTitle = styled.h3`
  color: #1e40af;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  color: #059669;
  font-size: 14px;
  font-weight: 500;
`;

const StripeIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #635bff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const StripeVerifiedLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #059669;
`;

const VerifiedCheckmark = styled.div`
  width: 16px;
  height: 16px;
  background: #059669;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

const StripeCardElement = styled.div`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  margin-bottom: 16px;
  position: relative;
  
  /* Hide autofill suggestions */
  &::-webkit-autofill,
  &::-webkit-autofill:hover,
  &::-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #424770 !important;
  }
`;

const PayButton = styled.button`
  width: 100%;
  background: #1e40af;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  color: #059669;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`;

const HistorySection = styled.div`
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HistoryTitle = styled.h3`
  color: #1e40af;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const ToggleButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 16px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TransactionInfo = styled.div`
  flex: 1;
`;

const TransactionDescription = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const TransactionDate = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const TransactionActions = styled.div`
  display: flex;
  gap: 8px;
`;

const DownloadButton = styled.a`
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

// Stripe Elements configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ selectedPackage, onPaymentSuccess, createPaymentIntent, isLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setError(null);

    try {
      // Create payment intent
      const response = await createPaymentIntent(selectedPackage.price);
      const { clientSecret } = response;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentIntentId(paymentIntent.id);
        setSuccess(true);
        onPaymentSuccess(paymentIntent);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    }
  };

  if (success) {
    return (
      <SuccessMessage>
        🎉 Payment successful! Your account has been activated and credits have been added. 
        You can now use all features of the application.
      </SuccessMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit} autocomplete="off">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormTitle>Payment Details</FormTitle>
      
      <SecurityBadge>
        <StripeVerifiedLogo>
          <VerifiedCheckmark>✓</VerifiedCheckmark>
          <span>Stripe Verified</span>
        </StripeVerifiedLogo>
        <div style={{ fontSize: '12px' }}>
          Secured by Stripe • Your card details are never stored
        </div>
      </SecurityBadge>
      
      <StripeCardElement>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
            hidePostalCode: true,
            disableLink: true
          }}
        />
      </StripeCardElement>

      <PayButton type="submit" disabled={!stripe || isLoading}>
        {isLoading && <LoadingSpinner />}
        {isLoading ? 'Processing...' : `Pay $${selectedPackage.price}`}
      </PayButton>
    </form>
  );
};

export default function PaymentPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true); // Keep for initial packages loading
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const { getCreditPackages, createPaymentIntent, confirmPaymentSuccess, getCreditTransactions, downloadInvoice, isLoading } = useApi();
  const { setIsActive } = useAuthRedux();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packagesData = await getCreditPackages();
        setPackages(packagesData);
        if (packagesData.length > 0) {
          setSelectedPackage(packagesData[0]);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [getCreditPackages]);

  const fetchTransactions = async () => {
    try {
      const transactionsData = await getCreditTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchTransactions();
    }
    setShowHistory(!showHistory);
  };

  const handleDownloadInvoice = async (paymentIntentId) => {
    try {
      await downloadInvoice(paymentIntentId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Notify backend about successful payment
      const result = await confirmPaymentSuccess(paymentIntent.id);
      
      console.log('Payment success result:', result);
      
      // Update user status to active (payment was successful, so activate immediately)
      console.log('Setting isActive to true...');
      setIsActive(true);
      console.log('isActive set to true');
      
      // Refresh payment history if it's currently shown
      if (showHistory) {
        fetchTransactions();
      }
      
      console.log('Payment successful - user activated:', paymentIntent);
      // The success message will be shown by the CheckoutForm component
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <PaymentCard>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingSpinner style={{ margin: '0 auto 16px' }} />
            <p>Loading payment options...</p>
          </div>
        </PaymentCard>
      </Container>
    );
  }

  return (
    <Container>
      <PaymentCard>
        <Title>Buy Credits</Title>
        <Subtitle>
          Get 10,000 credits for just $25 and start analyzing your images with AI
        </Subtitle>

        <PackageContainer>
          {packages.map((pkg) => (
            <PackageCard key={pkg.id}>
              {pkg.popular && <PopularBadge>Most Popular</PopularBadge>}
              <PackageName>{pkg.name}</PackageName>
              <PackageCredits>{pkg.credits.toLocaleString()} Credits</PackageCredits>
              <PackagePrice>${pkg.price}</PackagePrice>
              <PackageDescription>{pkg.description}</PackageDescription>
            </PackageCard>
          ))}
        </PackageContainer>

        {selectedPackage && (
          <Elements stripe={stripePromise} options={{ disableLink: true }}>
            <PaymentForm>
              <CheckoutForm 
                selectedPackage={selectedPackage} 
                onPaymentSuccess={handlePaymentSuccess}
                createPaymentIntent={createPaymentIntent}
                isLoading={isLoading}
              />
            </PaymentForm>
          </Elements>
        )}

        <HistorySection>
          <HistoryHeader>
            <HistoryTitle>Payment History</HistoryTitle>
            <ToggleButton onClick={toggleHistory}>
              {showHistory ? 'Hide History' : 'Show History'}
            </ToggleButton>
          </HistoryHeader>
          
          {showHistory && (
            <TransactionList>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No payment history found
                </div>
              ) : (
                transactions.map((transaction) => (
                  <TransactionItem key={transaction.id}>
                    <TransactionInfo>
                      <TransactionDescription>
                        {transaction.description}
                      </TransactionDescription>
                      <TransactionDate>
                        {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                      </TransactionDate>
                    </TransactionInfo>
                    <TransactionActions>
                      <DownloadButton
                        onClick={() => handleDownloadInvoice(transaction.paymentIntentId)}
                        style={{ cursor: 'pointer' }}
                      >
                        Download Invoice
                      </DownloadButton>
                    </TransactionActions>
                  </TransactionItem>
                ))
              )}
            </TransactionList>
          )}
        </HistorySection>
      </PaymentCard>
    </Container>
  );
}
