import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';

function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();
  
  // Determine if we have a status code
  const statusCode = error?.status || error?.statusCode || 404;
  
  // Get appropriate error message
  const getErrorMessage = () => {
    if (error?.message) return error.message;
    
    switch (statusCode) {
      case 404:
        return "The page you're looking for doesn't exist.";
      case 403:
        return "You don't have permission to access this resource.";
      case 500:
        return "Server error. Our team has been notified.";
      default:
        return "Something went wrong.";
    }
  };

  // Check if we're in development mode - Vite-compatible approach
  const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV === true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* Color bar at top */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <div className="p-6 sm:p-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h1 className="text-7xl font-bold text-gray-900">
                {statusCode}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                  !
                </span>
              </h1>
              <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-4">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                {getErrorMessage()}
              </p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 shadow flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-blue-100 opacity-70"></div>
                <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-purple-100 opacity-70"></div>
                
                {/* Main illustration */}
                <div className="relative z-10 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                  <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional help section */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Need help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Contact Support</div>
                <p className="text-sm text-gray-600">Reach out to our support team for assistance.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Check Status</div>
                <p className="text-sm text-gray-600">View our system status page for updates.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Documentation</div>
                <p className="text-sm text-gray-600">Browse our help center for solutions.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display debug info only in development mode */}
        {isDevelopment && error?.stack && (
          <div className="p-4 mt-6 bg-gray-800 text-gray-300 overflow-auto max-h-40 rounded-lg">
            <details>
              <summary className="cursor-pointer text-yellow-400 font-mono text-sm">Error details (development only)</summary>
              <pre className="mt-2 text-xs font-mono">{error.stack}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorPage;
