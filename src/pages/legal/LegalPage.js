// src/pages/LegalPage.js

import React from 'react';
import './LegalPage.css';

const brandName = "Yacht Daywork";

function LegalPage() {
  return (
    <div className="legal-container">
      <header className="legal-header">
        <img src="/logos/Iniciales.png" alt={`${brandName} Logo`} className="legal-logo" />
        <h1 className="legal-title">Terms of Use</h1>
      </header>

      <main className="legal-content">
        <p>
          <strong>Effective date:</strong> June 01, 2025
        </p>

        <p>
          Welcome to {brandName}. By accessing or using any part of our platform—including our website and mobile application, and the modules SeaMarket, SeaServices, SeaJob, and SeaEvents—you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you must not use our services.
        </p>

        <h2>1. International Use & Compliance</h2>
        <p>
          Our platform operates globally. It is your sole responsibility to ensure that your activities on {brandName} comply with all applicable local, national, and international laws and regulations. {brandName} and its operators are not liable for any unlawful use, publication, transaction, or interaction performed by users, regardless of location.
        </p>

        <h2>2. User Responsibilities</h2>
        <p>
          All users are solely responsible for the content, products, services, job postings, events, profiles, and documents they post, offer, purchase, participate in, or share. You must not use {brandName} for any illegal or unauthorized purposes, including but not limited to:
        </p>
        <ul>
          <li>Posting, selling, or purchasing items or services prohibited by law</li>
          <li>Offering or applying to jobs in violation of labor or immigration laws</li>
          <li>Posting or attending events that violate local regulations</li>
          <li>Infringing third-party rights or intellectual property</li>
          <li>Sharing personal information without the right or permission to do so</li>
        </ul>

        <h2>3. No Liability for User Actions</h2>
        <p>
          {brandName} is a platform that connects users and facilitates listings, interactions, and transactions. We do not control, endorse, or verify user content or activities. You acknowledge and agree that {brandName} and its operators shall not be held responsible or liable for any damages, legal claims, losses, or consequences resulting from user actions or content, including but not limited to violations of laws, regulations, or third-party rights.
        </p>

        <h2>4. Cooperation with Authorities</h2>
        <p>
          We reserve the right to cooperate with law enforcement and regulatory authorities in any jurisdiction. We may disclose user information if required by law, regulation, or valid legal process.
        </p>

        <h2>5. Account Suspension & Content Removal</h2>
        <p>
          We reserve the right to remove any content or suspend or terminate any user account at our sole discretion, without notice, if we believe such action is necessary to comply with the law or to protect our platform and its users.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, {brandName} and its operators disclaim all liability for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our platform, user-generated content, or third-party interactions. Your use of {brandName} is at your own risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          We reserve the right to update or modify these Terms of Use at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. We recommend reviewing this page regularly.
        </p>

        <h2>8. Digital CV, Candidate Profile & Sharing</h2>
        <p>
          {brandName} may offer profile features such as a Candidate Profile and a shareable Digital CV link. These features are controlled by the user:
        </p>
        <ul>
          <li>Digital CV links are private by default and are shared only if the user chooses to share them.</li>
          <li>The user may revoke or disable a shared link. Once revoked, access to that link is blocked.</li>
          <li>The user may create a new link if they wish to share again.</li>
          <li>Documents uploaded to a profile may be set by the user as public, private, or listed without displaying the document itself.</li>
          <li>Any sharing of personal information, including contact details and documents, is the user’s sole decision and responsibility.</li>
        </ul>

        <p>
          Once you choose to share a Digital CV link or any personal content with third parties, you acknowledge that {brandName} cannot control how such third parties may use, store, copy, or further distribute that information. This applies even if access to the shared link is later revoked or disabled.
        </p>

        <h2>9. Job Applications & Direct Contact</h2>
        <p>
          {brandName} does not automatically share a user’s personal information with recruiters or third parties. When applying for a job or contacting another user, the candidate controls what information is shared, for example by sharing a Digital CV link or providing contact details directly.
        </p>

        <h2>10. Privacy Policy</h2>
        <p>
          Please also review our <a href="/privacy" className="legal-link">Privacy Policy</a> to understand how we collect, use, and protect your personal information, including our use of Google Analytics for statistical purposes, which you can disable via our cookie preferences tool.
        </p>

        <h2>11. Governing Law & Jurisdiction</h2>
        <p>
          Unless otherwise required by mandatory law, these Terms shall be governed by and construed in accordance with the laws of your country of residence, without regard to its conflict of law provisions.
        </p>

        <h2>12. Cookies</h2>
        <p>
          {brandName} uses cookies and similar technologies to improve user experience, analyze site traffic, and provide personalized content. By continuing to use our platform, you consent to the use of cookies in accordance with our <a href="/privacy" className="legal-link">Privacy Policy</a>. You can manage your cookie preferences at any time using our cookie settings tool available on the site.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions regarding these Terms of Use, please contact us at:{' '}
          <a href="mailto:info@yachtdaywork.com" className="legal-link">info@yachtdaywork.com</a>
        </p>
      </main>

      <footer className="legal-footer">
        &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
      </footer>
    </div>
  );
}

export default LegalPage;