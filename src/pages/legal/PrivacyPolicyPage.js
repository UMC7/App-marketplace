// src/pages/legal/PrivacyPolicyPage.js

import React from 'react';
import './PrivacyPolicyPage.css';

const brandName = "Yacht Daywork";

function PrivacyPolicyPage() {
  return (
    <div className="privacy-container">
      <header className="privacy-header">
        <img src="/logo192.png" alt={`${brandName} Logo`} className="privacy-logo" />
        <h1 className="privacy-title">Privacy Policy</h1>
      </header>
      <main className="privacy-content">
        <p>
          <strong>Effective date:</strong> June 13, 2025
        </p>

        <p>
          This Privacy Policy explains how {brandName} collects, uses, and protects your personal information when you use our platform, including SeaMarket, SeaServices, SeaJob, and SeaEvents.
        </p>

        <h2>1. Data Collection</h2>
        <p>
          We collect information you provide directly, such as when you register, create a profile, post content, or contact us. We also collect technical data (like IP address, device info, and usage data) for analytics and security.
        </p>

        <h2>2. Use of Data</h2>
        <p>
          Your data is used to provide and improve our services, communicate with you, comply with legal requirements, and protect our platform and users.
        </p>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share data with service providers and, if required by law, with authorities. Some data may be visible to other users as part of your profile or public posts.
        </p>

        <h2>4. Cookies & Tracking</h2>
        <p>
          Our platform uses cookies and similar technologies to ensure functionality and analyze traffic. You can manage cookie preferences in your browser settings.
        </p>

        <h2>5. International Users</h2>
        <p>
          Your data may be processed and stored in countries outside your own. By using our platform, you consent to this processing.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          Depending on your country, you may have rights to access, update, or delete your personal data. Contact us at <a href="mailto:info@yachtdaywork.com" className="privacy-link">info@yachtdaywork.com</a> for requests.
        </p>

        <h2>7. Changes to this Policy</h2>
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