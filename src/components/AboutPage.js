import React from 'react';
import SEO from './SEO';
import '../styles/AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
      <SEO 
        title="About Clarifyall - Your Trusted AI Tool Directory"
        description="Learn about Clarifyall's mission to help you discover and compare the best AI tools. We organize 1000+ AI tools across 25+ categories with transparent pricing and quality reviews."
        keywords="about Clarifyall, AI tool directory, AI tool comparison platform, find AI tools, AI software directory, artificial intelligence tools, AI tool reviews, best AI tools platform, AI tool discovery"
        dynamicKeywords={{
          type: 'about',
          category: 'AI tools directory'
        }}
        canonicalUrl="/about"
        schemaType="website"
      />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">About Clarifyall</h1>
          <p className="about-subtitle">
            Your trusted directory for discovering and comparing AI tools
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              At Clarifyall, we believe that finding the right AI tool shouldn't be overwhelming. 
              With thousands of AI tools launching every month, we're here to help you cut through 
              the noise and discover the perfect solution for your needs.
            </p>
            <p className="section-text">
              Whether you're looking for AI writing assistants, image generators, coding tools, 
              or productivity enhancers, we've organized everything into clear categories with 
              honest descriptions and transparent pricing information.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-section features-section">
        <div className="about-container">
          <h2 className="section-title centered">What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Easy Discovery</h3>
              <p className="feature-description">
                Search and filter through thousands of AI tools with our intuitive interface. 
                Find exactly what you need in seconds.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="feature-title">Clear Categories</h3>
              <p className="feature-description">
                Browse 25+ categories from chatbots to video editing. Every tool is properly 
                categorized for easy navigation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Transparent Pricing</h3>
              <p className="feature-description">
                Filter by Free, Freemium, Free Trial, or Paid. Know exactly what you're getting 
                before you click.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Quality Reviewed</h3>
              <p className="feature-description">
                Every submission is reviewed by our team to ensure quality and accuracy. 
                No spam, no affiliate links.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="feature-title">Always Updated</h3>
              <p className="feature-description">
                New tools are added daily. Stay up-to-date with the latest AI innovations 
                in every category.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Community Driven</h3>
              <p className="feature-description">
                Anyone can submit tools. Help the community discover amazing AI solutions 
                you've found.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-section stats-section">
        <div className="about-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">1000+</div>
              <div className="stat-label">AI Tools</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">25+</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Free Access</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">Daily</div>
              <div className="stat-label">Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="about-section">
        <div className="about-container">
          <h2 className="section-title centered">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Search or Browse</h3>
              <p className="step-description">
                Use our search bar or browse by category to find AI tools that match your needs.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Filter & Compare</h3>
              <p className="step-description">
                Apply filters for pricing, categories, and features to narrow down your options.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Visit & Try</h3>
              <p className="step-description">
                Click "Visit Website" to explore the tool. Most offer free trials or free plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-section cta-section">
        <div className="about-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Discover Your Perfect AI Tool?</h2>
            <p className="cta-text">
              Join thousands of users who trust Clarifyall to find the best AI solutions
            </p>
            <div className="cta-buttons">
              <a href="/" className="cta-button primary">
                Browse Tools
              </a>
              <a href="/submit" className="cta-button secondary">
                Submit a Tool
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-section contact-section">
        <div className="about-container">
          <h2 className="section-title centered">Get in Touch</h2>
          <p className="contact-text">
            Have questions, suggestions, or want to report an issue? We'd love to hear from you!
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>contact@clarifyall.com</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
