import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useApi } from '../hooks/useApi.js';
import { useAuthRedux } from '../hooks/useAuthRedux.js';

const Container = styled.div`
  min-height: 100vh;
  background: var(--paper);
  display: flex;
  padding: 20px;
  justify-content: center;
`;

const PaymentCard = styled.div`
  max-width: 800px;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 40px;
`;

const Title = styled.h1`
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  letter-spacing: -0.015em;
  margin-bottom: 12px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: var(--muted);
  font-size: 18px;
  margin-bottom: 32px;
  text-align: center;
`;

const PackageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-bottom: 20px;
`;

const PackageCard = styled.div`
  padding: 28px 24px;
  border-radius: var(--radius);
  border: 1px solid ${p => (p.$selected ? 'var(--accent)' : 'var(--rule-strong)')};
  box-shadow: ${p => (p.$selected ? '0 0 0 1px var(--accent)' : 'none')};
  background: ${p => (p.$selected ? 'var(--accent-wash)' : 'var(--surface)')};
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

  &:hover { border-color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;

const NoTrialNote = styled.p`
  max-width: 520px;
  margin: 0 auto 28px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted);
  text-align: center;
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -10px;
  right: 16px;
  background: var(--accent);
  color: var(--paper);
  padding: 3px 10px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
`;

const PackageName = styled.h3`
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const PackageCredits = styled.div`
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 16px;
  margin-bottom: 8px;
`;

const PackagePrice = styled.div`
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 400;
  margin-bottom: 8px;
`;

const PackageDescription = styled.p`
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
`;

const PaymentForm = styled.div`
  background: var(--surface-2);
  border-radius: var(--radius);
  padding: 24px;
  border: 1px solid var(--rule);
`;

const FormTitle = styled.h3`
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 16px;
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--getty-wash);
  border: 1px solid var(--getty-line);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 16px;
  color: var(--getty);
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
  background: var(--accent);
  color: var(--paper);
  border: 1px solid var(--accent);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--accent-deep);
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
  color: var(--accent);
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
  background: transparent;
  color: var(--accent-deep);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--surface-2);
  }
`;

const PaymentMethodTabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? 'var(--accent)' : 'var(--rule-strong)')};
  background: ${(p) => (p.$active ? 'var(--accent-wash)' : 'var(--surface)')};
  color: ${(p) => (p.$active ? 'var(--accent-deep)' : 'var(--muted)')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    outline: none;
  }

  &:focus,
  &:active,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }
`;

const PayPalButtonsWrapper = styled.div`
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
`;

