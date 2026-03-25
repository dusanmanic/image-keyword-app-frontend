import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthRedux } from '../hooks/useAuthRedux.js';

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 35%, #f8fafc 100%);
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 10px;
`;

const BrandName = styled.span`
  font-size: clamp(16px, 3.5vw, 20px);
  font-weight: 700;
  color: #1e40af;
  font-family: 'Nunito Sans', system-ui, sans-serif;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GhostLink = styled(Link)`
  color: #1e40af;
  font-weight: 600;
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  &:hover {
    background: #eff6ff;
  }
`;

const PrimaryLink = styled(Link)`
  background: #1e40af;
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
  &:hover {
    background: #1d4ed8;
  }
`;

const Content = styled.div`
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 64px;
  font-family: 'Nunito Sans', system-ui, sans-serif;
`;

const Hero = styled.section`
  text-align: center;
  padding: 56px 0 48px;
  @media (min-width: 768px) {
    padding: 72px 0 56px;
  }
`;

const Headline = styled.h1`
  font-size: clamp(1.85rem, 4.5vw, 2.75rem);
  color: #0f172a;
  margin: 0 0 20px 0;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

const HeroLead = styled.p`
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: #475569;
  margin: 0 auto 32px;
  max-width: 640px;
  line-height: 1.65;
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const Section = styled.section`
  padding: 48px 0;
  border-top: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.35rem, 3vw, 1.65rem);
  color: #0f172a;
  margin: 0 0 12px 0;
  font-weight: 800;
  text-align: center;
`;

const SectionLead = styled.p`
  font-size: 1.05rem;
  color: #64748b;
  margin: 0 auto 28px;
  max-width: 720px;
  line-height: 1.65;
  text-align: center;
`;

const Prose = styled.div`
  font-size: 1.05rem;
  color: #334155;
  line-height: 1.75;
  max-width: 720px;
  margin: 0 auto;

  p {
    margin: 0 0 16px 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 8px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FeatureCard = styled.article`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.08);
  }
`;

const FeatureIcon = styled.div`
  font-size: 1.75rem;
  line-height: 1;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.1rem;
  color: #1e40af;
  margin: 0 0 8px 0;
  font-weight: 700;
`;

const FeatureText = styled.p`
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
`;

const Steps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 24px auto 0;
  max-width: 640px;
  counter-reset: step;
`;

const Step = styled.li`
  position: relative;
  padding-left: 52px;
  margin-bottom: 28px;
  font-size: 1rem;
  color: #334155;
  line-height: 1.65;
  counter-increment: step;

  &:last-child {
    margin-bottom: 0;
  }

  &::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #fff;
    font-weight: 800;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.25);
  }

  strong {
    color: #0f172a;
    display: block;
    margin-bottom: 4px;
    font-size: 1.05rem;
  }
`;

const CtaBand = styled.section`
  margin-top: 8px;
  padding: 40px 28px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
  color: #fff;
  text-align: center;
  box-shadow: 0 12px 40px rgba(30, 64, 175, 0.25);
`;

const CtaBandTitle = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  margin: 0 0 10px 0;
  font-weight: 800;
`;

const CtaBandText = styled.p`
  margin: 0 0 22px 0;
  opacity: 0.95;
  line-height: 1.55;
  font-size: 1rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
`;

const CtaBandRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const CtaPrimary = styled(Link)`
  display: inline-block;
  background: #fff;
  color: #1e40af;
  font-weight: 700;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  &:hover {
    background: #f8fafc;
  }
`;

const CtaGhost = styled(Link)`
  display: inline-block;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Footer = styled.footer`
  padding: 32px 24px 40px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.8);
`;

const FooterBrand = styled.div`
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 6px;
`;

