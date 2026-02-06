// src/pages/legal/PrivacyPolicyPage.js

import React from 'react';
import './PrivacyPolicyPage.css';

const brandName = "Yacht Daywork";

function PrivacyPolicyPage() {
  return (
    <div className="privacy-container">
      <header className="privacy-header">
        <img src="/logos/Iniciales.png" alt={`${brandName} Logo`} className="privacy-logo" />
        <h1 className="privacy-title">Privacy Policy</h1>
      </header>
      <main className="privacy-content">
        <p>
          <strong>Effective date:</strong> June 01, 2025
        </p>

        <p>
          This Privacy Policy explains how {brandName} collects, uses, and protects your personal information when you use our platform (website and mobile application), including SeaMarket, SeaServices, SeaJob, and SeaEvents.
        </p>

        <h2>1. Data Collection</h2>
        <p>
          We collect information you provide directly, such as when you register, create a profile, complete a Candidate Profile, upload documents, post content, or contact us. We also collect technical data (like IP address, device info, and usage data) for analytics, security, and performance monitoring.
        </p>

        <h2>2. Use of Data</h2>
        <p>
          Your data is used to provide and improve our services, communicate with you, comply with legal requirements, and protect our platform and users.
        </p>

        <h2>3. Candidate Profile, Digital CV & User-Controlled Sharing</h2>
        <p>
          {brandName} may offer a Candidate Profile and a shareable Digital CV link. Sharing is controlled by the user:
        </p>
        <ul>
          <li>Digital CV links are private by default and are shared only if the user chooses to share them.</li>
          <li>The user may revoke or disable a shared link. Once revoked, access to that link is blocked.</li>
          <li>The user may create a new link if they wish to share again.</li>
          <li>Documents uploaded to a profile can be set by the user as public, private, or listed without displaying the document itself.</li>
          <li>{brandName} does not automatically share your personal information with recruiters or third parties; the user decides what to share and when.</li>
        </ul>

        <h2>4. Sharing Links, Public Posting & Third-Party Copies</h2>
        <p>
          If you choose to share your Digital CV link or publish any content publicly, you understand that people who access that content may view, download, copy, store, or share it. If you post or share a link in a public space, it may be forwarded or saved by others and could potentially be indexed by search engines depending on where it is posted.
        </p>
        <p>
          Revoking a link will block access to that link on {brandName}, but it cannot delete or retrieve copies that third parties may have already saved outside of our platform.
        </p>

        <h2>5. Service Providers (Processors)</h2>
        <p>
          We use trusted third-party service providers to help us operate, secure, and improve the platform. These providers process data on our behalf for specific purposes such as hosting, database/storage, email delivery, analytics, security, and spam/abuse prevention. We do not allow these providers to use your personal data for their own independent purposes.
        </p>

        <h2>6. Google Analytics</h2>
        <p>
          We use Google Analytics to collect anonymous statistical information about the usage of our platform, such as page visits, session duration, and navigation paths.  
          This data helps us improve the platform experience.  
          Google Analytics may set cookies in your browser unless you disable statistical cookies in our cookie preferences tool.
        </p>
        <p>
          For more information, please review the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
        </p>

        <h2>7. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share data with service providers and, if required by law, with authorities. Some data may become visible to other users only if you choose to share it (for example, by sharing a Digital CV link or publishing information you decide to make public).
        </p>

        <h2>8. Cookies & Tracking</h2>
        <p>
          Our platform uses cookies and similar technologies to ensure functionality and analyze traffic.  
          You can accept or reject optional cookies (including statistics and marketing) using our cookie preferences tool at any time.  
          For more information about our use of cookies, please also review our <a href="/legal" className="privacy-link">Terms of Use</a>.
        </p>

        <h2>9. Data Security</h2>
        <p>
          We implement reasonable technical and organizational measures designed to protect personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>10. Data Retention</h2>
        <p>
          We retain personal data only for as long as reasonably necessary to provide the services, comply with legal obligations, resolve disputes, enforce our agreements, and protect the security and integrity of the platform. Retention periods may vary depending on the type of data (for example, account data, logs, messages, and uploaded documents).
        </p>
        <p>
          You may request deletion of your account or personal data by contacting us. Some information may be retained where required by law or for legitimate security and fraud-prevention purposes.
        </p>

        <h2>11. Data Breach Response</h2>
        <p>
          If we become aware of a personal data breach that is likely to result in a risk to your rights and freedoms, we will take appropriate steps to investigate, mitigate, and notify affected users and/or relevant authorities where required by applicable law.
        </p>

        <h2>12. International Users</h2>
        <p>
          Your data may be processed and stored in countries outside your own. By using our platform, you consent to this processing.
        </p>

        <h2>13. Your Rights</h2>
        <p>
          Depending on your country, you may have rights to access, update, or delete your personal data. Contact us at <a href="mailto:info@yachtdaywork.com" className="privacy-link">info@yachtdaywork.com</a> for requests.
        </p>

        <h2>14. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy. Material changes will be communicated through the platform or by email where possible.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions about this policy or your data, please email <a href="mailto:info@yachtdaywork.com" className="privacy-link">info@yachtdaywork.com</a>
        </p>
      </main>
      <footer className="privacy-footer">
        &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
      </footer>
    </div>
  );
}

export default PrivacyPolicyPage;