// Stripe Elements configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const PayPalButtonsBlock = React.memo(function PayPalButtonsBlock({ selectedPackage, createPayPalOrder, confirmPayPalSuccess, onPaymentSuccess }) {
  const containerRef = useRef(null);
  const buttonsRenderedRef = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const callbacksRef = useRef({ createPayPalOrder, confirmPayPalSuccess, onPaymentSuccess });
  callbacksRef.current = { createPayPalOrder, confirmPayPalSuccess, onPaymentSuccess };

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || !selectedPackage) return;
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&disable-funding=card`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [selectedPackage]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || !selectedPackage || success) return;
    if (buttonsRenderedRef.current) return;
    buttonsRenderedRef.current = true;

    const price = selectedPackage.price;
    const buttons = window.paypal.Buttons({
      createOrder: async () => {
        const orderId = await callbacksRef.current.createPayPalOrder(price);
        if (!orderId) throw new Error('Could not create order');
        return orderId;
      },
      onApprove: async (data) => {
        try {
          await callbacksRef.current.confirmPayPalSuccess(data.orderID);
          setSuccess(true);
          callbacksRef.current.onPaymentSuccess({ id: data.orderID });
        } catch (err) {
          console.error('PayPal confirm error:', err);
        }
      },
      style: { shape: 'rect', color: 'blue', layout: 'vertical' }
    });
    buttons.render(containerRef.current);
  }, [sdkReady, selectedPackage, success]);

  if (success) {
    return (
      <SuccessMessage>
        🎉 Payment successful! Your account is activated and 10,000 analyses have been added.
        You can now use all features of the application.
      </SuccessMessage>
    );
  }
  return (
    <PayPalButtonsWrapper>
      <div ref={containerRef} data-paypal-container />
    </PayPalButtonsWrapper>
  );
});

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
        🎉 Payment successful! Your account is activated and 10,000 analyses have been added. 
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
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const { getCreditPackages, createPaymentIntent, confirmPaymentSuccess, getCreditTransactions, downloadInvoice, getPayPalConfig, createPayPalOrder, confirmPayPalSuccess, isLoading } = useApi();
  const { setIsActive } = useAuthRedux();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packagesData = await getCreditPackages();
        setPackages(packagesData);
        if (packagesData.length > 0) {
          // Default to the cheapest pack — lowest-friction first purchase.
          const cheapest = [...packagesData].sort((a, b) => a.price - b.price)[0];
          setSelectedPackage(cheapest || packagesData[0]);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [getCreditPackages]);

  useEffect(() => {
    let cancelled = false;
    getPayPalConfig().then((enabled) => {
      if (!cancelled) setPaypalEnabled(!!enabled);
    });
    return () => { cancelled = true; };
  }, [getPayPalConfig]);

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
      await confirmPaymentSuccess(paymentIntent.id);
      setIsActive(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-user'));
      }
      if (showHistory) fetchTransactions();
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handlePayPalSuccess = async () => {
    setIsActive(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refresh-user'));
    }
    if (showHistory) fetchTransactions();
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
        <Title>Buy Analyses</Title>
        <Subtitle>
          {selectedPackage
            ? `Get ${selectedPackage.credits.toLocaleString()} AI analyses for $${selectedPackage.price}. `
            : ''}
          Each analysis = one image&apos;s title, description and iStock/Getty keywords.
        </Subtitle>

        <PackageContainer>
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              role="button"
              tabIndex={0}
              $selected={selectedPackage?.id === pkg.id}
              aria-pressed={selectedPackage?.id === pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPackage(pkg); }
              }}
            >
              {pkg.popular && <PopularBadge>Most Popular</PopularBadge>}
              <PackageName>{pkg.name}</PackageName>
              <PackageCredits>{pkg.credits.toLocaleString()} Analyses</PackageCredits>
              <PackagePrice>${pkg.price}</PackagePrice>
              <PackageDescription>{pkg.description}</PackageDescription>
            </PackageCard>
          ))}
        </PackageContainer>

        <NoTrialNote>
          No free trial: every analysis runs a vision model and costs real money, so
          a free tier just gets farmed. The Starter pack is the smallest way in — same
          $0.01 per image as every pack, and you only pay for analyses that return a result.
        </NoTrialNote>

        {selectedPackage && (
          <PaymentForm>
            <PaymentMethodTabs>
              <TabButton $active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')}>
                Pay with Card (Stripe)
              </TabButton>
              <TabButton $active={paymentMethod === 'paypal'} onClick={() => setPaymentMethod('paypal')}>
                Pay with PayPal
              </TabButton>
            </PaymentMethodTabs>
            {paymentMethod === 'card' && (
              <Elements stripe={stripePromise} options={{ disableLink: true }}>
                <CheckoutForm
                  selectedPackage={selectedPackage}
                  onPaymentSuccess={handlePaymentSuccess}
                  createPaymentIntent={createPaymentIntent}
                  isLoading={isLoading}
                />
              </Elements>
            )}
            {paypalEnabled && PAYPAL_CLIENT_ID && (
              <div style={{ display: paymentMethod === 'paypal' ? 'block' : 'none' }}>
                <FormTitle>Pay with PayPal</FormTitle>
                <SecurityBadge>
                  <StripeVerifiedLogo>
                    <VerifiedCheckmark>✓</VerifiedCheckmark>
                    <span>PayPal</span>
                  </StripeVerifiedLogo>
                  <div style={{ fontSize: '12px' }}>
                    Secure checkout with your PayPal account
                  </div>
                </SecurityBadge>
                <PayPalButtonsBlock
                  selectedPackage={selectedPackage}
                  createPayPalOrder={createPayPalOrder}
                  confirmPayPalSuccess={confirmPayPalSuccess}
                  onPaymentSuccess={handlePayPalSuccess}
                />
              </div>
            )}
            {paymentMethod === 'paypal' && (!paypalEnabled || !PAYPAL_CLIENT_ID) && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', background: '#f8fafc', borderRadius: 8 }}>
                PayPal is not configured. Please use <strong>Pay with Card (Stripe)</strong> or ask the administrator to set up PayPal.
              </div>
            )}
          </PaymentForm>
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