export default function LandingPage() {
  const { isAuthenticated } = useAuthRedux();
  const loggedIn = isAuthenticated;

  return (
    <Shell>
      <TopBar>
        <Brand>
          <Logo src="/logo-app.svg" alt="" />
          <BrandName>Jaba Keyword</BrandName>
        </Brand>
        <TopActions>
          {loggedIn ? (
            <PrimaryLink to="/folders">Open app</PrimaryLink>
          ) : (
            <>
              <GhostLink to="/login">Log in</GhostLink>
              <PrimaryLink to="/login">Get started</PrimaryLink>
            </>
          )}
        </TopActions>
      </TopBar>

      <Content>
        <Hero>
          <Headline>Keywords and metadata built for stock contributors</Headline>
          <HeroLead>
            Jaba Keyword helps you organize image batches, refine titles and metadata, and run analyses so
            your files are ready for agencies and marketplaces—without juggling ten different tools.
          </HeroLead>
          <CtaRow>
            {loggedIn ? (
              <PrimaryLink to="/folders">Go to your folders</PrimaryLink>
            ) : (
              <>
                <PrimaryLink to="/login">Sign in</PrimaryLink>
                <GhostLink to="/login">Create an account</GhostLink>
              </>
            )}
          </CtaRow>
        </Hero>

        <Section aria-labelledby="about-heading">
          <SectionTitle id="about-heading">What is Jaba Keyword?</SectionTitle>
          <SectionLead>
            A single workspace where your stock workflow lives—from first import to final export.
          </SectionLead>
          <Prose>
            <p>
              Whether you shoot every day or upload in large batches, you need a clear place to sort
              projects, attach the right keywords, and keep titles and descriptions consistent.
              Jaba Keyword is designed around that reality: folders for structure, a focused editor for
              metadata, and analysis credits when you want help suggesting or refining keywords.
            </p>
            <p>
              Instead of losing files across drives and spreadsheets, you work inside one app that
              understands how stock contributors actually ship images—so you spend less time on admin
              and more time creating.
            </p>
          </Prose>
        </Section>

        <Section aria-labelledby="features-heading">
          <SectionTitle id="features-heading">What you can do</SectionTitle>
          <SectionLead>
            Everything in the app is built to support a repeatable, scalable workflow.
          </SectionLead>
          <FeatureGrid>
            <FeatureCard>
              <FeatureIcon>📁</FeatureIcon>
              <FeatureTitle>Folders &amp; batches</FeatureTitle>
              <FeatureText>
                Group shoots and campaigns in folders, then open a dedicated import view per batch so
                nothing gets mixed up between clients or sites.
              </FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>✏️</FeatureIcon>
              <FeatureTitle>Metadata that stays in sync</FeatureTitle>
              <FeatureText>
                Edit titles, descriptions, and keyword lists in one place. Fewer copy-paste errors and
                a clearer picture of what each file contains before you export.
              </FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🎯</FeatureIcon>
              <FeatureTitle>Analysis when you need it</FeatureTitle>
              <FeatureText>
                Use your analysis allowance to get suggestions and refinements aligned with how you
                keyword—buy more when your volume grows, right from the app.
              </FeatureText>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>📦</FeatureIcon>
              <FeatureTitle>Storage you can see</FeatureTitle>
              <FeatureText>
                Clear visibility into how much space your uploads use, so you can plan batches and
                stay within your plan without surprises.
              </FeatureText>
            </FeatureCard>
          </FeatureGrid>
        </Section>

        <Section aria-labelledby="steps-heading">
          <SectionTitle id="steps-heading">How it works</SectionTitle>
          <SectionLead>Four steps from login to export-ready files.</SectionLead>
          <Steps>
            <Step>
              <strong>Create an account and sign in</strong>
              Your workspace and folders are tied to your profile—pick up where you left off on any
              session.
            </Step>
            <Step>
              <strong>Organize with folders</strong>
              Create a folder per shoot or agency, then add images through the import flow so each
              batch stays traceable.
            </Step>
            <Step>
              <strong>Edit and keyword</strong>
              Open files in the metadata editor, tune titles and keyword lists, and run analyses when
              you want an extra pass on relevance or coverage.
            </Step>
            <Step>
              <strong>Finish and move on</strong>
              When metadata matches your standards, you are ready for your usual export or upload
              pipeline—without redoing work in another tool.
            </Step>
          </Steps>
        </Section>

        <CtaBand aria-labelledby="cta-final-heading">
          <CtaBandTitle id="cta-final-heading">Ready to tidy your keyword workflow?</CtaBandTitle>
          <CtaBandText>
            Sign in to open your folders, or create an account to start organizing imports and
            metadata in one place.
          </CtaBandText>
          <CtaBandRow>
            {loggedIn ? (
              <CtaPrimary to="/folders">Open Jaba Keyword</CtaPrimary>
            ) : (
              <>
                <CtaPrimary to="/login">Get started</CtaPrimary>
                <CtaGhost to="/login">I already have an account</CtaGhost>
              </>
            )}
          </CtaBandRow>
        </CtaBand>
      </Content>

      <Footer>
        <FooterBrand>Jaba Keyword</FooterBrand>
        <div>Keywords and metadata for stock contributors.</div>
      </Footer>
    </Shell>
  );
}
