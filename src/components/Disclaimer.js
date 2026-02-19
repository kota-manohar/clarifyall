import React from 'react';
import SEO from './SEO';
import '../styles/LegalPages.css';

function Disclaimer() {
  return (
    <div className="legal-page">
      <SEO 
        title="Disclaimer - Clarifyall"
        description="Read Clarifyall's disclaimer to understand the limitations and responsibilities regarding the use of our AI tool directory."
        canonicalUrl="/disclaimer"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Disclaimer</h1>
          <p className="legal-updated">Last Updated: January 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. General Disclaimer</h2>
            <p>
              The information provided by Clarifyall ("we," "us," or "our") on our website is for general informational purposes only. All information on the site is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>
            <p>
              <strong>UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.</strong>
            </p>
          </section>

          <section className="legal-section">
            <h2>2. AI Tool Information Disclaimer</h2>
            
            <h3>2.1 Third-Party Tools</h3>
            <p>
              Clarifyall is a directory and information platform for AI tools. We do not develop, own, operate, or control the AI tools listed on our platform. All AI tools featured on Clarifyall are third-party products and services.
            </p>

            <h3>2.2 No Endorsement</h3>
            <p>
              The inclusion of any AI tool on our platform does not constitute an endorsement, recommendation, or guarantee of its quality, performance, safety, legality, or suitability for any particular purpose. We do not verify the claims made by AI tool developers or vendors.
            </p>

            <h3>2.3 Accuracy of Information</h3>
            <p>
              While we strive to provide accurate and up-to-date information about AI tools, we cannot guarantee that all information is current, complete, or error-free. Tool features, pricing, availability, and terms of service may change without notice. Users should verify all information directly with the tool providers.
            </p>

            <h3>2.4 Tool Performance</h3>
            <p>
              We make no warranties or representations about the performance, functionality, reliability, or results of any AI tools listed on our platform. The actual performance of AI tools may vary based on numerous factors including but not limited to:
            </p>
            <ul>
              <li>User's specific use case and requirements</li>
              <li>Quality and format of input data</li>
              <li>Technical infrastructure and internet connectivity</li>
              <li>Tool updates and changes by the provider</li>
              <li>User's technical expertise and understanding</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. User Reviews and Ratings Disclaimer</h2>
            <p>
              User reviews, ratings, and comments on Clarifyall represent the personal opinions and experiences of individual users. These views do not reflect the opinions of Clarifyall and should not be considered as professional advice or recommendations.
            </p>
            <p>
              We do not verify the accuracy of user reviews and cannot guarantee that reviewers have actually used the tools they review. Reviews may be subjective, biased, or based on outdated information.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. No Professional Advice</h2>
            
            <h3>4.1 Not Legal, Financial, or Business Advice</h3>
            <p>
              The information on Clarifyall is not intended to be and does not constitute legal, financial, business, or professional advice. You should not rely on the information on our site as an alternative to professional advice from qualified professionals.
            </p>

            <h3>4.2 Not Technical Support</h3>
            <p>
              We do not provide technical support for the AI tools listed on our platform. For technical assistance, please contact the respective tool providers directly.
            </p>

            <h3>4.3 Consult Professionals</h3>
            <p>
              Before making any business, legal, financial, or technical decisions based on information found on Clarifyall, you should consult with qualified professionals in the relevant field.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. External Links Disclaimer</h2>
            <p>
              Clarifyall contains links to external websites and third-party AI tools. These external sites are not under our control, and we are not responsible for:
            </p>
            <ul>
              <li>The content, accuracy, or opinions expressed on external websites</li>
              <li>The privacy practices of external websites</li>
              <li>The security of external websites</li>
              <li>Any damages or losses caused by your use of external websites</li>
              <li>The availability or functionality of external websites</li>
            </ul>
            <p>
              The inclusion of any link does not imply endorsement by Clarifyall. You access external websites at your own risk.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Pricing and Availability Disclaimer</h2>
            <p>
              Pricing information for AI tools displayed on Clarifyall is provided for informational purposes only and may not be current or accurate. Prices are subject to change without notice by the tool providers.
            </p>
            <p>
              Tool availability, features, and pricing tiers may vary by region, user type, or other factors. Always verify current pricing and availability directly with the tool provider before making a purchase decision.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Affiliate Relationships Disclaimer</h2>
            <p>
              Clarifyall may participate in affiliate programs and may receive compensation when you click on links to certain AI tools or make purchases through our platform. This compensation does not influence our editorial content or tool listings.
            </p>
            <p>
              We strive to maintain objectivity and transparency in our platform, but you should be aware that affiliate relationships may exist.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. No Warranty Disclaimer</h2>
            <p>
              CLARIFYALL IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or completeness of information</li>
              <li>Uninterrupted or error-free service</li>
              <li>Security of data transmission</li>
              <li>Freedom from viruses or harmful components</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLARIFYALL SHALL NOT BE LIABLE FOR ANY:
            </p>
            <ul>
              <li>Direct, indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, or business opportunities</li>
              <li>Loss of data or information</li>
              <li>Business interruption</li>
              <li>Personal injury or property damage</li>
              <li>Damages arising from your use of AI tools found through our platform</li>
              <li>Damages resulting from reliance on information on our site</li>
            </ul>
            <p>
              This limitation applies even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. AI Technology Disclaimer</h2>
            
            <h3>10.1 Rapidly Evolving Field</h3>
            <p>
              Artificial Intelligence is a rapidly evolving field. Information about AI tools may become outdated quickly as new versions, features, and alternatives emerge. We cannot guarantee that our information reflects the latest developments.
            </p>

            <h3>10.2 AI Limitations</h3>
            <p>
              AI tools have inherent limitations and may produce errors, biases, or unexpected results. Users should:
            </p>
            <ul>
              <li>Verify AI-generated outputs before use</li>
              <li>Understand the limitations of AI technology</li>
              <li>Use AI tools responsibly and ethically</li>
              <li>Comply with applicable laws and regulations</li>
              <li>Respect intellectual property rights</li>
            </ul>

            <h3>10.3 Ethical Considerations</h3>
            <p>
              Users are responsible for ensuring their use of AI tools complies with ethical standards, industry regulations, and applicable laws. Clarifyall does not provide guidance on the ethical use of AI tools.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Data Security Disclaimer</h2>
            <p>
              While we implement security measures to protect our platform, we cannot guarantee the security of information transmitted through the internet. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>Protecting sensitive information you share with AI tools</li>
              <li>Understanding the data practices of AI tools you use</li>
              <li>Complying with data protection regulations applicable to your use</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Compliance Disclaimer</h2>
            <p>
              Users are solely responsible for ensuring their use of AI tools complies with:
            </p>
            <ul>
              <li>Local, state, national, and international laws</li>
              <li>Industry-specific regulations (e.g., HIPAA, GDPR, CCPA)</li>
              <li>Professional standards and codes of conduct</li>
              <li>Organizational policies and guidelines</li>
              <li>Intellectual property laws and licensing agreements</li>
            </ul>
            <p>
              Clarifyall does not provide legal advice regarding compliance matters.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes and Updates</h2>
            <p>
              We reserve the right to modify, update, or remove any information on Clarifyall at any time without notice. We are not obligated to update information or correct errors, although we strive to maintain accuracy.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Geographic Limitations</h2>
            <p>
              AI tools listed on Clarifyall may not be available in all geographic regions. Some tools may have restrictions based on:
            </p>
            <ul>
              <li>Country or region</li>
              <li>Local laws and regulations</li>
              <li>Language support</li>
              <li>Payment methods</li>
              <li>Export controls</li>
            </ul>
            <p>
              Verify availability in your region before attempting to use any AI tool.
            </p>
          </section>

          <section className="legal-section">
            <h2>15. User Responsibility</h2>
            <p>
              By using Clarifyall, you acknowledge and agree that:
            </p>
            <ul>
              <li>You are solely responsible for your use of AI tools</li>
              <li>You will conduct your own due diligence before using any AI tool</li>
              <li>You will read and agree to the terms of service of AI tools you use</li>
              <li>You understand the risks associated with AI technology</li>
              <li>You will use AI tools ethically and legally</li>
              <li>You will not hold Clarifyall liable for any issues arising from your use of AI tools</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>16. Fair Use and Copyright</h2>
            <p>
              Content on Clarifyall, including tool descriptions, screenshots, and logos, may be subject to copyright and trademark protections. We believe our use of such content constitutes fair use for informational and educational purposes.
            </p>
            <p>
              If you believe any content on our site infringes your intellectual property rights, please contact us immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>17. Errors and Omissions</h2>
            <p>
              Despite our best efforts, Clarifyall may contain:
            </p>
            <ul>
              <li>Typographical errors</li>
              <li>Inaccuracies in tool information</li>
              <li>Outdated pricing or features</li>
              <li>Broken links</li>
              <li>Technical errors</li>
            </ul>
            <p>
              We do not warrant that our site is free from errors or omissions. If you notice an error, please report it to us, but we are not obligated to correct it.
            </p>
          </section>

          <section className="legal-section">
            <h2>18. Testimonials and Case Studies</h2>
            <p>
              Any testimonials, case studies, or success stories on Clarifyall represent individual experiences and may not be typical. Results may vary based on numerous factors. Past performance does not guarantee future results.
            </p>
          </section>

          <section className="legal-section">
            <h2>19. Contact Information</h2>
            <p>
              If you have questions about this disclaimer or need clarification on any matter, please contact us:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> legal@clarifyall.com</p>
              <p><strong>Address:</strong> Clarifyall Legal Department, [Your Address]</p>
            </div>
          </section>

          <section className="legal-section">
            <h2>20. Acceptance of Disclaimer</h2>
            <p>
              By using Clarifyall, you acknowledge that you have read, understood, and agree to this disclaimer. If you do not agree with any part of this disclaimer, you should not use our platform.
            </p>
            <p>
              This disclaimer should be read in conjunction with our Terms of Service and Privacy Policy, which are incorporated herein by reference.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Disclaimer;
