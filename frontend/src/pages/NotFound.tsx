import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl font-extrabold text-copper mb-2">404</span>
      <h1 className="text-[23px] font-semibold text-ink mb-1.5 leading-tight">Page Not Found</h1>
      <p className="text-ink-muted text-xs max-w-md mb-6 leading-relaxed">
        Sorry, the dashboard route or resource you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="btn-primary px-5 py-2 text-sm"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};