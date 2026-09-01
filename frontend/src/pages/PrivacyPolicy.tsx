import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: August 31, 2026</p>

      <section className="space-y-6 text-slate-600 leading-relaxed">
        <p>
          Welcome to Relay. We respect your privacy and are committed to protecting the data collected through our analytics and AI knowledge base platform.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-6">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Data:</strong> Name, email address, and authentication details provided during registration.</li>
          <li><strong>Website Analytics Data:</strong> Page views, session duration, browser type, and referrer URLs gathered via the embedded Relay script tag.</li>
          <li><strong>Knowledge Base Content:</strong> Text, FAQs, and documents uploaded by account owners to train AI assistants.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-6">2. How We Use Information</h2>
        <p>We use collected data solely to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide dashboard analytics and widget functionality to website owners.</li>
          <li>Process RAG queries to enable custom AI responses via your uploaded Knowledge Base.</li>
          <li>Maintain network security and optimize system performance.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-6">3. Data Isolation & AI Usage</h2>
        <p>
          Your uploaded Knowledge Base data is strictly isolated to your specific account environment. We do not sell your data or use your confidential documents to train public foundational AI models.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-6">4. Contact Us</h2>
        <p>If you have questions regarding this privacy policy, contact us at <strong>support@relay-app.com</strong>.</p>
      </section>
    </div>
  );
};