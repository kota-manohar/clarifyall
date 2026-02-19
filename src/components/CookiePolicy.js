import React from 'react';
import SEO from './SEO';
import '../styles/LegalPages.css';

function CookiePolicy() {
  return (
    <div className="legal-page">
      <SEO 
        title="Cookie Policy - Clarifyall"
        description="Learn about how Clarifyall uses cookies and similar technologies to enhance your browsing experience."
        canonicalUrl="/cookies"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Cookie Policy</h1>
          <p className="legal-updated">Last Updated: January 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how Clarifyall ("we," "our," or "us") uses cookies and similar tracking technologies when you visit our website. This policy should be read in conjunction with our Privacy Policy and Terms of Service.
            </p>
            <p>
              By continuing to browse or use our website, you agree to our use of cookies as described in this policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p>
              Cookies can be "persistent" (remaining on your device until deleted or expired) or "session" (deleted when you close your browser).
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Types of Cookies We Use</h2>
            
            <h3>3.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
            </p>
            <div className="cookie-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>session_id</td>
                    <td>Maintains your session state</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>auth_token</td>
                    <td>Authenticates logged-in users</td>
                    <td>7 days</td>
                  </tr>
                  <tr>
                    <td>csrf_token</td>
                    <td>Protects against cross-site request forgery</td>
                    <td>Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.2 Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
            </p>
            <div className="cookie-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>user_preferences</td>
                    <td>Stores your display preferences</td>
                    <td>1 year</td>
                  </tr>
                  <tr>
                    <td>language</td>
                    <td>Remembers your language preference</td>
                    <td>1 year</td>
                  </tr>
                  <tr>
                    <td>theme</td>
                    <td>Stores your theme preference (light/dark)</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.3 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>
            <div className="cookie-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_ga</td>
                    <td>Google Analytics - distinguishes users</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>_gid</td>
                    <td>Google Analytics - distinguishes users</td>
                    <td>24 hours</td>
                  </tr>
                  <tr>
                    <td>_gat</td>
                    <td>Google Analytics - throttles request rate</td>
                    <td>1 minute</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.4 Marketing/Advertising Cookies</h3>
            <p>
              These cookies track your browsing habits to deliver advertisements that are relevant to you and your interests.
            </p>
            <div className="cookie-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_fbp</td>
                    <td>Facebook Pixel - tracks conversions</td>
                    <td>3 months</td>
                  </tr>
                  <tr>
                    <td>ads_prefs</td>
                    <td>Stores advertising preferences</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              We use services from third-party companies that may set cookies on your device. These include:
            </p>
            
            <h3>4.1 Google Analytics</h3>
            <p>
              We use Google Analytics to analyze website traffic and user behavior. Google Analytics uses cookies to collect information about how visitors use our site. This information is used to compile reports and help us improve our website.
            </p>
            <p>
              Learn more: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>
            </p>

            <h3>4.2 Social Media Platforms</h3>
            <p>
              We use social media plugins (Facebook, Twitter, LinkedIn) that may set cookies to track your interactions with social content.
            </p>

            <h3>4.3 Content Delivery Networks (CDN)</h3>
            <p>
              We use CDNs to deliver content efficiently. These services may set cookies for performance optimization.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Other Tracking Technologies</h2>
            
            <h3>5.1 Web Beacons</h3>
            <p>
              We may use web beacons (also known as pixel tags) in our emails to track whether emails are opened and which links are clicked.
            </p>

            <h3>5.2 Local Storage</h3>
            <p>
              We use browser local storage to store data locally on your device for improved performance and user experience.
            </p>

            <h3>5.3 Session Storage</h3>
            <p>
              We use session storage to temporarily store data during your browsing session.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul>
              <li><strong>Authentication:</strong> To identify you when you log in and keep you logged in</li>
              <li><strong>Security:</strong> To protect your account and detect fraudulent activity</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics:</strong> To understand how you use our website and improve our services</li>
              <li><strong>Performance:</strong> To optimize website speed and functionality</li>
              <li><strong>Advertising:</strong> To deliver relevant advertisements (if applicable)</li>
              <li><strong>Research:</strong> To conduct research and testing to improve user experience</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Managing Cookies</h2>
            
            <h3>7.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul>
              <li>View what cookies are stored on your device</li>
              <li>Delete cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>

            <h3>7.2 Browser-Specific Instructions</h3>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
            </ul>

            <h3>7.3 Opt-Out Tools</h3>
            <p>You can opt out of certain cookies using these tools:</p>
            <ul>
              <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
              <li><strong>Network Advertising Initiative:</strong> <a href="http://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">NAI Opt-Out</a></li>
              <li><strong>Digital Advertising Alliance:</strong> <a href="http://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">DAA Opt-Out</a></li>
            </ul>

            <h3>7.4 Impact of Disabling Cookies</h3>
            <p>
              Please note that if you disable or refuse cookies, some parts of our website may become inaccessible or not function properly. Essential cookies cannot be disabled as they are necessary for the website to function.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Cookie Consent</h2>
            <p>
              When you first visit our website, you will see a cookie consent banner. You can choose to:
            </p>
            <ul>
              <li><strong>Accept All:</strong> Allow all cookies</li>
              <li><strong>Reject Non-Essential:</strong> Only allow essential cookies</li>
              <li><strong>Customize:</strong> Choose which categories of cookies to allow</li>
            </ul>
            <p>
              You can change your cookie preferences at any time by clicking the "Cookie Settings" link in our footer.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Do Not Track Signals</h2>
            <p>
              Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. We do not currently respond to DNT signals, but we respect your privacy choices and provide cookie management options.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. International Users</h2>
            <p>
              If you are accessing our website from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located. By using our website, you consent to this transfer.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect information from children through cookies. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@clarifyall.com</p>
              <p><strong>Address:</strong> Clarifyall Privacy Team, [Your Address]</p>
            </div>
          </section>

          <section className="legal-section">
            <h2>14. Additional Resources</h2>
            <p>For more information about cookies and online privacy, visit:</p>
            <ul>
              <li><a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer">All About Cookies</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">Your Online Choices</a></li>
              <li><a href="https://ico.org.uk/for-the-public/online/cookies/" target="_blank" rel="noopener noreferrer">ICO - Cookies</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CookiePolicy;
