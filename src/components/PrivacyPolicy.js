import React from 'react';
import SEO from './SEO';
import '../styles/LegalPages.css';

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <SEO 
        title="Privacy Policy - Clarifyall"
        description="Learn how Clarifyall collects, uses, and protects your personal information. Read our comprehensive privacy policy."
        canonicalUrl="/privacy"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last Updated: January 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Clarifyall ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI tool directory services.
            </p>
            <p>
              By accessing or using Clarifyall, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password (encrypted), and profile picture</li>
              <li><strong>User-Generated Content:</strong> Tool submissions, reviews, ratings, and comments</li>
              <li><strong>Communication Data:</strong> Messages sent through our contact forms or support channels</li>
              <li><strong>Newsletter Subscriptions:</strong> Email addresses for our newsletter service</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns, and search queries</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies</li>
              <li><strong>Analytics Data:</strong> Aggregated statistics about user behavior and platform performance</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our AI tool directory services</li>
              <li><strong>Account Management:</strong> To create and manage your user account</li>
              <li><strong>Personalization:</strong> To customize your experience and provide relevant tool recommendations</li>
              <li><strong>Communication:</strong> To send you updates, newsletters, and respond to your inquiries</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            
            <h3>4.1 With Your Consent</h3>
            <p>We may share your information when you explicitly consent to such sharing.</p>

            <h3>4.2 Service Providers</h3>
            <p>We may share information with third-party service providers who perform services on our behalf, including:</p>
            <ul>
              <li>Cloud hosting providers</li>
              <li>Email service providers</li>
              <li>Analytics services</li>
              <li>Payment processors (if applicable)</li>
            </ul>

            <h3>4.3 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal requests.</p>

            <h3>4.4 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
          </section>

          <section className="legal-section">
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure password hashing using industry-standard algorithms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            
            <h3>6.1 Access and Portability</h3>
            <p>You can access and download your personal data from your account settings.</p>

            <h3>6.2 Correction</h3>
            <p>You can update or correct your personal information through your account settings.</p>

            <h3>6.3 Deletion</h3>
            <p>You can request deletion of your account and associated data by contacting us.</p>

            <h3>6.4 Opt-Out</h3>
            <p>You can opt out of marketing communications by clicking the unsubscribe link in our emails.</p>

            <h3>6.5 Cookie Management</h3>
            <p>You can control cookies through your browser settings. See our Cookie Policy for more details.</p>
          </section>

          <section className="legal-section">
            <h2>7. Children's Privacy</h2>
            <p>
              Clarifyall is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or legitimate business purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Third-Party Links</h2>
            <p>
              Our platform may contain links to third-party websites and AI tools. We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@clarifyall.com</p>
              <p><strong>Address:</strong> Clarifyall Privacy Team, [Your Address]</p>
            </div>
          </section>

          <section className="legal-section">
            <h2>13. GDPR Compliance (For EU Users)</h2>
            <p>If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):</p>
            <ul>
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p>To exercise these rights, please contact us using the information provided above.</p>
          </section>

          <section className="legal-section">
            <h2>14. California Privacy Rights (CCPA)</h2>
            <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):</p>
            <ul>
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
            <p>We do not sell personal information. To exercise your CCPA rights, please contact us.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
